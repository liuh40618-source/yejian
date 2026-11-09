# 页见 · YeJian

面向中国招聘市场的简历工具。基于 Reactive Resume `v6.0.10` 的二次创新（fork）。

> **当前为私有仓库**：本地 git 已建立，未配置 remote、未推送。待项目完善后再决定公开发布。

页见不是「把英文简历工具翻成中文」。它把中国招聘市场的**双轨现实**当作产品前提：平台上的结构化在线简历由算法抓取、HR 无条件先看；附件 PDF 通常是建立沟通之后才看的补充材料。因此核心模型是

**一份结构化主档 → 三种输出**（附件 PDF / 平台表单字段映射 / JD 关键词对齐报告），PDF 只是输出之一。

---

## 状态

| 项       | 值                                                                 |
| -------- | ------------------------------------------------------------------ |
| 版本     | `0.1.0`                                                            |
| 上游基线 | Reactive Resume `v6.0.10`（MIT，Copyright (c) 2026 Amruth Pillai） |
| 可见性   | 私有，无 remote                                                    |
| 界面语言 | 仅 `zh-CN`（另保留 Lingui 伪语言 `zu-ZA` 供测试）                  |
| 定位     | 二次创新作品 / 可用内部工具：工程闭环已成型，产品闭环未闭合        |

## 为什么这样改

中国市场的「主投递件」是招聘平台里字段固定的在线表单，不是一份自由排版的 PDF。把 PDF 做得很漂亮，
解决的是建立沟通之后的那一环。所以本版把力气放在**结构化主档**和三份输出上，并明确否决了几件
看起来很「中式」、实际低价值的事：

- 不把「自我评价」做成一等字段（HR 初筛权重低，多为形容词空话）。
- 不默认展示证明人、兴趣爱好、志愿服务，不默认 LinkedIn（领英职场 2023-08-09 已停服）。
- 不把政治面貌、绩点、CET、学生干部等字段全局塞进 PDF schema——它们属于央国企校招 / 公务员网申表单，
  按**场景字段包**提供，而不是让每个求职者都填。
- 不把国企表格式登记表当通用模板：合并单元格会降低中文 ATS 解析率，仅作为带风险标注的对照预设。

PDF 视觉上提供三种预设：`ats`（默认，极简单栏）、`xhs`（轻装饰）、`table`（表格式登记，仅对照）。
五开关 `style` 是唯一状态源，`preset` 只是一次性写入；手改任一开关即转为 `custom`。

## 改了什么

以下只列**本版相对上游 v6.0.10 真实存在差异**的部分。完整文件级清单见 [`UPSTREAM-DIFF.md`](UPSTREAM-DIFF.md)。

| 层         | 改动                                                                                                                                                                             |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PDF 模板   | 上游 18 套 → 删 9 套、改名 9 套、新增 10 套 = **19 套语义化 ID**，全部单栏 ATS-safe；画廊中文名 + 校招/技术岗筛选                                                                |
| 中文字体   | 新增 505 个 `Noto Sans SC` / `Noto Serif SC` 子集 woff2（13.13 MB）及 2 个 CSS                                                                                                   |
| ATS 中文   | 改造上游 `packages/resume/src/ats-pdf/**` 13 个文件并新增 2 组中文测试：`Intl.Segmenter("zh")` 分词、中文复合词/停用词/章节别名、中文姓名地名、中文日期与「至今」等 ongoing 标记 |
| 中国市场层 | 新增 `metadata.chinaMarket`（可选字段，旧简历无需迁移）、领域纯函数、Web + Mobile 双端面板、中文样例、中文日期解析                                                               |
| 中文界面   | `zh-CN.po` web 4215 条 / mobile 3437 条；语言目录由 55 收窄到 2                                                                                                                  |
| 品牌       | 「页见」logo / favicon / PWA 图标、manifest 中文化                                                                                                                               |
| 国产模型   | 新增 `dashscope`（通义千问）供应商条目（`deepseek` **上游本就已有**，非本版新增）                                                                                                |
| 数据迁移   | `migrations/20261103090000_localize_template_ids/` 把旧宝可梦模板 ID 迁到新语义 ID                                                                                               |
| 工程       | 测试态字体缓存（`vitest.fonts.setup.ts`）、`docs/spec.json` 重新生成、译文工具脚本                                                                                               |

**主动裁剪**（设计为不可直接合并上游）：语言 55→2、模板 ID 全量重命名、双栏模板移除、上游装饰图与品牌资源替换。

上游 `v6.0.10` 本身就有的功能（游客登录开关、DeepSeek 供应商、passkey、REST/MCP API 等）**不计入本版改动**；
早期报告里曾有两条误记，已在 `UPSTREAM-DIFF.md` §5 用哈希级比对纠正。

回归与测试证据见 [`REGRESSION-UPSTREAM-GAP.md`](REGRESSION-UPSTREAM-GAP.md)。

## 快速开始

要求 Node 24.x、pnpm 12.16.1、PostgreSQL。

```sh
pnpm install
cp .env.example .env.local
# 在 .env.local 中配置 DATABASE_URL、AUTH_SECRET、ENCRYPTION_SECRET
# 建议同时设置 FLAG_ENABLE_GUEST_LOGIN=true，否则首次打开会撞注册墙
pnpm db:migrate
pnpm dev
```

无数据库也能看界面的本地预览入口：`apps/web/preview.html`（`/preview.html?page=editor`）。

**Windows 本机限制**：`pnpm typecheck` 走 `tsrs --noEmit`，但没有 `@tsrs/win32-x64` 二进制；
`turbo` 在本机 spawn 子进程会报 `os error 231`。需逐包执行
`node node_modules/typescript/bin/tsc --noEmit -p tsconfig.json`，完整替代命令见 `REGRESSION-UPSTREAM-GAP.md` §5。

## 已知限制

- **平台表单映射目前是只读预览**：`mapChinaMarketPlatform()` 算出的 `mapped.rows` 只渲染成列表，
  没有导出 JSON / 复制 / 填充动作。上游其实已有「雇主表单投递包」链路（`applications.packet` →
  `FormFillPlan` → 浏览器 helper），但页见的中国市场层**与它零连接**，且 `packetFillPlan()` 只认
  Greenhouse / Lever / Ashby 三个海外 ATS，中国平台会返回 `null`。断点不是「缺一条链路」，是两条平行链路没接上。
- **JD 有两套数据源且互不复用**：中国市场面板的 JD 在 Web / Mobile 都是 `useState("")`、刷新即丢；
  上游 `applications.job_description` 已落库并带 `requirements` / `matchScore`，两者没有引用关系。
- `metadata.chinaMarket` 挂在单份简历下（per-resume），而 applications 是 per-application，缺关联键，
  一份主档无法对应多份投递；`chinaMarket` 在 `applications` / `career` / `db` / `api` 目录 0 引用。
- 即便接上，仓库内也没有可执行填充端：`FORM_FILL_SCRIPT` 只是字符串常量，浏览器 helper 需单独
  verified build（`application-packet.tsx` 已注明），且上游设计为不代提交、不标记已发送。

四个断点的文件级定位与最小补齐路径见 [`UPSTREAM-DIFF.md`](UPSTREAM-DIFF.md) §11。

- 隐私政策、用户协议、ICP 备案尚未提供；Mobile 设置与登录页的法务链接仍指向上游文档站。
- 无手机号 / 短信登录；AI 功能全部 BYO-key，PDF / DOCX 导入在无 key 时会断。
- 505 个中文字体尚未附带 SIL OFL 许可证文本（私有阶段不触发再分发义务，**公开前必须补**）。

## 文档

| 文件                                                       | 内容                                                                   |
| ---------------------------------------------------------- | ---------------------------------------------------------------------- |
| [`UPSTREAM-DIFF.md`](UPSTREAM-DIFF.md)                     | 上游 v6.0.10 真实文件级差异、基线方法、交付边界、基线提交脚本          |
| [`REGRESSION-UPSTREAM-GAP.md`](REGRESSION-UPSTREAM-GAP.md) | 全量回归证据、分叉清单、环境债、复现命令                               |
| [`NOTICE.md`](NOTICE.md)                                   | 归属与版权声明                                                         |
| [`LICENSE`](LICENSE)                                       | 上游 MIT 许可原文（保留，不得修改）                                    |
| `docs/spec.json`                                           | OpenAPI 生成物；改 `package.json` 的 version 后需 `pnpm docs:gen` 重出 |

## 归属与许可

页见是 Reactive Resume 的衍生作品。**`LICENSE` 原样保留上游 MIT 许可与 `Copyright (c) 2026 Amruth Pillai`**，
本版新增与修改部分的版权归 `liuh40618-source`。详见 [`NOTICE.md`](NOTICE.md)。

上游项目及其作者与本 fork 无关联，未为其背书或提供支持。文中指向上游仓库的链接仅用于溯源。
本项目当前私有，不对外分发。
