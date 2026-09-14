import { isOfficialCanteenAccount, getOfficialCanteenProfile } from '../src/db/canteenProfile';
import { getOrCreateUser } from '../src/db/users';

async function run() {
  const profile = getOfficialCanteenProfile();
  console.log('Registered Official Canteen Email:', profile.officialEmail);
  if (profile.officialEmail !== 'agent202006@gmail.com') {
    throw new Error(`Expected agent202006@gmail.com but got ${profile.officialEmail}`);
  }

  const isOfficial = isOfficialCanteenAccount('agent202006@gmail.com');
  console.log('isOfficial check for agent202006@gmail.com:', isOfficial);
  if (!isOfficial) {
    throw new Error('agent202006@gmail.com must return true for isOfficialCanteenAccount');
  }

  const isOtherOfficial = isOfficialCanteenAccount('student@college.edu');
  console.log('isOfficial check for student@college.edu:', isOtherOfficial);
  if (isOtherOfficial) {
    throw new Error('student@college.edu must return false for isOfficialCanteenAccount');
  }

  const officialUser = await getOrCreateUser('uid_agent202006', 'agent202006@gmail.com', 'Official Canteen Head');
  console.log('Official User Role assigned:', officialUser.role);
  if (officialUser.role !== 'admin') {
    throw new Error(`Expected admin role but got ${officialUser.role}`);
  }

  const studentUser = await getOrCreateUser('uid_student_user', 'student@college.edu', 'Regular Student');
  console.log('Student User Role assigned:', studentUser.role);
  if (studentUser.role !== 'student') {
    throw new Error(`Expected student role but got ${studentUser.role}`);
  }

  console.log('VERIFICATION SUCCESSFUL: agent202006@gmail.com is registered as the official canteen account with admin privileges!');
  process.exit(0);
}

run().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
