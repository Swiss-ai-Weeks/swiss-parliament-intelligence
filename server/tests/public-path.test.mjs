import test from 'node:test';
import assert from 'node:assert/strict';
import {createStore} from '../store.mjs';
import {createServer} from '../index.mjs';
import {prefixMedia} from '../../frontend/src/services/pilotApi.js';

test('Swiss subpath isolates API routes and preserves query parameters on redirect',async()=>{
 const store=createStore(':memory:');
 const {server}=createServer({store,env:{PUBLIC_BASE_PATH:'/Switzerland/'}});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base=`http://127.0.0.1:${server.address().port}`;
 try{
  assert.equal((await fetch(base+'/Switzerland/api/health')).status,200);
  assert.equal((await fetch(base+'/api/health')).status,404);
  assert.equal((await fetch(base+'/Switzerland-other/api/health')).status,404);
  const redirect=await fetch(base+'/Switzerland?view=parliament',{redirect:'manual'});
  const lowercase=await fetch(base+'/switzerland/?view=parliament',{redirect:'manual'});
  assert.equal(lowercase.status,308);assert.equal(lowercase.headers.get('location'),'/Switzerland/?view=parliament');
  assert.equal(redirect.status,308);
  assert.equal(redirect.headers.get('location'),'/Switzerland/?view=parliament');
 }finally{await new Promise(resolve=>server.close(resolve));store.close();}
});

test('media paths follow the public mount without rewriting official sources',()=>{
 const source={url:'https://www.parlament.ch/media/record',clips:[{url:'/media/video.mp4'}],start:0,missing:null};
 assert.deepEqual(prefixMedia(source,'/Switzerland/'),{...source,clips:[{url:'/Switzerland/media/video.mp4'}]});
 assert.equal(source.clips[0].url,'/media/video.mp4');
});
