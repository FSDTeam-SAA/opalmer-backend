const { test } = require('node:test');
const assert = require('node:assert/strict');
require('ts-node/register/transpile-only');
const { User }=require('../src/models/user.model');
const { getStudentGenderStats }=require('../src/controllers/adminDashboard.controller');
test('school administrator gender counts are scoped and unreported gender counts as other',async()=>{
 const original=User.aggregate;const schoolId='507f1f77bcf86cd799439011';let filter,body;
 User.aggregate=async pipeline=>{filter=pipeline[0].$match;return [{_id:'male',count:1},{_id:null,count:2},{_id:'other',count:1}];};
 try{
  const res={status(){return this;},json(value){body=value;}};
  await getStudentGenderStats({user:{role:'administrator',schoolId}},res,e=>{throw e;});
  assert.equal(String(filter.schoolId),schoolId);assert.deepEqual(body.data,{male:1,female:0,other:3});
  await getStudentGenderStats({user:{role:'admin'}},res,e=>{throw e;});assert.deepEqual(filter,{type:'student'});
 }finally{User.aggregate=original;}
});
