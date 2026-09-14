import {
  getOfficialCanteenProfile,
  isOfficialCanteenAccount,
  registerOfficialCanteen,
  transferOfficialCanteenEmail,
  updateOfficialCanteenLocation,
} from '../src/db/canteenProfile.ts';
import {
  getOrCreateUser,
  updateUserRole,
  demoteUserToStudent,
  promoteUserToAdmin,
} from '../src/db/users.ts';
import { calculateDistanceMeters } from '../src/context/CanteenContext.tsx';

async function runTests() {
  console.log('=== TEST 1: Initial Official Account Verification ===');
  const initialProfile = getOfficialCanteenProfile();
  console.log('Initial Official Email:', initialProfile.officialEmail);
  console.assert(initialProfile.officialEmail === 'ullassallu636@gmail.com', 'Initial email should match');
  console.assert(isOfficialCanteenAccount('ullassallu636@gmail.com') === true, 'Initial email must be recognized as official');
  console.assert(isOfficialCanteenAccount('other@campus.edu') === false, 'Other emails must not be recognized');
  console.log('PASSED: Initial Official Account verified.');

  console.log('\n=== TEST 2: Geolocation & Distance Calculation ===');
  // Campus center: 12.9716, 77.5946
  // Very close location (approx 100m north)
  const distClose = calculateDistanceMeters(12.9716, 77.5946, 12.9725, 77.5946);
  console.log(`Calculated distance for adjacent campus building: ${distClose}m`);
  console.assert(distClose < 200, 'Distance should be under 200m');
  console.assert(distClose <= (initialProfile.radiusMeters || 1500), 'Should be within campus radius');

  // Far location: 10km away (13.06, 77.5946)
  const distFar = calculateDistanceMeters(12.9716, 77.5946, 13.06, 77.5946);
  console.log(`Calculated distance for distant location: ${distFar}m (${(distFar / 1000).toFixed(1)}km)`);
  console.assert(distFar > 5000, 'Distance should be greater than 5km');
  console.log('PASSED: Distance and campus bounds calculation verified.');

  console.log('\n=== TEST 3: Official Email Transfer ===');
  const transferRes = transferOfficialCanteenEmail({
    oldEmail: 'ullassallu636@gmail.com',
    newEmail: 'ullaspn402@gmail.com',
    passcode: 'CANTEEN2026',
  });
  console.log('Transfer Result:', transferRes.success, transferRes.newEmail);
  console.assert(transferRes.success === true, 'Transfer should succeed');
  console.assert(getOfficialCanteenProfile().officialEmail === 'ullaspn402@gmail.com', 'Profile should reflect new email');

  console.log('\n=== TEST 4: Strict Old Account Lockout ===');
  // 1. Check isOfficialCanteenAccount
  console.assert(isOfficialCanteenAccount('ullassallu636@gmail.com') === false, 'OLD email must NOT be official anymore');
  console.assert(isOfficialCanteenAccount('ullaspn402@gmail.com') === true, 'NEW email must now be official');

  // 2. Demote old email in DB & fallback cache
  await demoteUserToStudent('ullassallu636@gmail.com');
  await promoteUserToAdmin('ullaspn402@gmail.com');

  // 3. Verify getOrCreateUser for old email strictly assigns student
  const oldUser = await getOrCreateUser('uid_old_test', 'ullassallu636@gmail.com', 'Old Manager');
  console.log('Old User Login Role:', oldUser.role);
  console.assert(oldUser.role === 'student', 'Old user MUST be strictly student');

  // 4. Verify old user cannot switch to admin or staff
  const attemptAdminRole = await updateUserRole('uid_old_test', 'admin', 'ullassallu636@gmail.com');
  console.log('Old User Attempt to become Admin:', attemptAdminRole);
  console.assert(attemptAdminRole === 'student', 'Old user must be locked to student');

  // 5. Verify new user login gets admin
  const newUser = await getOrCreateUser('uid_new_test', 'ullaspn402@gmail.com', 'New Official Head');
  console.log('New User Login Role:', newUser.role);
  console.assert(newUser.role === 'admin', 'New user MUST get admin role');

  console.log('PASSED: Strict Old Account Lockout & New Account Access verified.');

  console.log('\n=== ALL TESTS PASSED SUCCESSFULLY! ===');
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
