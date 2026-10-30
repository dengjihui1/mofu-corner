import {randomUUID} from 'node:crypto';
import {relationshipType} from '../ui/relationships.mjs';
import {pair} from './store.mjs';

export function createRelationships({store,now,emit,requireFriend,fail,limits}) {
  const {get,run,transaction}=store,week=7*86400000;
  const changed=(a,b)=>{emit(a,'friends',{});emit(b,'friends',{});};
  const view=(row,viewer)=>{
    if(!row)return null;
    const roles=relationshipType(row.kind)?.roles;
    const other=roles?.find(role=>role!==row.a_role)||null;
    return {id:row.id,kind:row.kind,myRole:viewer===row.a?row.a_role:other,peerRole:viewer===row.a?other:row.a_role,
      created:row.created,...(row.sender?{incoming:row.recipient===viewer,expires:row.created+week}:{})};
  };
  const forUser=(viewer,peer)=>({
    relationship:view(get('SELECT * FROM relationships WHERE a=? AND b=?',...pair(viewer,peer)),viewer),
    relationshipRequest:view(get('SELECT * FROM relationship_requests WHERE a=? AND b=? AND created>?',...pair(viewer,peer),now()-week),viewer)
  });
  async function route(path,method,me,readBody) {
    const invitation=path.match(/^\/api\/relationships\/([\w-]+)\/(propose|remove)$/);
    const reply=path.match(/^\/api\/relationship-requests\/([\w-]+)\/(accept|decline|cancel)$/);
    if(!invitation&&!reply)return null;
    if(method!=='POST')fail(405,'不支持此操作');
    const data=await readBody();
    if(invitation){
      const peer=invitation[1],[a,b]=pair(me.id,peer);requireFriend(me.id,peer);
      if(invitation[2]==='remove'){
        const current=get('SELECT id FROM relationships WHERE a=? AND b=?',a,b);
        if(!current||current.id!==data.relationshipId)fail(409,'关系已经变化，请刷新后再操作');
        transaction(()=>{run('DELETE FROM relationships WHERE a=? AND b=?',a,b);run('DELETE FROM relationship_requests WHERE a=? AND b=?',a,b);});
        changed(a,b);return {data:{ok:true}};
      }
      limits.take(`relationship:${me.id}`,12,3600000);
      const type=relationshipType(data.kind);if(!type)fail(400,'请选择已有关系');
      if(type.roles?!type.roles.includes(data.myRole):data.myRole!=null)fail(400,'请选择你在这段关系中的身份');
      const role=type.roles?(me.id===a?data.myRole:type.roles.find(r=>r!==data.myRole)):null;
      const current=get('SELECT * FROM relationships WHERE a=? AND b=?',a,b);
      if(current?.kind===type.id&&current.a_role===role)fail(409,'已经绑定这段关系啦');
      const id=randomUUID();
      transaction(()=>{
        run('DELETE FROM relationship_requests WHERE a=? AND b=? AND created<=?',a,b,now()-week);
        if(get('SELECT 1 FROM relationship_requests WHERE a=? AND b=?',a,b))fail(409,'先处理当前的关系邀请吧');
        run('INSERT INTO relationship_requests(id,a,b,sender,recipient,kind,a_role,created) VALUES(?,?,?,?,?,?,?,?)',id,a,b,me.id,peer,type.id,role,now());
      });
      changed(a,b);return {status:201,data:{request:forUser(me.id,peer).relationshipRequest}};
    }
    const request=get('SELECT * FROM relationship_requests WHERE id=?',reply[1]);
    const actor=reply[2]==='cancel'?'sender':'recipient';
    if(!request||request[actor]!==me.id)fail(404,'这条关系邀请已处理或不属于你');
    requireFriend(me.id,me.id===request.a?request.b:request.a);
    if(request.created<=now()-week)fail(410,'关系邀请已过期，请重新发起');
    transaction(()=>{
      if(reply[2]==='accept')run(`INSERT INTO relationships(id,a,b,kind,a_role,created) VALUES(?,?,?,?,?,?)
        ON CONFLICT(a,b) DO UPDATE SET id=excluded.id,kind=excluded.kind,a_role=excluded.a_role,created=excluded.created`,
        randomUUID(),request.a,request.b,request.kind,request.a_role,now());
      run('DELETE FROM relationship_requests WHERE id=?',request.id);
    });
    changed(request.a,request.b);return {data:{ok:true}};
  }
  return {forUser,route};
}
