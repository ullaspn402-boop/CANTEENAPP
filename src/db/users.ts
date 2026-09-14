import { db } from './index.ts';
import { users, students, staff, admins } from './schema.ts';
import { eq, sql } from 'drizzle-orm';
import process from 'node:process';
import { isOfficialCanteenAccount } from './canteenProfile.ts';

// In-memory fallback registry when local PostgreSQL database is unreachable
const fallbackUserCache = new Map<string, any>();

function parseAuthorizedEmails(envVar?: string): string[] {
  if (!envVar) return [];
  return envVar
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Resolves or creates a user account backed by PostgreSQL.
 * Role is strictly determined server-side from existing database state
 * or backend-only ADMIN_EMAILS / STAFF_EMAILS configuration.
 */
export async function getOrCreateUser(
  uid: string,
  rawEmail: string,
  name: string,
  avatarUrl?: string,
  initialSeedRole?: 'student' | 'staff' | 'admin'
) {
  const normalizedEmail = (rawEmail || '').trim().toLowerCase();
  try {
    const normalizedEmail = (rawEmail || '').trim().toLowerCase();

    const isOfficial = isOfficialCanteenAccount(normalizedEmail);

    // 1. Search PostgreSQL by Firebase UID
    const existingByUid = await db
      .select()
      .from(users)
      .where(eq(users.uid, uid))
      .limit(1);

    if (existingByUid.length > 0) {
      const current = existingByUid[0];
      // STRICT ROLE LOCK: Only the verified official canteen account can be staff or admin!
      const enforcedRole = isOfficial ? (current.role === 'student' ? 'admin' : current.role) : 'student';
      
      const [updated] = await db
        .update(users)
        .set({
          email: normalizedEmail || current.email,
          name: name || current.name,
          avatarUrl: avatarUrl || current.avatarUrl,
          role: enforcedRole,
        })
        .where(eq(users.id, current.id))
        .returning();

      // Ensure corresponding sub-profile exists in PostgreSQL
      await ensureSubProfile(updated.id, updated.role);
      return updated;
    }

    // 2. If UID not found, search PostgreSQL by normalized verified email
    if (normalizedEmail) {
      const existingByEmail = await db
        .select()
        .from(users)
        .where(sql`LOWER(${users.email}) = ${normalizedEmail}`)
        .limit(1);

      if (existingByEmail.length > 0) {
        const current = existingByEmail[0];
        const enforcedRole = isOfficial ? (current.role === 'student' ? 'admin' : current.role) : 'student';
        const [linked] = await db
          .update(users)
          .set({
            uid,
            name: name || current.name,
            avatarUrl: avatarUrl || current.avatarUrl,
            email: normalizedEmail,
            role: enforcedRole,
          })
          .where(eq(users.id, current.id))
          .returning();

        await ensureSubProfile(linked.id, linked.role);
        return linked;
      }
    }

    // 3. New user: STRICT ROLE LOCK
    // ONLY the registered official canteen account can be admin/staff. All others are strictly students!
    const assignedRole: 'student' | 'staff' | 'admin' = isOfficial ? 'admin' : 'student';

    // 4. Insert new user with server-determined role
    const [newUser] = await db
      .insert(users)
      .values({
        uid,
        email: normalizedEmail || `user_${uid}@campus.edu`,
        name: name || 'Campus Member',
        role: assignedRole,
        avatarUrl,
      })
      .returning();

    // Create corresponding sub-profile
    await ensureSubProfile(newUser.id, newUser.role);

    return newUser;
  } catch (error) {
    console.warn('PostgreSQL database query failed, using resilient session fallback:', (error as any)?.message || error);

    const isOfficial = isOfficialCanteenAccount(normalizedEmail);
    const cached = fallbackUserCache.get(uid);
    if (cached) {
      // STRICT ROLE LOCK for cached fallback user
      cached.role = isOfficial ? (cached.role === 'student' ? 'admin' : cached.role) : 'student';
      fallbackUserCache.set(uid, cached);
      return cached;
    }

    // ONLY the registered official canteen account gets admin; everyone else is student!
    const assignedRole: 'student' | 'staff' | 'admin' = isOfficial ? 'admin' : 'student';

    const fallbackUser = {
      id: Math.floor(1000 + Math.random() * 9000),
      uid,
      email: normalizedEmail || `user_${uid}@campus.edu`,
      name: name || 'Campus Member',
      role: assignedRole,
      avatarUrl: avatarUrl || null,
      phone: null,
      createdAt: new Date().toISOString(),
    };
    fallbackUserCache.set(uid, fallbackUser);
    return fallbackUser;
  }
}

async function ensureSubProfile(userId: number, role: string) {
  try {
    if (role === 'student') {
      await db
        .insert(students)
        .values({
          userId,
          studentIdNumber: `STU${Math.floor(1000 + Math.random() * 9000)}`,
          department: 'Computer Science & Engg',
          year: '3rd Year',
        })
        .onConflictDoNothing();
    } else if (role === 'staff') {
      await db
        .insert(staff)
        .values({
          userId,
          employeeCode: `STF${Math.floor(100 + Math.random() * 900)}`,
          station: 'Main Kitchen Counter',
        })
        .onConflictDoNothing();
    } else if (role === 'admin') {
      await db
        .insert(admins)
        .values({
          userId,
          designation: 'Canteen Facility Director',
        })
        .onConflictDoNothing();
    }
  } catch (err) {
    console.warn('ensureSubProfile warning:', err);
  }
}

export async function updateUserRole(uid: string, newRole: 'student' | 'staff' | 'admin', userEmail?: string) {
  const isOfficial = isOfficialCanteenAccount(userEmail);
  const targetRole = (newRole === 'staff' || newRole === 'admin') && !isOfficial ? 'student' : newRole;

  try {
    const [updated] = await db
      .update(users)
      .set({ role: targetRole })
      .where(eq(users.uid, uid))
      .returning();
    if (updated) {
      await ensureSubProfile(updated.id, targetRole);
    }
  } catch (err) {
    console.warn('updateUserRole DB notice:', (err as any)?.message || err);
  }
  const cached = fallbackUserCache.get(uid);
  if (cached) {
    cached.role = targetRole;
    fallbackUserCache.set(uid, cached);
  }
  return targetRole;
}

/**
 * Demotes a user identified by email to 'student' role.
 * Used when official canteen ownership is transferred away from an old email.
 */
export async function demoteUserToStudent(email: string): Promise<void> {
  const cleanEmail = (email || '').trim().toLowerCase();
  if (!cleanEmail) return;

  try {
    await db
      .update(users)
      .set({ role: 'student' })
      .where(sql`LOWER(${users.email}) = ${cleanEmail}`);
  } catch (err) {
    console.warn('demoteUserToStudent DB notice:', (err as any)?.message || err);
  }

  // Demote in fallback in-memory cache
  for (const [key, userObj] of fallbackUserCache.entries()) {
    if (userObj.email && userObj.email.trim().toLowerCase() === cleanEmail) {
      userObj.role = 'student';
      fallbackUserCache.set(key, userObj);
    }
  }
}

/**
 * Promotes a user identified by email to 'admin' role.
 * Used when official canteen ownership is transferred to a new email.
 */
export async function promoteUserToAdmin(email: string): Promise<void> {
  const cleanEmail = (email || '').trim().toLowerCase();
  if (!cleanEmail) return;

  try {
    await db
      .update(users)
      .set({ role: 'admin' })
      .where(sql`LOWER(${users.email}) = ${cleanEmail}`);
  } catch (err) {
    console.warn('promoteUserToAdmin DB notice:', (err as any)?.message || err);
  }

  // Promote in fallback in-memory cache
  for (const [key, userObj] of fallbackUserCache.entries()) {
    if (userObj.email && userObj.email.trim().toLowerCase() === cleanEmail) {
      userObj.role = 'admin';
      fallbackUserCache.set(key, userObj);
    }
  }
}

