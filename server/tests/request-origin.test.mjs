import test from 'node:test';
import assert from 'node:assert/strict';
import {allowedRequestOrigin as allowed} from '../request-origin.mjs';
test('local frontend aliases work without accepting arbitrary hosts or ports',()=>{
  assert.equal(allowed('http://127.0.0.1:5173'),true);
  assert.equal(allowed('http://[::1]:5173'),true);
  for(const origin of ['http://evil.example:5173','http://localhost.evil.example:5173','http://127.0.0.1:9999','https://127.0.0.1:5173','null','http://127.0.0.1:5173/path'])assert.equal(allowed(origin),false,origin);
});
test('production accepts only its configured exact origin',()=>{
 const env={PUBLIC_ORIGIN:'https://midnight.vote',NODE_ENV:'production'};
 assert.equal(allowed('https://midnight.vote',env),true);
 assert.equal(allowed('http://127.0.0.1:5173',env),false);
 assert.equal(allowed('https://evil.example',env),false);
 assert.equal(allowed('http://127.0.0.1:5173',{PUBLIC_ORIGIN:'http://localhost:5173',NODE_ENV:'production'}),false);
});
