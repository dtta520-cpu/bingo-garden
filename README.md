# Bingo Garden / Bingo 花园

Turn tasks into bingo boards inside Obsidian. Complete a row, column, or diagonal to celebrate small wins. Create multiple 3 by 3 to 6 by 6 boards, paste tasks in bulk, edit titles in place, and assign icons automatically or manually.

**Chinese interface.** Free, MIT licensed, and fully local: no account, network requests, telemetry, subscriptions, or file access outside the vault. Boards are stored as Markdown files in `Bingo Garden/`. Sync is provided by your existing vault sync tool; this plugin does not provide a sync service or offline conflict merging.

**Installation:** download `main.js`, `manifest.json`, and `styles.css` from the [latest release](https://github.com/dtta520-cpu/bingo-garden/releases/latest), place them in `<vault>/.obsidian/plugins/bingo-garden/`, reload Obsidian, and enable Bingo Garden in Community plugins. Requires Obsidian 1.14.4 or later. The community directory listing is not yet confirmed; manual installation is available now.

![Bingo Garden with example tasks](./screenshots/bingo-garden.png)

## 中文使用说明

把想做的事情放进一张棋盘：完成一项，点亮一格；横、竖、对角线连成一线，就收获一次 Bingo。

版本：1.2.1。适合个人使用。无需 Tasks 插件、账号、服务器或插件订阅。

## 安装

1. 解压安装包，找到 `bingo-garden` 文件夹。里面应直接包含 `main.js`、`manifest.json` 和 `styles.css`。
2. 在你要使用的 Obsidian 笔记库中，打开 `.obsidian/plugins/` 文件夹；如果 `plugins` 不存在，创建它。
3. 把整个 `bingo-garden` 文件夹放进去。最终路径应为：`你的笔记库/.obsidian/plugins/bingo-garden/main.js`。注意不要多套一层同名文件夹。
4. 重新加载 Obsidian。在「设置 → 第三方插件」中，按 Obsidian 提示允许使用社区插件，然后启用 **Bingo Garden**。
5. 点击左侧的九宫格图标，或在命令面板中运行 **Bingo Garden: 打开棋盘**。

社区目录尚未确认上架，当前请从 [GitHub Releases](https://github.com/dtta520-cpu/bingo-garden/releases) 下载三个运行文件手动安装。GitHub 公开发布与社区目录上架是两个独立步骤。

手机端也需要安装和启用插件。最方便的方式是通过你的同步方案同步插件文件，或将上述三个运行文件放入手机端同一笔记库的相应插件目录，再重新加载并启用。不同同步工具对 `.obsidian` 的支持不同：仅同步笔记文件，不代表插件也已安装。iOS 的隐藏目录操作可能需要借助同步工具；本版未在 iPhone / Android 真机安装验证。

## 怎么玩

- **新建棋盘：** 自定义名称，选择 3×3、4×4、5×5 或 6×6，选择配色，填写连线奖励。可以创建多张棋盘，通过顶部标签切换。
- **快速添加：** 棋盘上方直接输入，按 Enter 添加并继续输入下一件；Shift + Enter 换行。可一次粘贴多行（包括 Markdown 复选清单和编号列表），每行一项，依次填入空格。只剩少量空格时，超出的输入会整体保留，不会覆盖已有事项。
- **详细添加：** 点击空格填写名称、图标和补充说明；也可以点击「批量添加」，每行输入一项，填入空格。
- **完成 / 撤销：** 在普通模式点击已有事项，即可切换完成状态。
- **连续修改：** 点击「编辑格子」后直接在格子里修改名称。Enter / Tab 保存并跳到下一格，Shift + Tab 返回上一格；离开输入框也会保存。Esc 放弃当前未保存修改，恢复文件中的最新名称。点「完成编辑」会保存草稿并回到打卡模式。
- **图标和说明：** 编辑模式中点击格子右上角「详情」；电脑端在普通模式也可以右键格子打开编辑窗口。
- **自动搭配图标：** 新增事项会按名称匹配图标（如读书 📖、散步 🏃、工作 💻），相同类别优先使用不同图标；未匹配到类别时从多种图标中分配。图标随事项保存，重新打开或点击完成不会重新分配。详情中的「按事项内容自动搭配图标」可开关；手动选择图标后会保留你的选择。自动模式下，修改事项名称会重新匹配。旧版已有事项和自选图标保持原样，需要自动匹配时在详情里开启。
- **清空格子：** 在编辑窗口中清空事项名称并保存，同时清除该格说明与完成状态。
- **连线：** 同一行、同一列或一条对角线的所有格子都有事项且全部完成，才算一次 Bingo。空格不算完成，没有自动赠送的中心格。
- **奖励：** 连成一线时显示你设置的奖励和庆祝效果。奖励是给自己的提示，本版不包含积分兑换商城。
- **调整尺寸：** 在「更多 → 棋盘设置」中修改。已有事项按原先顺序重新排列、完成记录保留，连线重新计算；如果缩小会装不下已有内容，操作会被拒绝。
- **打乱：** 只能打乱尚无完成记录的棋盘，避免改变已有连线。
- **新一轮：** 「更多 → 复制为新一轮」保留原棋盘，把事项和奖励复制到新棋盘，并清空新棋盘的完成状态。
- **归档 / 恢复：** 归档保存历史记录，可随时恢复。插件界面不提供永久删除。

本版采用手动新建 / 复制下一轮，不会在午夜或每周自动重置棋盘。没有后台提醒、倒计时和手机桌面小组件。

## 数据与多端同步

每张棋盘是笔记库中 `Bingo Garden/` 下的一份独立 Markdown 文件。文件名使用唯一标识，避免同名棋盘覆盖。文件中的 `bingo-garden-data` 数据块保存事项、位置、完成时间、配色、奖励和归档状态。

在 Obsidian 阅读模式中，该数据块显示为「打开棋盘」入口。代码块下方可以添加自己的笔记；插件保存棋盘时会保留数据块外的内容。不要手动修改数据块，除非你了解其结构；损坏的数据会显示错误，插件不会以空白内容覆盖原文件。

配合 Remotely Save、Obsidian Sync 或其他笔记库同步工具即可传递这些 Markdown 文件。Bingo Garden 本身不连接云端、不处理账户，也不验证同步是否已经完成。

建议流程：

1. 在各设备安装同一版本插件。
2. 将 `Bingo Garden/` 文件夹纳入同一个笔记库的同步范围。
3. 新设备打开 Obsidian 后先完成同步，再开始操作棋盘。
4. 完成事项后等同步工具上传完毕，再换设备。

本插件使用 Obsidian 的 `Vault.process` 在写入时读取最新本地文件，只修改此次操作涉及的内容；编辑同一个格子时检测到本地文件已有新内容，会保留新内容并要求重新编辑。**这不等于跨设备实时协作或离线冲突合并。** 两台离线设备同时改同一棋盘，最终如何合并仍取决于同步工具。请保留独立备份，不要让多个同步引擎同时管理同一份库。

## 界面与兼容性

- 中文界面，三种配色，跟随 Obsidian 明暗主题。
- 手机窄屏布局；键盘可聚焦按钮，支持屏幕阅读器状态描述，尊重系统减少动画设置。
- 未调用 Node.js / Electron 专属运行接口；`isDesktopOnly` 为 `false`。
- 公开发行版要求 Obsidian 1.14.4 或更高版本。实际 Obsidian 与手机真机测试状态见「验证说明」。
- 小屏上建议优先用 3×3 或 4×4；6×6 可用，但长名称阅读空间更小。
- 长事项名称在棋盘上会截断，编辑窗口可查看全文。

## 开发与验证

源代码已随包提供。只需 Node.js 18 或以上版本，无需安装构建依赖：

```sh
npm run build
npm test
node tests/build-preview.cjs
```

`main.js` 是 `src/` 的构建产物；构建工具只打包内部模块，运行时仅依赖 Obsidian 自带 API。

界面验证脚本 `tests/ui.cjs` 需要单独准备 Playwright 和 Microsoft Edge，或按环境调整启动浏览器。交互预览使用与插件相同的界面代码和文件更新逻辑，但把数据保存在浏览器本地存储中，**不连接真实 Obsidian 笔记库**。

## 验证说明

已完成：

- 13 项核心测试：所有尺寸的横竖与对角连线、撤销、空格判定、数据往返、损坏数据处理、尺寸变化、批量添加、复制、打乱、写入冲突及队列恢复。
- 浏览器交互验证：新建、添加、勾选、Bingo、撤销、刷新后保存、编辑冲突、复制下一轮、归档与恢复。
- 1.1.0 输入交互验证：回车添加、多行粘贴、Shift + Enter 换行、中文组合输入事件保护、草稿与光标刷新保留、满格整批拒绝、写入失败后重试、重复回车防重、格内 Enter / Tab 连续编辑、Esc 恢复、失焦保存、同格冲突保护与完成编辑保存。
- 1.2.0 新增 7 项图标测试，并完成界面验证：按内容匹配、同类分配、36 格通用图标去重、自动名称跟随、保留手选和旧版图标、重新打开保持一致，以及手机尺寸下的自动搭配开关。
- 320、390、768、1200 像素宽度的横向溢出检查，以及桌面、手机宽度、手机编辑窗口与深色模式的截图人工检查。
- 真实 Obsidian 1.14.4：使用独立的临时配置和空白测试笔记库，验证插件加载、25 格显示、5 格连线、点击完成后写入 Markdown、原生编辑窗口保存，以及插件卸载重载后保留内容。

待验证：iPhone / Android 真机。多端同步需要接入实际采用的同步工具后验证。

快速输入和格内编辑的草稿会在当前视图刷新时保留；关闭视图或重启应用前请完成添加或保存。同格冲突时保留输入草稿，按 Esc 可放弃草稿并恢复最新内容，再重新编辑。

参考了 [BingoDays 的格子任务玩法](https://apps.apple.com/tw/app/bingodays-adhd%E5%BE%85%E8%BE%A6/id6760203837)。本插件为独立实现，未使用其代码、图片、角色素材或品牌标识。

许可证：MIT。

## Support

Report reproducible problems through [GitHub Issues](https://github.com/dtta520-cpu/bingo-garden/issues). Include the plugin version, Obsidian version, platform, and steps to reproduce. Use a small example board instead of sharing private notes.
