import {
  getOfficialCanteenProfile,
  transferOfficialCanteenEmail,
  verifyOfficialPasscode,
  getOfficialPasscode,
} from '../db/canteenProfile.ts';
import { demoteUserToStudent, promoteUserToAdmin } from '../db/users.ts';
import { addFallbackNotification } from '../db/fallbackData.ts';

export interface SecurityDispatchLog {
  id: string;
  email: string;
  type: 'OLD_EMAIL_VERIFICATION' | 'NEW_EMAIL_ACTIVATION';
  code: string;
  sentAt: string;
  status: 'SENT' | 'VERIFIED' | 'EXPIRED';
}

interface OldVerificationEntry {
  email: string;
  code: string;
  expiresAt: number;
  verified: boolean;
  failedAttempts?: number;
  transferSessionToken?: string;
}

interface NewVerificationEntry {
  newEmail: string;
  code: string;
  expiresAt: number;
  failedAttempts?: number;
  transferSessionToken: string;
}

const pendingOld = new Map<string, OldVerificationEntry>();
const pendingNew = new Map<string, NewVerificationEntry>();
const securityDispatches: SecurityDispatchLog[] = [];

function generateCode(): string {
  const num = Math.floor(100000 + Math.random() * 900000);
  return `CB-${num}`;
}

export function getRecentSecurityDispatches(): SecurityDispatchLog[] {
  return [...securityDispatches].slice(-10).reverse();
}

/**
 * Step 1: Request Secret Code for the Current (Old) Official Email
 */
export function requestOldEmailSecretCode(data: {
  email: string;
  passcode: string;
}): { success: boolean; message: string; debugCode?: string; error?: string } {
  if (!verifyOfficialPasscode(data.passcode)) {
    return {
      success: false,
      error: 'Invalid Canteen Passcode. Authorized master passkey is required.',
      message: 'Passcode validation failed.',
    };
  }

  const cleanEmail = (data.email || '').trim().toLowerCase();
  const currentOfficial = getOfficialCanteenProfile().officialEmail.trim().toLowerCase();

  if (!cleanEmail || cleanEmail !== currentOfficial) {
    return {
      success: false,
      error: `Email mismatch: "${cleanEmail}" is not the current registered official canteen email.`,
      message: 'Only the active official email can request a transfer code.',
    };
  }

  const code = generateCode();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

  pendingOld.set(cleanEmail, {
    email: cleanEmail,
    code,
    expiresAt,
    verified: false,
  });

  const logEntry: SecurityDispatchLog = {
    id: `disp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    email: cleanEmail,
    type: 'OLD_EMAIL_VERIFICATION',
    code,
    sentAt: new Date().toISOString(),
    status: 'SENT',
  };
  securityDispatches.push(logEntry);

  // Send system notification
  addFallbackNotification({
    userId: 1,
    title: '🔐 CanteenBite Security Secret Code',
    message: `A transfer request was initiated for ${cleanEmail}. Your Secret Verification Code is: ${code} (Valid for 10 mins).`,
    type: 'order_status',
  });

  const isDev = (typeof process !== 'undefined' ? process.env?.NODE_ENV : 'development') !== 'production';
  return {
    success: true,
    message: `Automated Secret Code dispatched to ${cleanEmail}. Please enter the code to verify old account ownership.`,
    ...(isDev ? { debugCode: code } : {}),
  };
}

/**
 * Step 1 Verify: Verify Secret Code for Old Email
 */
export function verifyOldEmailSecretCode(data: {
  email: string;
  code: string;
}): { success: boolean; transferSessionToken?: string; error?: string } {
  const cleanEmail = (data.email || '').trim().toLowerCase();
  const cleanCode = (data.code || '').trim().toUpperCase();

  const entry = pendingOld.get(cleanEmail);
  if (!entry) {
    return { success: false, error: 'No active verification session found. Please request a secret code first.' };
  }

  if (Date.now() > entry.expiresAt) {
    pendingOld.delete(cleanEmail);
    return { success: false, error: 'Secret Code has expired. Please request a new code.' };
  }

  if (entry.failedAttempts && entry.failedAttempts >= 5) {
    pendingOld.delete(cleanEmail);
    return { success: false, error: 'Too many failed verification attempts. Verification session locked for security. Please request a new code.' };
  }

  if (entry.code !== cleanCode) {
    entry.failedAttempts = (entry.failedAttempts || 0) + 1;
    pendingOld.set(cleanEmail, entry);
    const attemptsLeft = 5 - entry.failedAttempts;
    return {
      success: false,
      error: attemptsLeft > 0
        ? `Incorrect Secret Code. ${attemptsLeft} attempt(s) remaining.`
        : 'Too many failed verification attempts. Verification session locked. Please request a new code.',
    };
  }

  const transferSessionToken = `tok_${Math.random().toString(36).substring(2, 10)}_${Date.now().toString(36)}`;
  entry.verified = true;
  entry.transferSessionToken = transferSessionToken;
  pendingOld.set(cleanEmail, entry);

  // Update dispatch status
  const log = securityDispatches.find((d) => d.email === cleanEmail && d.code === cleanCode);
  if (log) log.status = 'VERIFIED';

  return {
    success: true,
    transferSessionToken,
  };
}

/**
 * Step 2: Request Activation Secret Code for New Gmail Address
 */
export function requestNewEmailSecretCode(data: {
  newEmail: string;
  transferSessionToken: string;
}): { success: boolean; message: string; debugCode?: string; error?: string } {
  const cleanNew = (data.newEmail || '').trim().toLowerCase();
  const currentOfficial = getOfficialCanteenProfile().officialEmail.trim().toLowerCase();

  if (!cleanNew || !cleanNew.includes('@')) {
    return { success: false, error: 'A valid new Gmail / campus email address is required.', message: 'Invalid email' };
  }

  if (cleanNew === currentOfficial) {
    return { success: false, error: 'The new email must be different from the current official email.', message: 'Duplicate email' };
  }

  // Verify session token
  const validOld = Array.from(pendingOld.values()).find(
    (e) => e.verified && e.transferSessionToken === data.transferSessionToken
  );
  if (!validOld) {
    return { success: false, error: 'Invalid or expired transfer authorization session. Please restart Step 1.', message: 'Session expired' };
  }

  const code = generateCode();
  const expiresAt = Date.now() + 10 * 60 * 1000;

  pendingNew.set(cleanNew, {
    newEmail: cleanNew,
    code,
    expiresAt,
    transferSessionToken: data.transferSessionToken,
  });

  const logEntry: SecurityDispatchLog = {
    id: `disp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    email: cleanNew,
    type: 'NEW_EMAIL_ACTIVATION',
    code,
    sentAt: new Date().toISOString(),
    status: 'SENT',
  };
  securityDispatches.push(logEntry);

  // Send system notification
  addFallbackNotification({
    userId: 1,
    title: '🔐 New Gmail Activation Secret Code',
    message: `Transfer authorization code for new official email ${cleanNew}: ${code}. Enter this code to complete authority transfer.`,
    type: 'order_status',
  });

  const isDev2 = (typeof process !== 'undefined' ? process.env?.NODE_ENV : 'development') !== 'production';
  return {
    success: true,
    message: `Activation Secret Code dispatched to ${cleanNew}. Please enter the code to finalize transfer.`,
    ...(isDev2 ? { debugCode: code } : {}),
  };
}

/**
 * Step 3: Verify New Gmail Code & Finalize Transfer (Strict Demotion & Lockout)
 */
export async function finalizeEmailTransferWithCodes(data: {
  newEmail: string;
  code: string;
  transferSessionToken: string;
}): Promise<{ success: boolean; oldEmail?: string; newEmail?: string; message?: string; error?: string }> {
  const cleanNew = (data.newEmail || '').trim().toLowerCase();
  const cleanCode = (data.code || '').trim().toUpperCase();

  const newEntry = pendingNew.get(cleanNew);
  if (!newEntry) {
    return { success: false, error: 'No activation request found for this new email. Please click "Send Activation Code" first.' };
  }

  if (newEntry.transferSessionToken !== data.transferSessionToken) {
    return { success: false, error: 'Session token mismatch. Please restart transfer.' };
  }

  if (Date.now() > newEntry.expiresAt) {
    pendingNew.delete(cleanNew);
    return { success: false, error: 'Activation code expired. Please request a new code.' };
  }

  if (newEntry.failedAttempts && newEntry.failedAttempts >= 5) {
    pendingNew.delete(cleanNew);
    return { success: false, error: 'Too many failed activation attempts. Activation session locked for security. Please request a new code.' };
  }

  if (newEntry.code !== cleanCode) {
    newEntry.failedAttempts = (newEntry.failedAttempts || 0) + 1;
    pendingNew.set(cleanNew, newEntry);
    const attemptsLeft = 5 - newEntry.failedAttempts;
    return {
      success: false,
      error: attemptsLeft > 0
        ? `Incorrect activation secret code. ${attemptsLeft} attempt(s) remaining.`
        : 'Too many failed activation attempts. Activation session locked. Please request a new code.',
    };
  }

  const oldOfficial = getOfficialCanteenProfile().officialEmail.trim().toLowerCase();

  // Execute official profile update
  const transferRes = transferOfficialCanteenEmail({
    oldEmail: oldOfficial,
    newEmail: cleanNew,
    passcode: getOfficialPasscode(),
  });

  if (!transferRes.success) {
    return { success: false, error: transferRes.error };
  }

  // Demote old email in PostgreSQL and in-memory cache
  await demoteUserToStudent(oldOfficial);

  // Promote new email
  await promoteUserToAdmin(cleanNew);

  // Mark log entry as verified
  const log = securityDispatches.find((d) => d.email === cleanNew && d.code === cleanCode);
  if (log) log.status = 'VERIFIED';

  // Clear pending sessions
  pendingOld.delete(oldOfficial);
  pendingNew.delete(cleanNew);

  // Add permanent security audit notification
  addFallbackNotification({
    userId: 1,
    title: '🛡️ Canteen Authority Transfer Complete',
    message: `Canteen management was successfully transferred from "${oldOfficial}" to "${cleanNew}". Old account has been permanently demoted to Student with zero administrative access.`,
    type: 'order_status',
  });

  return {
    success: true,
    oldEmail: oldOfficial,
    newEmail: cleanNew,
    message: `Authority successfully transferred to ${cleanNew}. Previous email (${oldOfficial}) has been locked out of Staff & Admin portals.`,
  };
}
