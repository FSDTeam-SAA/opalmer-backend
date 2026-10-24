const {test} = require('node:test');
const assert = require('node:assert/strict');
require('ts-node/register/transpile-only');
const {User} = require('../src/models/user.model');
const {deleteSchoolUser} = require('../src/controllers/schoolUser.controller');
const models = [
  require('../src/models/class.model').Class,
  require('../src/models/stuAssignToClass.model').StuAssignToClass,
  require('../src/models/parentsChild.model').ParentsChild,
  require('../src/models/attendance.model').Attendance,
  require('../src/models/quizResult.model').QuizResult,
  require('../src/models/quiz.model').Quiz,
  require('../src/models/lesson.model').Lesson,
  require('../src/models/homework.model').Homework,
  require('../src/models/submission.model').Submission,
  require('../src/models/academicDocument.model').default,
  require('../src/models/behavior.model').Behavior,
  require('../src/models/groupWork.model').GroupWork,
  require('../src/models/room.model').Room,
  require('../src/models/teacherResource.model').TeacherResource,
  require('../src/models/announcement.model').Announcement,
];
const {GuardianInvitation} = require('../src/models/guardianInvitation.model');
const id = '507f1f77bcf86cd799439011';
async function invoke(role='administrator', schoolId='school-a', type='students') {
  let error, output;
  await deleteSchoolUser({user:{role,schoolId},params:{id,type}}, {status(){return this},json(v){output=v}}, e=>{error=e});
  return {error,output};
}

test('school user deletion enforces roles, type and own-school access before deleting',async()=>{
  const original=User.findOne;
  try {
    User.findOne=async query=>{assert.equal(query.role,'user');assert.equal(query.type,'student');return {_id:id,schoolId:'school-a'}};
    assert.equal((await invoke('user')).error.statusCode,403);
    assert.equal((await invoke('administrator','school-a','admins')).error.statusCode,400);
    assert.equal((await invoke('administrator','other-school')).error.statusCode,403);
    User.findOne=async()=>null;
    assert.equal((await invoke()).error.statusCode,404);
  } finally {User.findOne=original}
});

test('linked records block deletion; unused accounts are deleted with type and school guards',async()=>{
  const originals=[User.findOne,User.findOneAndDelete,GuardianInvitation.deleteMany,...models.map(m=>m.exists)];
  let deleted=0;
  try {
    User.findOne=async()=>({_id:id,schoolId:'school-a'});
    User.findOneAndDelete=async query=>{assert.deepEqual(query,{_id:id,role:'user',type:'student',schoolId:'school-a'});deleted++;return {_id:id}};
    GuardianInvitation.deleteMany=async()=>({});
    models.forEach(m=>{m.exists=async()=>null});
    models[3].exists=async query=>{assert.deepEqual(query,{userId:id});return {_id:'attendance'}};
    assert.equal((await invoke()).error.statusCode,409);
    assert.equal(deleted,0);
    models[3].exists=async()=>null;
    assert.equal((await invoke()).output.success,true);
    assert.equal(deleted,1);
  }finally {
    [User.findOne,User.findOneAndDelete,GuardianInvitation.deleteMany]=originals;
    models.forEach((m,i)=>{m.exists=originals[i+3]});
  }
});
