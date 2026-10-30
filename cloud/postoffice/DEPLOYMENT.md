# 公开部署记录

- 日期：2026-10-30
- 入口：https://mofu-corner-dengjihui1.netlify.app/
- Netlify 项目：mofu-corner-dengjihui1
- 首次生产部署：6ae44b97f977ab69f7e1f026
- 当前生产部署：6ae44f624ab3844a039ba378（为免费托管标识预留底部空间，避免覆盖发送按钮）
- 数据库：Turso libSQL，mofu-postoffice，Ohio；新建空库，不迁移本机演示账号。
- 认证：绒角号 + 密码 + 单次恢复码，无需邮件。
- Secret：数据库令牌仅配置到 Production；未放入源码、网页或本地开发环境。
- 免费模式：未开启付费升级或自动充值。

## 验证结果

本地 API 与构建通过。公网双账号测试通过注册、会话、CSRF、好友双方确认、消息收发与去重、父子角色对应、恢复码轮换、旧会话撤销、退出登录、导出、注销和数据库级联清理。合成验收账号已清理。

真实浏览器完成登录、好友聊天、文本发送、送心心、关系选择与退出登录；控制台无错误。1280px 与 390px 宽度下均确认发送按钮命中自身，不被 Netlify 免费标识遮挡。截图位于 docs/。

国内探测不是全国可用性保证，也不是国内浏览器完整注册流程的替代品：

| 探测 | 范围 | 结果 |
| --- | --- | --- |
| [2YesWCc2bDo2RyUUB00021PWQ](https://api.globalping.io/v1/measurements/2YesWCc2bDo2RyUUB00021PWQ) | 9 个国内节点，GET /api/health | 7 个 HTTP 200；北京 ECONNRESET、无锡 TCP 超时 |
| [28Az9qig6KxLNbCGo00021PWS](https://api.globalping.io/v1/measurements/28Az9qig6KxLNbCGo00021PWS) | 北京 2 个、无锡 1 个节点，GET / | 3 个 HTTP 200 |

首轮成功节点涵盖武汉、成都、广州、深圳、上海、台山、芜湖，包含联通、移动和云厂商网络。成功的健康接口耗时约 0.74–1.16 秒。测试可反映该时刻的网络情况，不能保证长期稳定。

此前 chatgpt.site 地址在 9 个国内节点均返回 403，因此改用本部署。不建议继续向朋友分发旧地址；两个服务的账号数据独立。
