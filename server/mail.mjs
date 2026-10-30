import nodemailer from 'nodemailer';import {mkdir,writeFile} from 'node:fs/promises';import {join} from 'node:path';import {randomUUID} from 'node:crypto';
export function mailer(config){
 const transport=config.mailMode==='smtp'?nodemailer.createTransport({host:config.smtpHost,port:config.smtpPort,secure:config.smtpPort===465,requireTLS:config.production,auth:config.smtpUser?{user:config.smtpUser,pass:config.smtpPass}:undefined,connectionTimeout:10000,greetingTimeout:10000,socketTimeout:15000,disableFileAccess:true,disableUrlAccess:true}):null;
 return async({to,kind,token})=>{
  const url=`${config.origin}/#${kind}=${encodeURIComponent(token)}`,subject=kind==='verify'?'欢迎来绒角，验证你的邮箱':'重设绒角登录密码';
  const message={from:config.mailFrom,to,subject,text:`${subject}\n\n请在 30 分钟内打开：\n${url}\n\n如果不是你发起的请求，请忽略这封邮件。`};
  if(transport){await transport.sendMail(message);return;}
  if(config.production)throw Error('生产环境禁止本地邮件箱');
  const dir=join(config.dataDir,'outbox');await mkdir(dir,{recursive:true,mode:0o700});await writeFile(join(dir,`${Date.now()}-${randomUUID()}.json`),JSON.stringify({...message,kind,url},null,2),{mode:0o600});
 };
}
