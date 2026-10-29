import test from 'node:test';
import assert from 'node:assert/strict';
import {createSnapshotGate} from '../src/snapshot-order.mjs';
test('迟到的休息状态和重复回执不能覆盖已唤醒的新状态',()=>{
  const accept=createSnapshotGate();
  assert.equal(accept({sequence:10,state:{mode:'rest'}}),true);
  assert.equal(accept({sequence:12,state:{mode:'available'}}),true);
  assert.equal(accept({sequence:11,state:{mode:'rest'}}),false);
  assert.equal(accept({sequence:12,state:{mode:'available'}}),false);
  assert.equal(accept({sequence:13,state:{mode:'available'}}),true);
  assert.equal(accept(null),false);
});
