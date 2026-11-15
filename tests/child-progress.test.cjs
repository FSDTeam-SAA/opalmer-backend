const {test}=require('node:test'),assert=require('node:assert/strict');
require('ts-node/register/transpile-only');
const {childProgress}=require('../src/controllers/parentsChild.controller');
test('parent progress distinguishes unpublished or missing grades from a released zero',()=>{
 assert.deepEqual(childProgress([]),{progress:null,tagText:'Awaiting grades'});
 assert.deepEqual(childProgress([{percentage:null}]),{progress:null,tagText:'Awaiting grades'});
 assert.deepEqual(childProgress([{percentage:0}]),{progress:0,tagText:'Needs Work'});
 assert.deepEqual(childProgress([{percentage:80},{percentage:100}]),{progress:0.9,tagText:'Excellent'});
});
