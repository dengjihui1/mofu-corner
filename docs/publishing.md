# GitHub 与源码发布

同一仓库支持 Windows、Mac Apple Silicon 与 Mac Intel，不维护三份会漂移的源码。

发布前使用 Node.js 24.15+ 运行（普通桌宠仍兼容 22.12+）：

```sh
npm test
npm run check
npm run test:desktop
npm run test:setup
npm ci --prefix server
npm run social:test
npm run test:social-desktop
npm run package:source
```

源码 ZIP 与 SHA-256 位于 `dist/`。它们包含启动入口、Windows/Mac 适配、界面与素材、测试、CI、README、平台说明和小邮局部署配置，排除 `node_modules`、`.local`、日志、密钥与本机验收数据。ZIP 中 Mac `.command` 入口带可执行位，仍可用 `bash Start-MofuCorner.command` 启动。

推送后检查 Actions 中三个平台的结果。CI 成功后会上传通用源码包，不自动发布 npm 包、商店客户端或修改 Release。创建正式 Release 时，使用与 `package.json`、lockfile 和 CHANGELOG 相同的版本号。

README 截图使用 `design/current/` 中真实运行界面的截图，不使用旧概念图或未实现功能的图片。历史设计记录保留在开发目录，但不作为当前功能展示。

小邮局公开服务部署与源码发布是两个步骤。公开注册需要实际域名、SMTP 和服务器；推送 GitHub 不会自动产生可用的公共邮局。[部署说明](social-deployment.md)
