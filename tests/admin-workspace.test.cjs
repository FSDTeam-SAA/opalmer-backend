const { test } = require('node:test');
const assert = require('node:assert/strict');
require('ts-node/register/transpile-only');
const workspace = require('../src/controllers/adminWorkspace.controller');
const router = require('../src/routes/adminWorkspace.routes').default;
const { User } = require('../src/models/user.model');
const { Class } = require('../src/models/class.model');
const { Submission } = require('../src/models/submission.model');
const { QuizResult } = require('../src/models/quizResult.model');
const { TeacherBehaviorReport } = require('../src/models/teacherBehaviorReport.model');
const { AdminAnnouncement } = require('../src/models/adminAnnouncement.model');
const notifications = require('../src/sockets/notification.service');
const { canMessageUser } = require('../src/utils/chatAccess');
const { resourceAccess } = require('../src/middlewares/resourceAccess.middleware');
const ids = { admin:'507f1f77bcf86cd799439001', administrator:'507f1f77bcf86cd799439002', teacher:'507f1f77bcf86cd799439003', school:'507f1f77bcf86cd799439004', other:'507f1f77bcf86cd799439005', class:'507f1f77bcf86cd799439006', student:'507f1f77bcf86cd799439007', record:'507f1f77bcf86cd799439008' };
const admin = { _id: ids.admin, role: 'admin' };
const administrator = { _id: ids.administrator, role:'administrator', schoolId: ids.school };
async function invoke(handler, req = {}) {
  let error, body, status = 200;
  const res = { status(value) { status = value; return this; }, json(value) { body = value; return this; } };
  await handler({ user: admin, body: {}, query: {}, params: {}, ...req }, res, value => { error = value; });
  return { error, body, status };
}
function chain(rows) { return { select(){return this;}, sort(){return this;}, skip(){return this;}, limit(){return this;}, populate(){return this;}, lean:async()=>rows, distinct:async()=>rows, then(resolve,reject){return Promise.resolve(rows).then(resolve,reject);} }; }
function patch(object,key,value,restores) { const old = object[key]; object[key] = value; restores.push(() => object[key] = old); }

test('Admin workspace endpoints reject Administrator, teacher, student and parent accounts', async () => {
  for (const actor of [administrator,{role:'user',type:'teacher'},{role:'user',type:'student'},{role:'user',type:'parent'}]) {
    for (const [method,url] of [['GET','/activity'],['GET','/teacher-behavior'],['POST','/assignments'],['POST','/assessments'],['POST','/attendance'],['POST','/behavior'],['POST','/announcements'],['GET','/announcements'],['GET','/results/x']]) {
      const error = await new Promise(resolve => router.handle({ method,url,user:actor,headers:{} },{},resolve));
      assert.equal(error?.statusCode,403,`${actor.role}/${actor.type} ${method} ${url}`);
    }
  }
});
test('Only Administrator can submit a teacher report, and submission returns a receipt without confidential content', async () => {
  for (const actor of [admin, {role:'user',type:'teacher'}, {role:'user',type:'student'}, {role:'user',type:'parent'}]) {
    const error = await new Promise(resolve => router.handle({method:'POST',url:'/teacher-behavior',user:actor,headers:{}},{},resolve));
    assert.equal(error.statusCode,403);
  }
  const restores=[]; let saved;
  try {
    patch(User,'findById',async()=>({_id:ids.teacher,type:'teacher',role:'user',schoolId:ids.school}),restores);
    patch(TeacherBehaviorReport,'create',async value=>{saved=value;return {...value,_id:ids.record};},restores);
    const result=await invoke(workspace.submitTeacherBehavior,{user:administrator,body:{teacherId:ids.teacher,schoolId:ids.other,submittedBy:ids.admin,subject:'Follow-up',message:'Confidential details',occurredOn:'2026-10-24'}});
    assert.equal(result.status,201); assert.equal(saved.schoolId,ids.school); assert.equal(saved.submittedBy,ids.administrator);
    assert.deepEqual(result.body.data,{id:ids.record}); assert.equal(JSON.stringify(result.body).includes('Confidential details'),false);
  } finally {restores.reverse().forEach(fn=>fn());}
});
test('Teacher reports reject teachers from another school and invalid dates', async () => {
  const restores=[];let creates=0;
  try {
    patch(User,'findById',async()=>({_id:ids.teacher,type:'teacher',role:'user',schoolId:ids.other}),restores);
    patch(TeacherBehaviorReport,'create',async()=>{creates++;},restores);
    const result=await invoke(workspace.submitTeacherBehavior,{user:administrator,body:{teacherId:ids.teacher,subject:'Report',message:'Details',occurredOn:'2026-10-24'}});
    assert.equal(result.error.statusCode,403); assert.equal(creates,0);
    for(const date of ['2026-02-30','bad',{},'2026-10-24T23:00:00Z']) assert.throws(()=>workspace.validDay(date),error=>error.statusCode===400);
  }finally{restores.reverse().forEach(fn=>fn());}
});
test('Administrator directory is confined to school teachers regardless of query parameters', async () => {
  const restores=[];let filter;
  try {
    patch(User,'find',query=>{filter=query;return chain([]);},restores);
    patch(User,'countDocuments',async()=>0,restores);
    const result=await invoke(workspace.workspaceDirectory,{user:administrator,query:{type:'student',schoolId:ids.other,search:'.*'}});
    assert.equal(result.error,undefined);assert.equal(filter.schoolId,ids.school);assert.equal(filter.type,'teacher');assert.equal(filter.role,'user');
    assert.equal(filter.$or[0].username.$regex,'\\.\\*');
  }finally{restores.reverse().forEach(fn=>fn());}
});
test('Announcement validates audience types and selects only active users in selected audiences', async () => {
  assert.deepEqual(workspace.announcementAudiences(['teacher','parent','teacher']),['teacher','parent']);
  for(const value of [[],['admin'],['administrator'],['student','unknown'],'teacher',null]) assert.throws(()=>workspace.announcementAudiences(value),error=>error.statusCode===400);
  const restores=[];let filter,saved;const sent=[];
  try {
    patch(User,'find',query=>{filter=query;return chain([ids.teacher,ids.other]);},restores);
    patch(AdminAnnouncement,'create',async value=>{saved=value;return {...value,_id:ids.record,save:async()=>{}};},restores);
    patch(notifications,'createNotification',async event=>{sent.push(event);},restores);
    const result=await invoke(workspace.sendAdminAnnouncement,{body:{title:'Notice',message:'For parents and teachers',audiences:['parent','teacher'],recipientIds:[ids.student]}});
    assert.equal(result.status,201);assert.deepEqual(filter,{role:'user',type:{$in:['parent','teacher']},isActive:true,state:'active'});
    assert.deepEqual(saved.recipientIds,[ids.teacher,ids.other]);assert.equal(sent.length,2);assert.ok(sent.every(event=>event.type==='admin_announcement'));
    assert.equal(sent.some(event=>event.to===ids.student),false);assert.equal(result.body.data.deliveryStatus,'sent');
  }finally{restores.reverse().forEach(fn=>fn());}
});
test('Failed announcement delivery preserves the saved announcement and retry keys stay stable', async () => {
  const restores=[];const events=[];let fail=true;
  try {
    patch(notifications,'createNotification',async event=>{events.push(event);if(fail)throw Error('offline');},restores);
    const record={_id:ids.record,title:'Notice',message:'Read this',recipientIds:[ids.teacher],save:async()=>{}};
    assert.equal(await workspace.deliverAdminAnnouncement(record),false);assert.equal(record.deliveryStatus,'failed');
    fail=false;assert.equal(await workspace.deliverAdminAnnouncement(record),true);
    assert.equal(events[0].eventKey,events[1].eventKey);assert.equal(record.deliveryStatus,'sent');
  }finally{restores.reverse().forEach(fn=>fn());}
});
test('Admin can message every role across schools, while ordinary cross-school access stays denied', async () => {
  const restores=[];let role='admin';
  try {
    patch(User,'findById',id=>chain({ _id:id,isActive:true,schoolId:id===ids.admin?ids.school:ids.other,role:id===ids.admin?role:'user',type:id===ids.admin?'teacher':'parent' }),restores);
    assert.equal((await canMessageUser(ids.admin,ids.other)).allowed,true);
    assert.equal((await canMessageUser(ids.other,ids.admin)).allowed,true);
    role='administrator';assert.equal((await canMessageUser(ids.admin,ids.other)).allowed,false);
    role='user';assert.equal((await canMessageUser(ids.admin,ids.other)).allowed,false);
  }finally{restores.reverse().forEach(fn=>fn());}
});
test('Legacy teaching write endpoints reject Administrator even when they have school access', async () => {
  for(const module of ['homework','grading','behavior','attendances']) {
    const error=await new Promise(resolve=>resourceAccess(module)({user:administrator,body:{},params:{},query:{},headers:{},route:{path:'/'},method:'POST'},{},resolve));
    assert.equal(error.statusCode,403,module);
  }
});
test('Activity includes submitted assignments and completed assessments but not drafts/ongoing results', async () => {
  const restores=[];let submissions,queries=[];
  try {
    patch(Submission,'find',query=>{submissions=query;return chain([]);},restores);
    patch(QuizResult,'find',query=>{queries.push(query);return chain([]);},restores);
    const result=await invoke(workspace.workspaceActivity);
    assert.deepEqual(submissions,{status:{$ne:'draft'}});assert.ok(queries.every(query=>query['progress.status']==='completed'));assert.equal(queries[0].gradeStatus,'pending_review');
    assert.deepEqual(result.body.data,{submissions:[],reviews:[],autoGraded:[]});
  }finally{restores.reverse().forEach(fn=>fn());}
});

test('Admin announcement destinations require recipient ownership and expose no recipient list', async () => {
  const { Notification } = require('../src/models/notification.model');
  const { notificationDestination } = require('../src/controllers/notificationDestination.controller');
  const restores=[];let lookup,projection,allowed=true;
  try {
    patch(Notification,'findOne',async query=>{lookup=query;return allowed?{type:'admin_announcement',id:ids.record}:null;},restores);
    patch(AdminAnnouncement,'findById',()=>({select:async value=>{projection=value;return {title:'Notice',message:'Teachers only'};}}),restores);
    let result=await invoke(notificationDestination,{user:{_id:ids.teacher,role:'user',type:'teacher'},params:{notificationId:ids.record}});
    assert.equal(lookup.to,ids.teacher);assert.equal(result.body.data.kind,'announcement');assert.equal(projection.includes('recipientIds'),false);
    allowed=false;result=await invoke(notificationDestination,{user:{_id:ids.student,role:'user',type:'student'},params:{notificationId:ids.record}});
    assert.equal(result.error.statusCode,404);assert.equal(result.body,undefined);
  }finally{restores.reverse().forEach(fn=>fn());}
});

test('message remains sent when notification delivery fails, so a retry cannot duplicate it', async () => {
  const { Room }=require('../src/models/room.model');
  const { Message }=require('../src/models/message.model');
  const { createMessage }=require('../src/controllers/message.controllers');
  const restores=[];let creates=0;
  try {
    patch(Room,'findById',async()=>({participants:[{userId:ids.admin},{userId:ids.student}]}),restores);
    patch(Room,'findByIdAndUpdate',async()=>({}),restores);
    patch(Message,'create',async()=>{creates++;return {_id:ids.record};},restores);
    patch(notifications,'createNotification',async()=>{throw Error('offline');},restores);
    const result=await invoke(createMessage,{body:{message:'Actual message',roomId:ids.other}});
    assert.equal(result.status,201);assert.equal(creates,1);assert.match(result.body.notificationWarning,/Message sent/);
  }finally{restores.reverse().forEach(fn=>fn());}
});


test('Admin has no assignment, assessment or attendance creation routes in the workspace', () => {
  for (const path of ['/assignments','/assessments','/attendance']) {
    assert.equal(router.stack.some(layer => layer.route?.path === path && layer.route.methods.post), false, path);
  }
});
test('Legacy teaching creation rejects Admin while teachers retain access', async () => {
  const teacher={_id:ids.teacher,role:'user',type:'teacher',schoolId:ids.school};
  for (const [module,path] of [['homework','/create'],['grading','/sessions'],['quizzes','/'],['quiz/qa','/generate'],['attendances','/class']]) {
    const invokeAccess=actor=>new Promise(resolve=>resourceAccess(module)({user:actor,body:{},params:{},query:{},headers:{},route:{path},method:'POST'},{},resolve));
    assert.equal((await invokeAccess(admin)).statusCode,403,module);
    assert.equal(await invokeAccess(teacher),undefined,module);
  }
});
test('Class notifications open the notified class with ownership and class access enforced', async () => {
  const { Notification }=require('../src/models/notification.model');
  const { notificationDestination }=require('../src/controllers/notificationDestination.controller');
  const restores=[];let requested,owner;
  try {
    patch(Notification,'findOne',async query=>{owner=query.to;return {type:'class',id:ids.class};},restores);
    patch(Class,'findById',async id=>{requested=id;return {_id:ids.class,teacherId:ids.teacher,grade:6,subject:'Math'};},restores);
    patch(User,'findById',()=>chain({schoolId:ids.school}),restores);
    const result=await invoke(notificationDestination,{params:{notificationId:ids.record}});
    assert.equal(result.error,undefined);assert.equal(owner,ids.admin);assert.equal(requested,ids.class);
    assert.equal(result.body.data.kind,'class');assert.equal(result.body.data.record.subject,'Math');
  }finally{restores.reverse().forEach(fn=>fn());}
});
