import {resolve} from 'node:path';import {fileURLToPath} from 'node:url';
export function configuration(env=process.env){
 const production=env.NODE_ENV==='production', port=Number(env.PORT||4718);
 const base=new URL(env.PUBLIC_URL||`http://127.0.0.1:${port}`);
 if(!production&&(!['127.0.0.1','localhost','[::1]'].includes(base.hostname)||env.HOST&&!['127.0.0.1','localhost','::1'].includes(env.HOST)))throw Error('本地测试仅允许环回地址；公开部署请使用 NODE_ENV=production 和 HTTPS');
 if(base.username||base.password||base.search||base.hash||base.pathname!=='/')throw Error('PUBLIC_URL 必须是根地址，例如 https://pets.example.com');
 const config={production,port,host:env.HOST||(production?'0.0.0.0':'127.0.0.1'),origin:base.origin,
  dataDir:resolve(env.DATA_DIR||fileURLToPath(new URL('../.local/postoffice/',import.meta.url))),
  mailMode:env.MAIL_MODE||(production?'smtp':'outbox'),smtpHost:env.SMTP_HOST,smtpPort:Number(env.SMTP_PORT||587),smtpUser:env.SMTP_USER,smtpPass:env.SMTP_PASS,mailFrom:env.MAIL_FROM||'MofuCorner <local@localhost>',
  operator:env.OPERATOR_NAME||'本地测试邮局',support:env.SUPPORT_EMAIL||'',trustProxy:env.TRUST_PROXY==='1',registration:env.REGISTRATION_OPEN!=='0',retentionDays:Number(env.MESSAGE_RETENTION_DAYS||180)};
 if(production&&(base.protocol!=='https:'||config.mailMode!=='smtp'||!config.smtpHost||!env.MAIL_FROM||!env.OPERATOR_NAME||!env.SUPPORT_EMAIL))throw Error('公开部署需配置 HTTPS PUBLIC_URL、SMTP_HOST、MAIL_FROM、OPERATOR_NAME、SUPPORT_EMAIL；生产环境禁止本地邮件箱。');
 if(!['smtp','outbox'].includes(config.mailMode)||!Number.isInteger(config.retentionDays)||config.retentionDays<7||config.retentionDays>3650)throw Error('邮局配置无效');
 return config;
}
