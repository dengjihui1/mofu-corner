# 平台能力与验收

所有平台共用一个版本和源码包，安装时由 Electron 选择当前机器的运行时。不要跨系统复制 `node_modules/`。

| 能力 | Windows | macOS Apple Silicon / Intel |
| --- | --- | --- |
| 终端一键准备与启动 | 已提供、已本机验证 | CI 已通过；待实际桌面试用 |
| 十二生肖、昵称、身量、性格、本地保存 | 已验证 | CI 已通过；待实际桌面试用 |
| 动作、表情、闲置活动与暂停 | 已验证 | CI 已通过；待实际桌面试用 |
| 透明区域不阻挡下方应用 | 原生 window shape | 区域判断单测通过；真实鼠标待实机试用 |
| 托盘 / 菜单栏、小窝设置 | 已验证 | 原生初始化 CI 通过；菜单栏待实机试用 |
| 飞书/Lark 窗口外侧跟随 | 原生窗口测试通过 | 元数据桥与合成窗口定位 CI 通过；真实客户端仍为试用 |
| 读取真实聊天消息、自动改飞书状态 | 未实现 | 未实现 |

窗口外侧优先右下角右侧，其次下方。最大化没有可用空间时收起，恢复窗口后再出现；不把宠物夹回聊天页。打开小窝是用户主动操作，面板会先移回屏幕内。

Mac 使用 `/usr/bin/osascript` 运行内置 JXA 观察器，只取进程和窗口几何。若看不到客户端元数据，菜单栏可切回桌面陪伴；不引导用户关闭系统安全保护。

2026-10-29：[三平台 CI 已通过](https://github.com/dengjihui1/mofu-corner/actions/runs/40872333681)，覆盖 `windows-latest`、`macos-15`（Apple Silicon）、`macos-15-intel`。每个平台完成语法、单元测试、30 项桌面行为检查与首次 / 重复启动；Mac 另完成实际系统元数据桥调用。原生定位验收使用合成客户端窗口数据，不代表已在 Mac 上安装飞书 / Lark 并进行人工验收。多屏、真实客户端切换与点击穿透的实际鼠标体验仍需实机试用。

Intel Mac runner 是无可用 WebGL2 硬件后端的虚拟机，其隐藏窗口测试仅对受信任的本地测试页显式使用 [Chromium 的软件 GLES 驱动](https://chromium.googlesource.com/chromium/src/+/main/docs/gpu/swiftshader.md)。该 CPU 后端采用 Chromium 文档中的显式 SwiftShader WebGL 测试开关，并使用独立临时配置目录。这只用于 `--smoke` / `--self-test` 且设置测试环境变量的进程；正常启动保留系统图形后端。CI 不代表 Intel Mac 实际 GPU 的性能验收。动态形变与表情需要 WebGL2。

依据：[Electron 点击穿透](https://www.electronjs.org/docs/latest/tutorial/custom-window-interactions)、[Apple 窗口元数据](https://developer.apple.com/documentation/coregraphics/cgwindowlistcopywindowinfo(_:_:))、[GitHub runner 平台](https://docs.github.com/en/actions/reference/runners/github-hosted-runners)。

## 小邮局社交模块

服务端需要 Node.js 24.15+，独立于桌宠的 Node.js 22.12+ 启动环境；公开部署使用 Linux 容器。新增桌面邮局在 Windows 隐藏原生窗口中验证了真实账号、SSE、预加载权限隔离和后台通知；新模块的 macOS 实机行为仍待试用。已有桌宠三平台 CI 结论不替代社交模块的真实服务验收。
