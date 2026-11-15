const {test}=require('node:test'),assert=require('node:assert/strict');
require('ts-node/register/transpile-only');
const {Room}=require('../src/models/room.model'),{CallLog}=require('../src/models/callLog.model');
const {createCallLog,answerCallLog,endCallLog}=require('../src/controllers/callLog.controller');
const caller='507f1f77bcf86cd799439011',receiver='507f1f77bcf86cd799439012',outsider='507f1f77bcf86cd799439013',roomId='507f1f77bcf86cd799439014';
const invoke=async(handler,req)=>{let error,body;await handler(req,{status(){return this;},json(v){body=v}},e=>{error=e});return {error,body}};
test('call records require an unblocked direct room and its actual peer; audio is the supported default',async()=>{
 const originals=[Room.findById,CallLog.create];let saved;const room={type:'direct',participants:[{userId:caller},{userId:receiver}],blockedBy:[]};
 Room.findById=async()=>room;CallLog.create=async value=>{saved=value;return value};
 try{
  for(const [body,status] of [[{receiverId:outsider},403],[{receiverId:caller},403],[{receiverId:receiver,callType:'video'},400]]){
   const r=await invoke(createCallLog,{user:{_id:caller},body:{roomId,...body}});assert.equal(r.error?.statusCode,status);assert.equal(saved,undefined);
  }
  room.type='group';assert.equal((await invoke(createCallLog,{user:{_id:caller},body:{roomId,receiverId:receiver}})).error?.statusCode,400);
  room.type='direct';room.blockedBy=[receiver];assert.equal((await invoke(createCallLog,{user:{_id:caller},body:{roomId,receiverId:receiver}})).error?.statusCode,403);
  room.blockedBy=[];assert.equal((await invoke(createCallLog,{user:{_id:caller},body:{roomId,receiverId:receiver}})).error,undefined);assert.equal(saved.callType,'audio');
 }finally{[Room.findById,CallLog.create]=originals;}
});
test('only the receiver answers and final call duration/status are validated',async()=>{
 const originals=[Room.findById,CallLog.findById];let saves=0;
 const log={roomId,callerId:caller,receiverId:receiver,status:'ongoing',save:async()=>{saves++}};
 Room.findById=async()=>({participants:[{userId:caller},{userId:receiver}]});CallLog.findById=async()=>log;
 try{
  assert.equal((await invoke(answerCallLog,{user:{_id:caller},params:{id:roomId}})).error?.statusCode,403);
  assert.equal((await invoke(answerCallLog,{user:{_id:receiver},params:{id:roomId}})).error,undefined);assert.equal(saves,1);
  for(const body of [{status:'ongoing'},{duration:-1},{duration:'20'},{duration:Infinity}])assert.equal((await invoke(endCallLog,{user:{_id:caller},params:{id:roomId},body})).error?.statusCode,400);
  assert.equal(saves,1);
 }finally{[Room.findById,CallLog.findById]=originals;}
});
