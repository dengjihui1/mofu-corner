import {createClient} from '@libsql/client/http';
import {handle} from '../../lib/api.mjs';
import {storage} from '../../lib/storage.mjs';
let database;
export default async (request, context) => {
  if(!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN)
    return Response.json({error:'邮局正在准备，请稍后再来'},{status:503,headers:{'Cache-Control':'no-store'}});
  database ||= storage(createClient({url:process.env.TURSO_DATABASE_URL,authToken:process.env.TURSO_AUTH_TOKEN}));
  const headers=new Headers(request.headers);
  // Ignore visitor-supplied forwarding headers; use Netlify's trusted request context.
  headers.set('cf-connecting-ip',context.ip||'unknown');
  return handle(new Request(request,{headers}),database);
};
export const config = {path:'/api/*'};
