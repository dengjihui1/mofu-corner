# 小邮局：从本地测试到公开注册

小邮局是绒角自己的账号与好友服务。所有人连接同一个邮局地址后，可以注册、验证邮箱、搜索绒角号、互加好友和聊天；不同部署之间暂不互通。飞书 / Lark 无需授权，也不会提供它们的联系人或聊天内容。

**当前交付的是可部署源码，没有预置的官方公共服务。** 本地双账号及桌面通知已验证；公网域名、真实 SMTP 投递和线上容量需在你的部署环境完成验收。

## 先在本机试用

服务端需要 **Node.js 24.15+**。仅运行桌宠仍可使用 Node.js 22.12+。

```bash
node server/setup.mjs
```

打开 `http://127.0.0.1:4718/`。命令会安装服务端依赖并在当前终端运行；按 Ctrl+C 停止。

1. 注册一个测试账号。绒角号为 3–24 位字母、数字或下划线，须以字母开头。
2. 打开 `.local/postoffice/outbox/` 中对应邮箱的 JSON，复制 `url` 到浏览器，点击验证邮箱。
3. 登录；第二个测试账号可用另一个浏览器或独立浏览器配置。
4. 搜索对方的完整绒角号，对方同意后即可聊天、送心心和摸头。

本地模式不会投递真实邮件，默认仅监听本机环回地址。不要把开发模式映射到公网。

连接桌宠，另开一个终端运行：

```bash
node setup.mjs --postoffice http://127.0.0.1:4718
```

小窝底部、宠物右键和托盘都有“小邮局”入口。窗口右上角关闭只收起邮局，后台保持收信；退出桌宠才会断开。专注、会议和休息模式只保留未读提示。网页版可以聊天，桌面宠物反馈需要桌面程序正在运行。

## 公开部署需要什么

| 准备项 | 用途 |
| --- | --- |
| 常驻服务器与 Docker Compose | 运行单实例邮局与 HTTPS 入口 |
| 域名 | DNS 指向服务器；80 / 443 端口可达 |
| SMTP 发信配置 | 验证邮箱、重设密码；须使用可投递的发件地址 |
| 运营名称与联系邮箱 | 展示在服务条款和隐私说明中 |
| 持久化磁盘与备份位置 | 保存 SQLite 数据库，避免容器更新丢数据 |

当前架构为 **单实例 Node + SQLite + SSE**，适合先做小规模公开测试。未做线上压力测试；不支持多个服务副本共享数据库或不同邮局间互加好友。

## Docker Compose 部署

在服务器克隆仓库，进入项目根目录：

```bash
cp deploy/.env.example deploy/.env
```

编辑 `deploy/.env`，替换全部示例值：

```dotenv
DOMAIN=pets.your-domain.com
PUBLIC_URL=https://pets.your-domain.com
SMTP_HOST=smtp.your-provider.com
SMTP_PORT=587
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-password
MAIL_FROM=绒角小邮局 <no-reply@your-domain.com>
OPERATOR_NAME=实际运营方名称
SUPPORT_EMAIL=help@your-domain.com
REGISTRATION_OPEN=1
MESSAGE_RETENTION_DAYS=180
```

- `DOMAIN` 与 `PUBLIC_URL` 的域名必须一致；地址使用 HTTPS 根路径。
- SMTP 465 使用隐式 TLS，587 使用 STARTTLS。发件域名验证和投递设置按邮件供应商的要求完成。
- 如果密码包含 `$`，在 `.env` 中使用单引号包裹，避免 Compose 变量展开。不要把该文件提交到 Git。
- `REGISTRATION_OPEN=1` 为公开注册；改成 `0` 可暂停新注册，现有用户仍可登录。
- 发布前按实际运营方式检查 `ui/postoffice-legal.mjs` 中的条款、隐私说明与保留期；当前文本是项目初稿，并非针对某个地区的法律审查结果。

启动与检查：

```bash
docker compose --env-file deploy/.env -f deploy/compose.yml config --quiet
docker compose --env-file deploy/.env -f deploy/compose.yml up -d --build
docker compose --env-file deploy/.env -f deploy/compose.yml ps
```

Caddy 提供 HTTPS，并将请求转给内部 4718 端口；数据库位于命名卷 `postoffice_data`。不要额外把邮局容器端口开放到公网。默认代理设置针对这套 Compose 拓扑，增加 CDN 或其他代理时需重新核对客户端 IP 与限流配置。

访问 `https://你的域名/`，用自有邮箱完成注册、验证、重设密码，并与第二个账号完成互加好友和聊天。未通过真实邮件投递验证前，不应宣传为已完成公开上线。

普通用户使用桌宠时，只需配置一次该地址：

```bash
node setup.mjs --postoffice https://你的域名
```

也可以在小邮局连接页填地址；之后会记住。登录后需要换服务器，可在“我的小名片 → 账号与隐私 → 切换邮局”修改。账号和好友仅存在于所连接的服务器。

## 更新、备份与运营

更新前先备份，再拉取源码和重建容器：

```bash
docker compose --env-file deploy/.env -f deploy/compose.yml exec postoffice node server/admin.mjs backup
git pull --ff-only
docker compose --env-file deploy/.env -f deploy/compose.yml up -d --build
```

备份命令输出 `/data/backups/` 下的 SQLite 文件。将备份复制到受控的独立位置；同一服务器上的副本不能防止磁盘损坏。备份包含账号与聊天数据，不应放进公开仓库。日常更新不要使用 `down -v`，它会删除数据卷。恢复数据库应先停止服务，在独立环境验证备份后再恢复。

查看日志与举报：

```bash
docker compose --env-file deploy/.env -f deploy/compose.yml logs --tail 100 postoffice
docker compose --env-file deploy/.env -f deploy/compose.yml exec postoffice node server/admin.mjs reports
```

处理账号与举报（替换尖括号内容）：

```bash
docker compose --env-file deploy/.env -f deploy/compose.yml exec postoffice node server/admin.mjs ban <绒角号>
docker compose --env-file deploy/.env -f deploy/compose.yml exec postoffice node server/admin.mjs unban <绒角号>
docker compose --env-file deploy/.env -f deploy/compose.yml exec postoffice node server/admin.mjs resolve <举报ID>
```

举报入口会保存记录，需运营方定期查看处理；没有自动审核结论。管理员命令仅在服务器本地执行，不提供公网管理接口。

## 当前功能边界

- 必须验证邮箱后登录；搜索按完整绒角号匹配，不支持邮箱搜索或全站用户目录。
- 双向同意后才可聊天；支持文字（每条最多 1000 字符）、心心和摸头。
- 每人最多 200 位好友；互动有冷却，注册、登录、搜索、申请与发信均有限流。
- 聊天在服务端存储，尚未提供端到端加密。默认保留 180 天，可配置为 7–3650 天。
- 用户可关闭被搜索、屏蔽好友、举报、导出数据和注销。注销会删除双方与你相关的聊天；举报按说明保留。
- 没有群聊、图片 / 文件上传、音视频、支付、AI 对话或宠物跨桌面串门。
- 浏览器关闭后不提供系统推送；桌面绒角退出后也不收信，重新打开会读取保留期内的未读记录。
- 小邮局的头像与昵称独立保存，不会自动修改你电脑上的桌宠设置。

## 自动验收与截图

```bash
npm ci
npm ci --prefix server
npm run social:test
npm run test:social-desktop
```

服务端测试覆盖邮箱验证、好友权限、真实 HTTP / SSE、重复发送去重、屏蔽举报、导出、重设密码与注销。桌面测试使用临时服务和两个独立测试账号，检查真实渲染器、预加载桥、后台收信及窄窗口，并生成 `design/current/postoffice-*.png`。

SMTP、DNS 和公网 TLS 需要真实部署后单独验收；本地测试邮件不会离开电脑。
