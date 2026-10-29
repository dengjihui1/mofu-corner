# 平台能力与验收

所有平台共用一个版本和源码包，安装时由 Electron 选择当前机器的运行时。不要跨系统复制 `node_modules/`。

| 能力 | Windows | macOS Apple Silicon / Intel |
| --- | --- | --- |
| 终端一键准备与启动 | 已提供、已本机验证 | 已适配，待 Mac CI/实机验收 |
| 十二生肖、昵称、身量、性格、本地保存 | 已验证 | 共用实现，待 Mac 验收 |
| 动作、表情、闲置活动与暂停 | 已验证 | 共用实现，待 Mac 验收 |
| 透明区域不阻挡下方应用 | 原生 window shape | 指针区域点击穿透适配，待 Mac 验收 |
| 托盘 / 菜单栏、小窝设置 | 已验证 | 菜单栏适配，待 Mac 验收 |
| 飞书/Lark 窗口外侧跟随 | 原生窗口测试通过 | 试用观察器，待 Mac 验收 |
| 读取真实聊天消息、自动改飞书状态 | 未实现 | 未实现 |

窗口外侧优先右下角右侧，其次下方。最大化没有可用空间时收起，恢复窗口后再出现；不把宠物夹回聊天页。打开小窝是用户主动操作，面板会先移回屏幕内。

Mac 使用 `/usr/bin/osascript` 运行内置 JXA 观察器，只取进程和窗口几何。若看不到客户端元数据，菜单栏可切回桌面陪伴；不引导用户关闭系统安全保护。

本地开发环境目前只有 Windows。CI 已配置 `windows-latest`、`macos-15`（Apple Silicon）、`macos-15-intel`，分别运行语法、单元、原生 Electron、设置启动与 Mac 元数据桥检查。只有真实 CI 通过后，才应把对应 Mac 能力从“待验收”改成“已验证”。

Intel Mac runner 是无可用 WebGL2 硬件后端的虚拟机，其隐藏窗口测试显式使用 [Chromium 的软件 GLES 驱动](https://chromium.googlesource.com/chromium/src/+/main/docs/gpu/swiftshader.md)。这只用于 `--smoke` / `--self-test` 且设置测试环境变量的进程；正常启动保留系统图形后端。CI 不代表 Intel Mac 实际 GPU 的性能验收。动态形变与表情需要 WebGL2。

依据：[Electron 点击穿透](https://www.electronjs.org/docs/latest/tutorial/custom-window-interactions)、[Apple 窗口元数据](https://developer.apple.com/documentation/coregraphics/cgwindowlistcopywindowinfo(_:_:))、[GitHub runner 平台](https://docs.github.com/en/actions/reference/runners/github-hosted-runners)。
