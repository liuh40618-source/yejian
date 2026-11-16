# 页见 · YeJian

面向中国招聘市场的简历工具。基于 Reactive Resume `v6.0.10` 的二次创新（fork）。

> **公开发布准备中**：本地 git 历史完整，基线提交可追溯到上游 `v6.0.10`，但尚未配置 remote。
> 上传前请走一遍 [`LAUNCH-CHECKLIST.md`](LAUNCH-CHECKLIST.md)：配置、法务、运维逐条列明。
> 游客登录已有启动守卫——生产环境配公网地址仍开着，服务会直接拒绝启动。

页见不是「把英文简历工具翻成中文」。它把中国招聘市场的**双轨现实**当作产品前提：平台上的结构化在线简历由算法抓取、HR 无条件先看；附件 PDF 通常是建立沟通之后才看的补充材料。因此核心模型是

**一份结构化主档 → 三种输出**（附件 PDF / 平台表单字段映射 / JD 关键词对齐报告），PDF 只是输出之一。

---

## 状态

| 项       | 值                                                                           |
| -------- | ---------------------------------------------------------------------------- |
| 版本     | `0.1.0`                                                                      |
| 上游基线 | Reactive Resume `v6.0.10`（MIT，Copyright (c) 2026 Amruth Pillai）           |
| 可见性   | 本地仓库，无 remote（上传前检查见「公开发布前检查」）                        |
| 界面语言 | 仅 `zh-CN`（另保留 Lingui 伪语言 `zu-ZA` 供测试）                            |
| 定位     | 二次创新作品 / 可用内部工具：工程闭环已成型，主档 → 平台表单的人工交接已打通 |

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
| 表单交接   | JD 纳入主档持久化；平台映射导出 JSON / 文本、复制粘贴、Web 下载 + Mobile 分享；`fillPlanFields` 对齐上游 `FormFillPlan` 形状                                                     |
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

要求 Node 24.x、pnpm 12.16.1、PostgreSQL。**第一次上手请直接看 [`QUICKSTART.md`](QUICKSTART.md)**：两条路径（零数据库预览 / 完整启动）、Windows 替代命令、走查清单都在里面。

```sh
pnpm install
cp .env.example .env.local
# 在 .env.local 中配置 DATABASE_URL、AUTH_SECRET、ENCRYPTION_SECRET
# 模板已默认开启游客登录；公网部署前务必改回 false（见 QUICKSTART.md）
pnpm db:migrate
pnpm dev
```

无数据库也能看界面的本地预览入口：`apps/web/preview.html`（`/preview.html?page=editor`）。该入口只挂载外壳与占位字段，**不含中国市场面板的完整交互**，完整走查需按 `QUICKSTART.md` 启动全栈。

**Windows 本机限制**：`pnpm typecheck` 走 `tsrs --noEmit`，但没有 `@tsrs/win32-x64` 二进制；
`turbo` 在本机 spawn 子进程会报 `os error 231`。需逐包执行
`node node_modules/typescript/bin/tsc --noEmit -p tsconfig.json`，完整替代命令见 `REGRESSION-UPSTREAM-GAP.md` §5。

## 平台表单交接（本版补齐）

「一份结构化主档 → 平台在线表单」这一跳现在有真实交付件，不再只是 Design 面板里的只读预览：

- `mapChinaMarketPlatform()` 的结果经 `chinaMarketFormPacket()` 产出 `yejian-china-market-form-packet`，
  Web 可下载 JSON / 纯文本或一键复制，Mobile 经系统分享面板导出同两份文件并支持复制。
  文本按「可直接粘贴 / 需补齐 / 需人工填写 / 平台不采集」分段；JSON 内另带
  `fillPlanFields`（形状对齐上游 `FormFillPlan["fields"]`），供后续已验证的辅助工具读取。
- JD 写入 `metadata.chinaMarket.jobDescription`（可选字段，旧简历无需迁移），刷新后仍读回，
  并随字段包一起导出；Web / Mobile 走同一套领域纯函数，行为一致。
- 映射列表按**平台自己的表单字段名**（`row.field`）展示，不再是重复的平台名。

**边界**：页见只生成并交接字段，不自动填写、不代提交。`chinaMarketFillPlan()` 只是纯函数桥接，
要求调用方提供精确目标 URL；仓库内既没有中国平台适配器，也没有浏览器 helper 的 verified build。

## 已知限制

- **页见的中国市场层与上游投递主链路仍未接通**：`applications.packet` → `FormFillPlan` → 浏览器 helper
  是继承上游 v6.0.10 的独立链路；`chinaMarket` 在 `applications` / `career` / `db` / `api` 目录仍 0 引用。
  本版补齐的是页见自己的「主档 → 交付件」出口，不是两条链路的合并。
- **JD 仍是两套数据源**：`metadata.chinaMarket.jobDescription`（页见主档，per-resume）与上游
  `applications.job_description`（落库、带 `requirements` / `matchScore`，per-application）互不复用。
  `chinaMarket` 挂在单份简历下，applications 是 per-application，缺关联键，一份主档无法对应多份投递。
- `packetFillPlan()` 的 host 白名单只认 Greenhouse / Lever / Ashby 三个海外 ATS，中国平台 URL 返回 `null`；
  `FORM_FILL_SCRIPT` 只是字符串常量，自动填充的最后一公里需外部 verified build（上游也注明不代提交、
  不标记已发送）。

四个断点的原始定位、本版补齐范围与剩余项见 [`UPSTREAM-DIFF.md`](UPSTREAM-DIFF.md) §11。

- 隐私政策、用户协议、ICP 备案尚未提供；Mobile 设置与登录页的法务链接仍指向上游文档站。
- 无手机号 / 短信登录；AI 功能全部 BYO-key，PDF / DOCX 导入在无 key 时会断。
- 浏览器端 e2e（Playwright）不在本 fork 的 CI 里跑，本地执行见 `playwright.config.ts`。

## 文档

| 文件                                                                       | 内容                                                                     |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| [`UPSTREAM-DIFF.md`](UPSTREAM-DIFF.md)                                     | 上游 v6.0.10 真实文件级差异、基线方法、交付边界、基线提交脚本            |
| [`REGRESSION-UPSTREAM-GAP.md`](REGRESSION-UPSTREAM-GAP.md)                 | 全量回归证据、分叉清单、环境债、复现命令                                 |
| [`LAUNCH-CHECKLIST.md`](LAUNCH-CHECKLIST.md)                               | 上线前检查：配置、法务（隐私政策必备条款）、运维、上线顺序               |
| [`REPORT.md`](REPORT.md)                                                   | 2026-11 三轮迭代报告：改了什么、证据、边界、遗留项                       |
| [`REAL-USER-WALKTHROUGH.md`](REAL-USER-WALKTHROUGH.md)                     | 真实用户走查记录：逐步耗时、发现的缺陷、修法与验证、未改项与原因         |
| [`MULTI-USER-WALKTHROUGH.md`](MULTI-USER-WALKTHROUGH.md)                   | 六个角色分头走查：场景化命名、匿名可用性、账号隔离、求职信语言默认值修复 |
| [`FEATURE-VERIFICATION.md`](FEATURE-VERIFICATION.md)                       | 逐功能验证矩阵：每个模块实际点下去的结果、修掉的字数缺陷、六件「不是缺陷」 |
| [`NOTICE.md`](NOTICE.md)                                                   | 归属与版权声明                                                           |
| [`LICENSE`](LICENSE)                                                       | 上游 MIT 许可原文（保留，不得修改）                                      |
| `docs/spec.json`                                                           | OpenAPI 生成物；改 `package.json` 的 version 后需 `pnpm docs:gen` 重出   |
| [`apps/web/public/fonts/cn/README.md`](apps/web/public/fonts/cn/README.md) | 505 个中文字体的来源、分片方式与 SIL OFL 许可证位置                      |

## 归属与许可

页见是 Reactive Resume 的衍生作品。**`LICENSE` 原样保留上游 MIT 许可与 `Copyright (c) 2026 Amruth Pillai`**，
本版新增与修改部分的版权归 `liuh40618-source`。详见 [`NOTICE.md`](NOTICE.md)。

上游项目及其作者与本 fork 无关联，未为其背书或提供支持。文中指向上游仓库的链接仅用于溯源。

中文字体以 SIL OFL 1.1 分发，许可证原文随 woff2 一并提供在
`apps/web/public/fonts/cn/`，与本文档的 MIT 许可互不影响。

## 公开发布前检查

仓库已具备上传条件，但下面几项需要你自己决定或补齐：

| 项           | 状态     | 说明                                                                                                       |
| ------------ | -------- | ---------------------------------------------------------------------------------------------------------- |
| 字体许可证   | 已补齐   | 505 个 woff2 附带两份 OFL 原文，见 `apps/web/public/fonts/cn/`                                             |
| 游客登录     | 已加守卫 | 生产环境 + 非回环 `APP_URL` + 开启 → 启动失败；要公网匿名试用须显式设 `FLAG_ALLOW_PUBLIC_GUEST_LOGIN=true` |
| 法务页面     | 未提供   | 隐私政策、用户协议、ICP 备案，逐条要求见 `LAUNCH-CHECKLIST.md` §3；Mobile 法务链接仍指向上游               |
| CI           | 已收窄   | 只跑 lint / format / typecheck / 单测；上游的浏览器、Cloudflare、Vercel、部署冒烟已移除                    |
| Docker 发布  | 改为手动 | 原 workflow 会在 push 时推上游镜像；现仅 `workflow_dispatch`，配好自己的 registry 再用                     |
| remote       | 未配置   | `git remote -v` 为空，需要你创建仓库后 `git remote add origin ...`                                         |
| 上游运营配置 | 已移除   | `autofix`、`issue-maintenance` 两个 workflow 与 `FUNDING.yml` 属上游仓库运营，fork 无意义                  |
