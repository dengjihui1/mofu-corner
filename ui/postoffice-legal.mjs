const cfg=await fetch('/api/config').then(r=>r.json()),privacy=location.pathname==='/privacy';document.getElementById('legal-title').textContent=privacy?'隐私与数据说明':'小邮局服务条款';const sections=privacy?[
 ['我们保存什么','注册邮箱、昵称、绒角号、所选宠物、密码的加盐派生值、登录会话、好友关系、聊天内容、互动和举报。不会读取飞书 / Lark 的聊天内容，也不会读取其他应用页面。'],
 ['这些数据如何使用','邮箱仅用于验证和找回密码，不在好友搜索中展示。昵称、绒角号和宠物用于好友识别。只有双方同意成为好友后才能私聊。聊天存储在运营方服务器，尚未提供端到端加密。'],
 ['保存多久',`聊天记录保留 ${cfg.retentionDays} 天；好友申请 30 天；未验证账号 7 天。登录会话最长 14 天。验证和重设链接 30 分钟后失效。举报与附带证据保留 ${cfg.retentionDays} 天，用于处理滥用。`],
 ['你的选择','可关闭账号搜索、屏蔽用户、下载个人数据、注销账号。注销会删除账号、好友关系及双方与你相关的聊天记录，无法恢复；已提交的举报在保留期内用于处理滥用。备份按部署方的保留周期淘汰。'],
 ['邮件与连接','验证和重设邮件由运营方配置的邮件服务发送。服务使用必要的登录 Cookie。网络连接信息用于限流和防滥用，不用于广告画像。']
 ]:[['使用范围','小邮局提供账号、好友私聊及轻量宠物互动。请使用你可控制的邮箱，妥善保管密码，不冒用他人身份。'],['相处约定','请勿发送骚扰、欺诈、侵权或其他违法内容。尊重好友意愿，不绕过屏蔽或反复发送申请。你可以使用举报和屏蔽功能；运营方可限制违反约定的账号。'],['服务与数据','本产品处于公测准备阶段，可能进行维护或调整。聊天记录按隐私说明保存；请自行保留重要资料。当前不提供付费交易、群聊、文件上传或音视频通话。'],['停止使用','可随时退出登录或在个人设置中注销账号。注销的删除范围和举报保留期见隐私说明。']];const root=document.getElementById('legal-content');for(const[title,copy]of sections){const h=document.createElement('h2'),p=document.createElement('p');h.textContent=title;p.textContent=copy;root.append(h,p);}const contact=document.createElement('p');contact.textContent=cfg.development?(cfg.localMail!==false?'当前为本地测试环境，不会向外寄送邮件。':'当前为本地测试环境，验证邮件通过所配置的邮件服务发送。'):`运营方：${cfg.operator}。联系邮箱：${cfg.support}。`;root.append(contact);
