import {configuration} from './config.mjs';import {createPostoffice} from './application.mjs';
const [major,minor]=process.versions.node.split('.').map(Number);
if(major<24||(major===24&&minor<15))throw Error('小邮局服务端需要 Node.js 24.15 或更新版本');
process.umask(0o077);
const config=configuration(),app=createPostoffice(config);
app.server.listen(config.port,config.host,()=>{console.log(`绒角小邮局 ${config.origin}`);if(!config.production)console.log(`本地测试邮件保存在 ${config.dataDir}/outbox；不会向外发送邮件。`);});
for(const signal of ['SIGTERM','SIGINT'])process.on(signal,()=>app.close().then(()=>process.exit(0)));
