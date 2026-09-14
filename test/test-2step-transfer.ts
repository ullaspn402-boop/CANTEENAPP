import {
  getOfficialCanteenProfile,
  isOfficialCanteenAccount,
  updateCampusCoverage,
} from '../src/db/canteenProfile.ts';
import {
  getOrCreateUser,
  updateUserRole,
} from '../src/db/users.ts';
import {
  requestOldEmailSecretCode,
  verifyOldEmailSecretCode,
  requestNewEmailSecretCode,
  finalizeEmailTransferWithCodes,
  getRecentSecurityDispatches,
} from '../src/services/verificationCodeService.ts';
import { getCampusZone, calculateDistanceMeters } from '../src/context/CanteenContext.tsx';

async function runTests() {
  console.log('=== TEST 1: Expanded Campus Area Coverage & Zones ===');
  const profile = getOfficialCanteenProfile();
  console.log('Campus Coverage Radius:', profile.radiusMeters, 'meters');
  console.assert(profile.radiusMeters >= 5000, 'Radius should be at least 5000m');
  console.assert(profile.campusZones.length >= 4, 'Should have multiple campus zones');

  // Test zones by distance
  const zoneCore = getCampusZone(400, profile);
  console.log('Zone at 400m:', zoneCore);
  console.assert(zoneCore.includes('Central Food Court'), 'Should be Food Court & Core');

  const zoneHostels = getCampusZone(1800, profile);
  console.log('Zone at 1800m:', zoneHostels);
  console.assert(zoneHostels.includes('Hostels'), 'Should be Hostels');

  const zoneSports = getCampusZone(3500, profile);
  console.log('Zone at 3500m:', zoneSports);
  console.assert(zoneSports.includes('Sports Complex'), 'Should be Sports Complex');

  const zoneExtended = getCampusZone(7500, profile);
  console.log('Zone at 7500m:', zoneExtended);
  console.assert(zoneExtended.includes('Extended'), 'Should be Extended Zone');

  console.log('PASSED: Expanded Campus Area Coverage & Zones verified.');

  console.log('\n=== TEST 2: Step 1 - Old Email Secret Code Request & Verification ===');
  const currentOfficialEmail = profile.officialEmail;
  console.log('Current Official Email:', currentOfficialEmail);

  // Test with invalid passcode
  const invalidPasscodeRes = requestOldEmailSecretCode({
    email: currentOfficialEmail,
    passcode: 'WRONG_PASSCODE',
  });
  console.assert(invalidPasscodeRes.success === false, 'Invalid passcode must fail');

  // Test with valid passcode
  const validOldReq = requestOldEmailSecretCode({
    email: currentOfficialEmail,
    passcode: 'CANTEEN2026',
  });
  console.log('Old Code Request Result:', validOldReq.success, validOldReq.debugCode);
  console.assert(validOldReq.success === true, 'Old code request should succeed');
  console.assert(Boolean(validOldReq.debugCode), 'Debug code must be generated');

  const oldCode = validOldReq.debugCode!;

  // Test verifying incorrect code
  const wrongCodeRes = verifyOldEmailSecretCode({
    email: currentOfficialEmail,
    code: 'CB-999999',
  });
  console.assert(wrongCodeRes.success === false, 'Incorrect code must fail');

  // Test verifying correct code
  const correctOldRes = verifyOldEmailSecretCode({
    email: currentOfficialEmail,
    code: oldCode,
  });
  console.log('Old Code Verification Result:', correctOldRes.success, 'Token:', correctOldRes.transferSessionToken);
  console.assert(correctOldRes.success === true, 'Correct code must verify');
  console.assert(Boolean(correctOldRes.transferSessionToken), 'Must return session token');

  const sessionToken = correctOldRes.transferSessionToken!;
  console.log('PASSED: Step 1 Old Email Secret Code verified.');

  console.log('\n=== TEST 3: Step 2 - New Gmail Activation Code Request ===');
  const newOfficialEmail = 'official.canteen.2026@gmail.com';

  // Request new code with invalid token
  const invalidTokRes = requestNewEmailSecretCode({
    newEmail: newOfficialEmail,
    transferSessionToken: 'invalid_token_123',
  });
  console.assert(invalidTokRes.success === false, 'Invalid session token must fail');

  // Request new code with valid token
  const validNewReq = requestNewEmailSecretCode({
    newEmail: newOfficialEmail,
    transferSessionToken: sessionToken,
  });
  console.log('New Code Request Result:', validNewReq.success, validNewReq.debugCode);
  console.assert(validNewReq.success === true, 'New code request must succeed');
  const newCode = validNewReq.debugCode!;

  console.log('PASSED: Step 2 New Gmail Activation Code verified.');

  console.log('\n=== TEST 4: Step 3 - Finalize Transfer & Enforce Strict Old-Account Lockout ===');
  const transferFinalRes = await finalizeEmailTransferWithCodes({
    newEmail: newOfficialEmail,
    code: newCode,
    transferSessionToken: sessionToken,
  });
  console.log('Final Transfer Result:', transferFinalRes.success, transferFinalRes.message);
  console.assert(transferFinalRes.success === true, 'Final transfer must succeed');

  // 1. Check official profile reflects new email
  const updatedProfile = getOfficialCanteenProfile();
  console.log('Updated Official Email:', updatedProfile.officialEmail);
  console.assert(updatedProfile.officialEmail === newOfficialEmail, 'Official profile must match new email');

  // 2. Check old email is NOT official
  console.assert(isOfficialCanteenAccount(currentOfficialEmail) === false, 'Old email must NOT be official');
  console.assert(isOfficialCanteenAccount(newOfficialEmail) === true, 'New email must be official');

  // 3. Check old user login is strictly student
  const oldUser = await getOrCreateUser('uid_old_test_2', currentOfficialEmail, 'Old Operator');
  console.log('Old User Login Role:', oldUser.role);
  console.assert(oldUser.role === 'student', 'Old user MUST be strictly student');

  // 4. Check old user cannot switch to admin or staff
  const blockedRole = await updateUserRole('uid_old_test_2', 'admin', currentOfficialEmail);
  console.log('Old User Attempt to become Admin:', blockedRole);
  console.assert(blockedRole === 'student', 'Old user must remain locked to student');

  // 5. Check new user login gets admin
  const newUser = await getOrCreateUser('uid_new_test_2', newOfficialEmail, 'New Operator');
  console.log('New User Login Role:', newUser.role);
  console.assert(newUser.role === 'admin', 'New user MUST receive admin role');

  console.log('PASSED: 2-Step Secret Code Transfer & Strict Lockout fully verified.');

  console.log('\n=== TEST 5: Security Dispatches Log ===');
  const dispatches = getRecentSecurityDispatches();
  console.log(`Recorded ${dispatches.length} security dispatches:`);
  dispatches.forEach((d) => {
    console.log(` - [${d.type}] to ${d.email}: Code ${d.code} (${d.status})`);
  });
  console.assert(dispatches.length >= 2, 'Should have logged at least 2 secret code dispatches');
  console.log('PASSED: Security dispatches log verified.');

  console.log('\n=== ALL 2-STEP TRANSFER & EXPANDED AREA TESTS PASSED! ===');
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
