import {createClient} from '@libsql/client/http';
import {handle} from '../../lib/api.mjs';
import {storage} from '../../lib/storage.mjs';
import {LAYOUT_SCHEMA_SQL} from '../../lib/room-schema.mjs';
let database,layoutReady;
export default async (request, context) => {
  if(!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN)
    return Response.json({error:'邮局正在准备，请稍后再来'},{status:503,headers:{'Cache-Control':'no-store'}});
  database ||= storage(createClient({url:process.env.TURSO_DATABASE_URL,authToken:process.env.TURSO_AUTH_TOKEN}));
  // Additive and idempotent: old accounts keep their equipment until first opening their room.
  // Run in the same region as Turso; never expose a migration endpoint or database credentials.
  layoutReady ||= database.prepare(LAYOUT_SCHEMA_SQL).run().catch(error=>{layoutReady=null;throw error;});
  await layoutReady;
  const headers=new Headers(request.headers);
  // Ignore visitor-supplied forwarding headers; use Netlify's trusted request context.
  headers.set('cf-connecting-ip',context.ip||'unknown');
  return handle(new Request(request,{headers}),database);
};
export const config = {path:'/api/*'};
