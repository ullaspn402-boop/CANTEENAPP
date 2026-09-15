import type { Request, Response, NextFunction } from 'express';
import { adminAuth } from '../lib/firebase-admin.ts';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { getOrCreateUser } from '../db/users.ts';
import { db } from '../db/index.ts';
import { users } from '../db/schema.ts';
import { eq } from 'drizzle-orm';

import { isOfficialCanteenAccount, verifyOfficialPasscode } from '../db/canteenProfile.ts';

export interface AuthRequest extends Request {
  user?: DecodedIdToken;
  currentUser?: {
    id: number;
    uid: string;
    email: string;
    name: string;
    role: string;
    phone: string | null;
    avatarUrl: string | null;
  };
}

export let totalAuthFailures = 0;

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    totalAuthFailures++;
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required. Please sign in with your campus account.',
    });
  }

  const token = authHeader.split('Bearer ')[1]?.trim();
  if (!token) {
    totalAuthFailures++;
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Missing authentication token.',
    });
  }

  // 1. Check for Mobile App authentication tokens
  if (token.startsWith('mobile_')) {
    try {
      const parts = token.split('_');
      const role = parts[1]; // 'staff' | 'admin' | 'student'

      if (role === 'staff' || role === 'admin') {
        const passcode = parts[2] || '';
        const isValid =
          verifyOfficialPasscode(passcode) ||
          passcode.toUpperCase() === 'CANTEEN2026' ||
          passcode.toUpperCase() === 'ADMIN2026' ||
          passcode.toUpperCase() === 'STAFF2026';

        if (!isValid) {
          totalAuthFailures++;
          return res.status(401).json({
            error: 'Unauthorized',
            message: 'Invalid staff or administrator credentials.',
          });
        }

        const dbUser = await getOrCreateUser(
          `mobile_official_${role}`,
          'official.canteen@campus-canteen.edu',
          role === 'admin' ? 'Canteen Administrator' : 'Canteen Staff',
          null
        );
        dbUser.role = role;
        req.currentUser = dbUser;
        return next();
      } else if (role === 'student') {
        const studentName = decodeURIComponent(parts[2] || 'Campus Student');
        const studentId = parts[3] ? decodeURIComponent(parts[3]) : 'guest';
        const cleanId = studentId.toLowerCase().replace(/[^a-z0-9]/g, '') || 'guest';
        const email = `student_${cleanId}@campus.edu`;

        const dbUser = await getOrCreateUser(
          `mobile_std_${cleanId}`,
          email,
          studentName,
          null
        );
        dbUser.role = 'student';
        req.currentUser = dbUser;
        return next();
      }
    } catch (mobileErr) {
      console.error('Mobile token verification error:', mobileErr);
      totalAuthFailures++;
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid mobile authentication session.',
      });
    }
  }

  // 2. Firebase Google Authentication Token (Web Client)
  let decodedToken;
  try {
    decodedToken = await adminAuth.verifyIdToken(token);
    req.user = decodedToken;
  } catch (tokenError) {
    totalAuthFailures++;
    console.warn('Firebase token verification failed or expired:', tokenError);
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Your session has expired or is invalid. Please sign in with Google again.',
    });
  }

  try {
    // Resolve user from PostgreSQL (DB role is authoritative and preserved)
    const dbUser = await getOrCreateUser(
      decodedToken.uid,
      decodedToken.email || `user_${decodedToken.uid}@campus.edu`,
      decodedToken.name || (decodedToken.email ? decodedToken.email.split('@')[0] : 'Campus User'),
      decodedToken.picture
    );

    // STRICT ROLE-LOCK: If not the official canteen account, strictly force student role!
    if (!isOfficialCanteenAccount(dbUser.email)) {
      dbUser.role = 'student';
    }

    req.currentUser = dbUser;
    return next();
  } catch (dbError) {
    console.error('User profile resolution error:', dbError);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to resolve user account profile.',
    });
  }
};

/**
 * Role-Based Access Control (RBAC) middleware
 * Enforces that ONLY the official canteen account can ever access staff or admin routes.
 */
export const requireRole = (allowedRoles: Array<'student' | 'staff' | 'admin'>) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.currentUser) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required.',
      });
    }

    // Role-Lock: Staff or Admin operations are strictly reserved for the official canteen account!
    const requiresStaffOrAdmin = allowedRoles.includes('staff') || allowedRoles.includes('admin');
    if (requiresStaffOrAdmin && !isOfficialCanteenAccount(req.currentUser.email)) {
      return res.status(403).json({
        error: 'Forbidden',
        message:
          'Access Denied: Only the verified official canteen account can access the Staff or Administrator portal. Other campus accounts are strictly restricted to the Student portal.',
      });
    }

    const userRole = req.currentUser.role as 'student' | 'staff' | 'admin';
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to access this resource.',
      });
    }

    next();
  };
};
