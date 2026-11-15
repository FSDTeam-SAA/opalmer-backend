const {test}=require('node:test'),assert=require('node:assert/strict');
require('ts-node/register/transpile-only');
const {Room}=require('../src/models/room.model'),{Message}=require('../src/models/message.model');
const cloudinary=require('../src/utils/cloudinary');
const {createMessage}=require('../src/controllers/message.controllers');
test('failed attachment upload never saves an empty or partially missing message',async()=>{
 const originals=[Room.findById,Message.create,cloudinary.uploadToCloudinary];let writes=0,error;
 const user='507f1f77bcf86cd799439011',room='507f1f77bcf86cd799439012';
 Room.findById=async()=>({participants:[{userId:user}],blockedBy:[]});
 Message.create=async()=>{writes++;};cloudinary.uploadToCloudinary=async()=>null;
 try{
  await createMessage({user:{_id:user},body:{roomId:room},files:[{path:'qa.pdf',originalname:'qa.pdf'}]}, {}, e=>{error=e});
  assert.equal(error?.statusCode,502);assert.equal(writes,0);
 }finally{[Room.findById,Message.create,cloudinary.uploadToCloudinary]=originals;}
});
