import 'dotenv/config';
import mongoose from 'mongoose';
import { betaStudents } from '../data/betaStudents';
import { User } from '../models/user.model';
import School from '../models/school.model';
import { Class } from '../models/class.model';
import { StuAssignToClass } from '../models/stuAssignToClass.model';
import { sameId } from '../services/access.service';

async function main() {
  const args = process.argv.slice(2);
  const value = (name: string) => args.find(arg => arg.startsWith(`${name}=`))?.slice(name.length + 1);
  const schoolId = value('--school');
  const classId = value('--class');
  const apply = args.includes('--apply');
  if (!apply) {
    console.log(JSON.stringify({ dryRun: true, schoolId, classId, students: betaStudents }, null, 2));
    return;
  }
  if (process.env.NODE_ENV === 'production') throw new Error('Use a dedicated beta/test database.');
  if (!schoolId || !mongoose.Types.ObjectId.isValid(schoolId)) throw new Error('Provide --school=<school ObjectId>.');
  if (classId && !mongoose.Types.ObjectId.isValid(classId)) throw new Error('Invalid --class ObjectId.');
  const uri = process.env.BETA_MONGODB_URI;
  const password = process.env.BETA_STUDENT_PASSWORD;
  if (!uri || !password || password.length < 12) throw new Error('Set BETA_MONGODB_URI and a BETA_STUDENT_PASSWORD of at least 12 characters.');
  await mongoose.connect(uri);
  try {
    if (!await School.exists({ _id: schoolId })) throw new Error('Beta school not found.');
    if (classId) {
      const cls = await Class.findById(classId);
      const teacher = cls ? await User.findById(cls.teacherId) : null;
      if (!cls || cls.grade !== 6 || !sameId(teacher?.schoolId, schoolId)) throw new Error('Choose a Grade 6 class in the beta school.');
    }
    // Preflight the complete roster before any writes. Never overwrite existing accounts.
    const existing = await User.find({ Id: { $in: betaStudents.map(student => student.Id) } });
    for (const user of existing) {
      const expected = betaStudents.find(student => student.Id === user.Id)!;
      if (user.type !== 'student' || !sameId(user.schoolId, schoolId) || user.username !== expected.username || user.gradeLevel !== 6 || user.gender !== expected.gender) {
        throw new Error(`Student ID ${user.Id} conflicts with an existing account.`);
      }
    }
    for (const student of betaStudents) {
      const user = existing.find(user => user.Id === student.Id) ?? await User.create({ ...student, schoolId, type: 'student', role: 'user', password, isActive: true, state: 'active' });
      if (classId) await StuAssignToClass.updateOne({ studentId: user._id, classId }, { $setOnInsert: { studentId: user._id, classId } }, { upsert: true });
      console.log(`${student.Id}: ${existing.some(account => account.Id === student.Id) ? 'kept' : 'created'}${classId ? ', enrolled' : ''}`);
    }
  } finally {
    await mongoose.disconnect();
  }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
