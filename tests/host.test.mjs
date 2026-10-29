import test from 'node:test';
import assert from 'node:assert/strict';
import { validateHost, dockPosition, validFootprints, DEFAULT_FOOTPRINTS } from '../src/host.mjs';
test('窗口数据只保留进程和位置，拒绝异常坐标', () => {
  const value = { status: 'ready', brand: 'lark', pid: 100, active: true, bounds: { x: 10, y: 10, width: 800, height: 700 }, title: '不要保留的窗口文本' };
  assert.equal(validateHost(value).title, undefined);
  assert.throws(() => validateHost({ ...value, bounds: { ...value.bounds, width: NaN } }));
  assert.deepEqual(validateHost({ status: 'missing', title: 'discard' }), { status: 'missing' });
});
const area={x:0,y:0,width:1920,height:1040};
function checkOutside(host,work,layout=DEFAULT_FOOTPRINTS){const p=dockPosition(host,work,layout);if(p.visible){const r=p.footprint;assert.ok(r.x>=work.x&&r.y>=work.y&&r.x+r.width<=work.x+work.width&&r.y+r.height<=work.y+work.height);assert.ok(r.x>=host.x+host.width+12||r.y>=host.y+host.height+12);const local=p.placement==='right'?layout.side:layout.body;assert.equal(p.x+local.x,r.x);assert.equal(p.y+local.y,r.y);}return p;}
test('优先把完整可见区域停在窗口右下角外侧，透明空白可重叠',()=>{assert.equal(checkOutside({x:100,y:100,width:1200,height:800},area).placement,'right');});
test('右侧空间不足时改停在窗口下方',()=>{assert.equal(checkOutside({x:0,y:0,width:1900,height:700},area).placement,'bottom');});
test('最大化、屏幕过小和窗口离屏时收进托盘，绝不夹回页面',()=>{for(const [host,work]of [[area,area],[{x:0,y:0,width:100,height:100},{x:0,y:0,width:200,height:200}],[{x:4000,y:-2000,width:800,height:800},area]])assert.equal(checkOutside(host,work).visible,false);});
test('负坐标显示器及不同窗口大小都保持外侧与工作区边界',()=>{const work={x:-1920,y:-200,width:1920,height:1040};for(let w=300;w<1800;w+=173)for(let h=300;h<1000;h+=127)checkOutside({x:-1800,y:-160,width:w,height:h},work);});
test('按真实宠物和气泡区域停靠；放大后宁可收起也不遮挡',()=>{assert.ok(validFootprints(DEFAULT_FOOTPRINTS));assert.ok(!validFootprints({body:{x:0,y:0,width:999,height:999}}));const host={x:0,y:0,width:1700,height:1040};assert.equal(checkOutside(host,area).placement,'right');const larger={body:{x:190,y:380,width:250,height:270},side:{x:190,y:270,width:250,height:380}};assert.equal(checkOutside(host,area,larger).visible,false);});
