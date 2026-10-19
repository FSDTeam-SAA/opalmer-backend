import mongoose from 'mongoose';
import { getRequiredEnv } from '../config/env';

// Read-only readiness report. Never removes duplicates or builds indexes.
const main = async () => {
  await mongoose.connect(getRequiredEnv('MONGO_URI'), {
    autoIndex: false, autoCreate: false, serverSelectionTimeoutMS: 10000,
  });
  const db = mongoose.connection.db!;
  const keys: Array<[string, string[]]> = [
    ['quizresults', ['quizId', 'studentId']],
    ['submissions', ['homeworkId', 'studentId']],
    ['parentschildren', ['parentId', 'childId']],
    ['stuassigntoclasses', ['classId', 'studentId']],
    ['attendances', ['classId', 'userId', 'date']],
  ];
  const existing = new Set((await db.listCollections({}, { nameOnly: true }).toArray()).map(c => c.name));
  for (const [collection, fields] of keys) {
    if (!existing.has(collection)) { console.log(JSON.stringify({ collection, status: 'not_present' })); continue; }
    const duplicates = await db.collection(collection).aggregate([
      { $group: { _id: Object.fromEntries(fields.map(field => [field, `$${field}`])), count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } },
      { $group: { _id: null, groups: { $sum: 1 }, extraRows: { $sum: { $subtract: ['$count', 1] } } } },
      { $project: { _id: 0 } },
    ], { maxTimeMS: 30000 }).toArray();
    console.log(JSON.stringify({ collection, duplicates: duplicates[0] ?? { groups: 0, extraRows: 0 }, indexes: (await db.collection(collection).indexes()).map(i => ({ key: i.key, unique: !!i.unique })) }));
  }
  for (const [collection, field, target] of [
    ['quizresults', 'quizId', 'quizzes'], ['quizresults', 'studentId', 'users'],
    ['stuassigntoclasses', 'classId', 'classes'], ['stuassigntoclasses', 'studentId', 'users'],
    ['submissions', 'homeworkId', 'homeworks'], ['attendances', 'classId', 'classes'],
  ]) {
    if (!existing.has(collection)) continue;
    const missing = await db.collection(collection).aggregate([
      { $lookup: { from: target, localField: field, foreignField: '_id', as: 'linked' } },
      { $match: { linked: { $size: 0 } } }, { $count: 'count' },
    ], { maxTimeMS: 30000 }).toArray();
    console.log(JSON.stringify({ collection, field, missingReferences: missing[0]?.count ?? 0 }));
  }
};
main().catch(error => { console.error('Readiness audit failed:', error instanceof Error ? error.name : 'Unknown error'); process.exitCode = 1; }).finally(() => mongoose.disconnect());
