import { Request, Response, NextFunction } from 'express';
import { adminAuth } from '../lib/firebase-admin.ts';
import { DecodedIdToken } from 'firebase-admin/auth';
import { getOrCreateUser } from '../db/users.ts';
import { db } from '../db/index.ts';
import { users } from '../db/schema.ts';
import { eq } from 'drizzle-orm';

import { isOfficialCanteenAccount } from '../db/canteenProfile.ts';

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

  // Real Google / Firebase Bearer Token is strictly required
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    totalAuthFailures++;
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required. Please sign in with your campus Google account.',
    });
  }

  const token = authHeader.split('Bearer ')[1];
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
