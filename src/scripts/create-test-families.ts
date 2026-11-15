import 'dotenv/config';
import mongoose from 'mongoose';
import { randomBytes } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { User } from '../models/user.model';
import School from '../models/school.model';
import { ParentsChild } from '../models/parentsChild.model';

// Operator-only script: creates fictional accounts without sending invitations/email.
// Existing IDs are always rejected, including on a second run.
async function main() {
  const args = process.argv.slice(2);
  const schoolId = args.find(arg => arg.startsWith('--school='))?.slice(9);
  if (!schoolId || !mongoose.Types.ObjectId.isValid(schoolId)) {
    throw new Error('Provide --school=<school ObjectId>. Add --apply to create accounts.');
  }
  const roster = Array.from({ length: 10 }, (_, index) => {
    const number = String(index + 1).padStart(2, '0');
    return {
      parentId: `parent-test-${number}`, studentId: `student-test-${number}`,
      parentName: `Test Parent ${number}`, studentName: `Test Student ${number}`,
      parentPassword: randomBytes(15).toString('base64url'),
      studentPassword: randomBytes(15).toString('base64url'),
    };
  });
  if (!args.includes('--apply')) {
    console.log(JSON.stringify({ dryRun: true, schoolId, pairs: roster.map(({ parentId, studentId }) => ({ parentId, studentId })) }, null, 2));
    return;
  }
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI is required.');
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 10000 });
  try {
    const school = await School.findById(schoolId);
    if (!school) throw new Error('School not found.');
    const ids = roster.flatMap(pair => [pair.parentId, pair.studentId]);
    if (await User.exists({ Id: { $in: ids } })) throw new Error('Test account IDs already exist; no accounts were changed.');
    // Save credentials before writing so a lost terminal cannot lose access details.
    const output = resolve(__dirname, '../../../outputs/test-families/login-details.md');
    mkdirSync(dirname(output), { recursive: true });
    const heading = `# Fictional test families\n\nSchool: ${school.name}\n\nLog in with the account ID and its password. Each student is Grade 6.\n\n`;
    const table = '| Parent ID | Parent password | Student ID | Student password |\n| --- | --- | --- | --- |\n' +
      roster.map(pair => `| ${pair.parentId} | ${pair.parentPassword} | ${pair.studentId} | ${pair.studentPassword} |`).join('\n');
    writeFileSync(output, heading + 'Status: pending database creation.\n\n' + table + '\n', { flag: 'wx', mode: 0o600 });
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        for (const pair of roster) {
          const common = { schoolId, role: 'user', state: 'active', isActive: true, notes: 'Fictional test family account' };
          const [parent] = await User.create([{ ...common, username: pair.parentName, Id: pair.parentId, password: pair.parentPassword, type: 'parent' }], { session });
          const [student] = await User.create([{ ...common, username: pair.studentName, Id: pair.studentId, password: pair.studentPassword, type: 'student', gradeLevel: 6 }], { session });
          await ParentsChild.create([{ parentId: parent._id, childId: student._id }], { session });
        }
      });
    } finally {
      await session.endSession();
    }
    const accounts = await User.find({ Id: { $in: ids } }).select('+password');
    const accountIds = accounts.map(account => account._id);
    const links = await ParentsChild.find({ $or: [{ parentId: { $in: accountIds } }, { childId: { $in: accountIds } }] });
    if (accounts.length !== 20 || links.length !== 10) throw new Error('Post-creation account/link counts do not match.');
    for (const pair of roster) {
      const parent = accounts.find(account => account.Id === pair.parentId)!;
      const student = accounts.find(account => account.Id === pair.studentId)!;
      const ownLinks = links.filter(link => String(link.parentId) === String(parent._id));
      if (parent.type !== 'parent' || student.type !== 'student' || ownLinks.length !== 1 || String(ownLinks[0].childId) !== String(student._id) ||
          !await User.isPasswordMatched(pair.parentPassword, parent.password) ||
          !await User.isPasswordMatched(pair.studentPassword, student.password)) {
        throw new Error(`Account verification failed for ${pair.parentId}.`);
      }
    }
    writeFileSync(output, heading + 'Status: created and verified — 10 parents, 10 students, 10 one-to-one links.\n\n' + table + '\n', { mode: 0o600 });
    console.log(JSON.stringify({ createdParents: 10, createdStudents: 10, verifiedRelationships: 10, verifiedPasswords: 20, credentialsFile: output }, null, 2));
  } finally {
    await mongoose.disconnect();
  }
}

main().catch(error => { console.error(error.message); process.exitCode = 1; });
