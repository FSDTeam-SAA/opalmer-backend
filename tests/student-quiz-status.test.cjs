const {test}=require('node:test'),assert=require('node:assert/strict');require('ts-node/register/transpile-only');
const {Types}=require('mongoose'),{User}=require('../src/models/user.model'),{Class}=require('../src/models/class.model'),{Quiz}=require('../src/models/quiz.model'),{QuizResult}=require('../src/models/quizResult.model'),{StuAssignToClass}=require('../src/models/stuAssignToClass.model');
const {getQuizzesForStudent}=require('../src/controllers/quiz.controller');
test('student quiz lists expose only own attempt status and never unpublished scores or answers',async()=>{
 const sid='507f1f77bcf86cd799439011',tid=new Types.ObjectId(),cid=new Types.ObjectId(),qid=new Types.ObjectId(),unstarted=new Types.ObjectId();
 const originals=[User.findById,User.find,Class.find,Quiz.aggregate,QuizResult.find,StuAssignToClass.find];let body,error;
 User.findById=()=>({select:async()=>({type:'student',schoolId:new Types.ObjectId(),gradeLevel:4})});
 User.find=()=>({distinct:async()=>[tid]});Class.find=()=>({select:async()=>[{_id:cid,grade:4,subject:'Fractions'}]});StuAssignToClass.find=()=>({distinct:async()=>[cid]});
 Quiz.aggregate=async()=>[{_id:qid,classId:cid,title:'Submitted'},{_id:unstarted,classId:cid,title:'New assessment'}];
 QuizResult.find=query=>{assert.equal(query.studentId,sid);assert.deepEqual(query.quizId.$in,[qid,unstarted]);return {select:fields=>{assert.equal(fields,'quizId progress.status');return {lean:async()=>[{quizId:qid,progress:{status:'completed'},score:1,answers:[{correctAnswer:'private'}]}]};}};};
 const res={status(){return this;},json(value){body=value;return this;}};
 try{await getQuizzesForStudent({user:{_id:sid,type:'student'},params:{studentId:sid},query:{}},res,e=>{error=e});assert.ifError(error);assert.deepEqual(body.data.quizzes.map(q=>q.resultStatus),['completed','not_started']);assert.equal(JSON.stringify(body).includes('private'),false);assert.equal(JSON.stringify(body).includes('score'),false);}
 finally{[User.findById,User.find,Class.find,Quiz.aggregate,QuizResult.find,StuAssignToClass.find]=originals;}
});
