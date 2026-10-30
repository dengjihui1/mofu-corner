import test from 'node:test';import assert from 'node:assert/strict';
import {inviteHandle,friendInviteUrl} from '../cloud/postoffice/public/friend-invite.mjs';
test('friend invitation accepts only public handles, not URLs or markup',()=>{
 assert.equal(inviteHandle(' @Little_Bunny '),'little_bunny');
 for(const value of [null,'','aa','a'.repeat(25),'<img src=x onerror=alert(1)>','https://other.test','../private','abc&admin=1','%61bc'])assert.equal(inviteHandle(value),null);
});
test('copying own invitation removes incoming parameters, fragments and paths',()=>{
 assert.equal(friendInviteUrl('https://example.test/inbox?friend=someone_else&token=no#private','my_pet'),'https://example.test/?friend=my_pet');
 assert.throws(()=>friendInviteUrl('javascript:alert(1)','my_pet'));
 assert.throws(()=>friendInviteUrl('https://example.test','bad/target'));
});
