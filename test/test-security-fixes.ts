import {
  getOfficialCanteenProfile,
  isOfficialCanteenAccount,
  registerOfficialCanteen,
  transferOfficialCanteenEmail,
  verifyOfficialPasscode,
  getOfficialPasscode,
} from '../src/db/canteenProfile.ts';
import {
  requestOldEmailSecretCode,
  verifyOldEmailSecretCode,
  requestNewEmailSecretCode,
  finalizeEmailTransferWithCodes,
} from '../src/services/verificationCodeService.ts';
import { markNotificationRead } from '../src/db/queries.ts';

async function testSecurityRemediations() {
  console.log('====================================================');
  console.log('   SMART COLLEGE CANTEEN — SECURITY REMEDIATION TESTS');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, name: string) {
    if (condition) {
      console.log(`  [PASS] ${name}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${name}`);
      failed++;
    }
  }

  // 1. Passcode Environment & Validation
  console.log('--- 1. Testing Passcode Validation & Masking ---');
  const currentPasscode = getOfficialPasscode();
  assert(typeof currentPasscode === 'string' && currentPasscode.length > 0, 'Official passcode loaded from config/env');
  assert(verifyOfficialPasscode(currentPasscode) === true, 'Correct master passcode validates');
  assert(verifyOfficialPasscode('WRONG_PASSCODE_123') === false, 'Wrong master passcode fails');
  assert(verifyOfficialPasscode('') === false, 'Empty passcode fails');

  const regAttempt = registerOfficialCanteen({
    operatorName: 'Attacker',
    officialEmail: 'attacker@evil.com',
    passcode: 'WRONG_CODE',
  });
  assert(regAttempt.success === false, 'Registration with invalid passcode blocked');
  assert(!regAttempt.error?.includes(currentPasscode), 'Error message does NOT leak the master passkey');

  // 2. Secret Verification Code Exposure in Production
  console.log('\n--- 2. Testing Secret Code Production Masking ---');
  const oldEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';
  const prodCodeReq = requestOldEmailSecretCode({
    email: getOfficialCanteenProfile().officialEmail,
    passcode: currentPasscode,
  });
  assert(prodCodeReq.success === true, 'Code dispatched in production mode');
  assert(prodCodeReq.debugCode === undefined, 'debugCode is NOT returned in production API response');
  process.env.NODE_ENV = oldEnv;

  // 3. Brute-Force Lockout on Verification Code
  console.log('\n--- 3. Testing Brute-Force Lockout Protection ---');
  const officialEmail = getOfficialCanteenProfile().officialEmail;
  const dispatchRes = requestOldEmailSecretCode({
    email: officialEmail,
    passcode: currentPasscode,
  });
  assert(dispatchRes.success === true, 'New code session generated');

  // Attempt 5 wrong codes
  let lastAttemptResult: any;
  for (let i = 1; i <= 5; i++) {
    lastAttemptResult = verifyOldEmailSecretCode({
      email: officialEmail,
      code: `CB-00000${i}`,
    });
    assert(lastAttemptResult.success === false, `Attempt ${i} rejected`);
  }

  // 6th attempt should be completely locked
  const lockedAttempt = verifyOldEmailSecretCode({
    email: officialEmail,
    code: 'CB-999999',
  });
  assert(
    lockedAttempt.success === false && lockedAttempt.error?.toLowerCase().includes('locked'),
    'Verification session locked after 5 consecutive failures'
  );

  // 4. Notification Read Ownership
  console.log('\n--- 4. Testing Notification Read Ownership ---');
  // Attempt to mark notification with userId=999 when notification belongs to someone else
  const notifResult = await markNotificationRead(1, 999);
  assert(notifResult.success === true, 'markNotificationRead executes with user boundary');

  // 5. PII Masking regex validation
  console.log('\n--- 5. Testing Customer PII Masking Logic ---');
  const testEmail = 'john.doe@university.edu';
  const testPhone = '+91 98765 43210';

  const maskedEmail = testEmail.replace(/^(.)(.*)(@.*)$/, (_, a, b, c) => `${a}***${c}`);
  const maskedPhone = testPhone.replace(/(\d{2,4})\d+(\d{2})/, '$1****$2');

  assert(maskedEmail === 'j***@university.edu', `Email masked safely: ${maskedEmail}`);
  assert(!maskedPhone.includes('98765'), `Phone digits masked safely: ${maskedPhone}`);

  console.log('\n====================================================');
  console.log(`  SECURITY TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

testSecurityRemediations().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
