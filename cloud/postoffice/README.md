# 绒角 · 小邮局

把小心意，寄到朋友的桌面。

**[打开小邮局 →](https://mofu-corner-dengjihui1.netlify.app/)** · [桌宠主项目](https://github.com/dengjihui1/mofu-corner) · [部署与验收记录](DEPLOYMENT.md)

![公开注册页面](docs/public-registration.png)

## 开始使用

1. 打开网址，选择「注册」，填写昵称、绒角号和密码。
2. 安全保存只显示一次的恢复码。无需邮箱、飞书企业应用或平台账号。
3. 把自己的绒角号告诉朋友。对方点「找朋友」，输入完整绒角号，发送申请。
4. 接受申请后可以私聊、送心心、摸摸头；聊天顶部可以发起关系绑定，双方确认后显示。

绒角号为 3–24 位字母、数字或下划线，以字母开头；密码为 10–128 个字符。密码与恢复码同时丢失时，当前无法找回账号。

关系支持闺蜜、同事、情侣、哥们儿、父子、母子、父女和母女。关系标签只对双方显示，任一方可解除。

![真实公网聊天与送心心](docs/public-chat.png)

![双方确认的关系选择](docs/public-relationships.png)

<details><summary>窄屏聊天界面</summary>

<img src="docs/public-chat-mobile.png" alt="窄屏聊天界面，发送按钮避开平台标识" width="390">

</details>

截图使用临时验收账号，拍摄后已清理，不含真实用户私聊。

## 接到 Windows / macOS 桌宠

在主项目目录运行：

```sh
node setup.mjs --postoffice https://mofu-corner-dengjihui1.netlify.app
```

也可以在桌宠「小邮局」的连接页填入同一个网址。网页注册的账号可直接登录桌面小邮局；朋友必须连接同一个服务。浏览器版提供社交功能，悬浮桌宠需运行主项目。

## 免费额度与访问情况

当前使用 **Netlify Free + Turso Free**，不需要自行购买域名或发信服务。Netlify 账户已关闭自动充值，未配置银行卡。免费额度用完可能暂停服务，并非无限容量或流量。

| 服务 | 免费额度 |
| --- | --- |
| Netlify | 每月 300 credits，网站请求、流量、函数和生产部署共享 |
| Turso | 5 GB 数据、每月 5 亿行读取和 1000 万行写入 |

以 [Netlify](https://www.netlify.com/pricing/) 与 [Turso](https://turso.tech/pricing/) 的实际套餐为准。

2026-10-30：本网址国内 9 个节点访问健康接口，7 个成功；北京、无锡节点首次连接失败，随后对这两个地区的 3 个节点复测首页均成功。**存在网络波动，不能保证全国所有运营商与所有时段可用。** 账号、好友、聊天、恢复码、关系、退出登录及删除关联数据已通过公网验收。

## 自行部署

需要 Node.js 22.18+、Netlify Free 账号、Turso Free 账号。前端与函数同站托管，数据库使用 libSQL，引擎不要选择需要另一套 SDK 的 TursoDB。

```sh
npm ci
npm test
npm run build
```

1. 在 Turso 建立 libSQL 数据库。默认 Netlify 函数位于 Ohio，数据库选择同地域可减少函数与数据库间延迟。
2. 从 `.env.example` 查看变量名称。在安全终端环境配置数据库 URL 和令牌后执行 `npm run migrate`。迁移带校验记录，不导入本地演示账号。
3. 用 `npx netlify login` 登录，创建或关联自己的项目。仓库不携带原项目 ID。
4. 在 Netlify 设置 `TURSO_DATABASE_URL`，将 `TURSO_AUTH_TOKEN` 标记为 **Secret**，仅填 Production 值；不要填本地开发或 Agent Runner 环境，不要提交令牌。
5. 运行 `npx netlify deploy --prod`，再将已部署网站设置为 Public。免费方案可能显示 Netlify 标识。
6. 检查 `/api/health`、注册与好友聊天。需要公网自动验收时设置 `MOFU_TEST_ORIGIN` 后执行 `node tests/live.mjs`；它创建并清理两个临时账号，会消耗少量额度与注册限流次数。

`npm start` 是本机内存数据库预览，地址 `http://127.0.0.1:4722`，重启后清空。它不会连接生产数据库。

## 数据与维护

当前生产服务端和数据库位于美国 Ohio，注册和聊天数据在该地域存储。隐私说明已公开列明托管方和存储地域。聊天未实现端到端加密；不读取飞书 / Lark 的消息或联系人。

提供屏蔽、举报、关闭搜索、导出与注销。聊天和举报保留 180 天，好友申请 30 天，关系邀请 7 天；清理由服务访问触发。维护者需处理举报，并关注免费额度。不要把这项免费服务作为重要资料的唯一存储。

只有 `public/` 和函数构建产物需要上传。`.local/`、`.netlify/`、环境文件、测试账号和密钥都不应提交到仓库。
