# Changelog

## 1.3.3

- Keep the new-board button and board tabs visible while scrolling, including on narrow screens.
- Add a direct new-board action when the current board is full.
- Scroll to the new board's top and show a confirmation after creation.
- Add regression coverage for creating multiple boards, preserving existing boards, scrolling, and persistence after reopening.

## 1.3.2

- Rename the display name to **Bingo Garden-Tasks list** in the plugin manifest, view tab, ribbon tooltip, board header, and documentation. Keep the plugin ID and board folder stable so existing installations and boards continue to work.
- Replace forced CSS overrides with scoped selectors, preserving reduced-motion behavior and the board layout.
- Provide a complete English README and retain the Chinese guide in `README.zh-CN.md`.

## 1.3.1

- 增加 Mac 安装说明和 macOS 27.2 / Apple Silicon / Obsidian 1.14.5 的真实操作验证记录。
- 棋盘创建、批量添加、完成连线和重载保存已实测；20 项自动测试与发布文件检查通过。
- 运行逻辑与 1.3.0 相同，现有棋盘无需迁移。

## 1.3.0

- Animate newly completed rows, columns, and diagonals with a drawn light trail, staggered cell pulses, a Bingo badge, and a brief confetti burst.
- Continue the same animation across vault refreshes; clear it on undo, board changes, editing, or view close. Reopening a completed board does not replay the effect.
- Respect reduced-motion preferences and keep cells clickable during celebrations.

## 1.2.1

- Prepare the first public GitHub release and community directory submission.
- Publish readable JavaScript source, build checks, installation instructions, and screenshots using example tasks.
- Set the minimum supported Obsidian version to the earliest version used in desktop integration testing, 1.14.4.
- Remove the repeated plugin name from the open-board command.

## 1.2.0

- Match new task names to icons, vary repeated categories, and preserve manually selected icons.
- Keep stored icons stable across completion, reopening, and synchronization.

## 1.1.0

- Add quick entry, multiline paste, and inline title editing with keyboard navigation.
- Preserve drafts on file refresh, write errors, and same-cell editing conflicts.

## 1.0.0

- Add multiple 3 by 3 to 6 by 6 boards, line detection, completion feedback, rewards, archiving, and new-round copies.
- Save boards as Markdown files in the vault.
