const {test}=require('node:test'),assert=require('node:assert/strict');
require('ts-node/register/transpile-only');
const {User}=require('../src/models/user.model'),{Notification}=require('../src/models/notification.model');
const {createNotification}=require('../src/sockets/notification.service');
const {initRealtime}=require('../src/services/realtime.service');
test('saved notification preferences suppress global and category events while allowing other updates',async()=>{
 const originals=[User.findById,Notification.create];let preferences={},writes=0;const changes=[];
 initRealtime({to:room=>({emit:(event,payload)=>changes.push({room,event,payload})})});
 User.findById=()=>({select:async()=>({type:'student',state:'active',isActive:true,notificationPreferences:preferences})});
 Notification.create=async event=>{writes++;return event};
 try{
  for(const [prefs,type] of [[{enabled:false},'message'],[{message:false},'message'],[{grades:false},'quiz_result'],[{grades:false},'assignment_grade'],[{announcements:false},'admin_announcement'],[{documents:false},'academicDocument']]){
   preferences=prefs;assert.equal(await createNotification({to:'student',id:'record',type,message:'Example'}),null);
  }
  assert.equal(writes,0);assert.equal(changes.length,6);assert.ok(changes.every(change=>change.room==='user:student'&&change.event==='dataChanged'));preferences={message:false};await createNotification({to:'student',id:'record',type:'lesson',message:'Example'});assert.equal(writes,1);
 }finally{[User.findById,Notification.create]=originals;initRealtime(undefined);}
});
