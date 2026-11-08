# 在 Mac 的 Obsidian 中使用

Bingo Garden 1.3.1 使用与 1.3.0 相同的运行逻辑，已经使用跨平台的 Obsidian 接口，Mac 使用同一个插件包，无需独立 App、服务器或 Node.js。

1. 使用 Obsidian 1.14.4 或以上版本。
2. 将安装包内的 `bingo-garden` 文件夹放入笔记库的 `.obsidian/plugins/`。
3. 在 Finder 中按 `Command + Shift + .` 可显示 `.obsidian` 隐藏文件夹。
4. 确认目录直接包含 `main.js`、`manifest.json` 和 `styles.css`。
5. 打开 Obsidian 的“设置 → 第三方插件”，启用 Bingo Garden。
6. 点击左侧棋盘图标，或用 `Command + P` 搜索“Bingo Garden”，创建棋盘。

更新只需替换运行文件，保留笔记库中的 `Bingo Garden/` 文件夹。该文件夹中的 Markdown 保存棋盘、任务和进度。

## 本次实测

2026-11-08，macOS 27.2、Apple Silicon、Obsidian 1.14.5，使用独立测试库：

- 插件加载，创建 5×5 棋盘及奖励文字。
- 批量添加 5 项任务，自动分配图标。
- 勾选第一行的 5 项，显示 100% 完成、1 条 Bingo。
- Markdown 文件中保留 25 个格子及 5 项完成状态。
- 重载 Obsidian 后名称、奖励和完成状态均保留。
- 20 项自动测试及发布文件检查通过。

1.3.1 更新版本信息、安装说明和 Mac 验证记录，运行逻辑与上述实测的 1.3.0 相同。Intel Mac、移动设备与实际跨设备同步不属于本次真机验证范围。
