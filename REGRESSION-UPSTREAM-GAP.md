# 页见（Reactive Resume 中文定制版）全量回归与上游差距报告

生成时间：2026-11-06 · 最后校订：2026-11-08 · 基线：上游 Reactive Resume v6.0.10（已由原版 ZIP 实证） · 环境：Windows / Node 24.11 / pnpm 12.16.1 / 本机 PostgreSQL 18.6（5433）

> 11-08 已用用户提供的原版 ZIP 建立 v6.0.10 干净快照并 `git init`，形成两段真实提交；项目定名**页见**，
> 当前私有、无 remote。完整文件级结论见 `UPSTREAM-DIFF.md`。本报告 §3 的「差距」由代码位置与回归日志核实，
> 其中两处已被真实 diff 推翻（见 §3.1）。
> 本机 turbo 无法 spawn 子进程（`os error 231`），所有检查都改为逐包调用二进制执行。

> **状态分层（2026-11-08 校订）**
>
> - §0、§2 的回归数字是 **11-06 基线快照**，只作历史证据，不是当前跑批结果。当前可用命令见 §5。
> - §1 的修复记录、§3.2 的主动裁剪、§4 的工程环境债**仍然成立**。
> - 11-07 新增「中国市场简历」产品化层，原报告未覆盖，补在 **§3.4**。
> - 已修正三处被新代码推翻的旧断言：§0 一句话结论、§3.1 中文目录条数、§3.3 的 `en-US` 默认值段落。
> - **11-08 用原版 ZIP 做哈希级 diff**：2717/3226 文件与上游字节相同；§3.1 另两处失真已按实证修正。
>   完整文件级清单、报告未覆盖的修改目录、交付边界与基线提交脚本见 `UPSTREAM-DIFF.md`。
> - 已删除：过程自辩、一次性跑批噪声、文末补记中与 §0/§4 重复的逐包表格与归因明细（结论保留）。

---

## 0. 一页结论（11-06 基线）

| 检查维度                               | 结果                                                                                           |
| -------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Typecheck（21 个包，`tsc --noEmit`）   | **21/21 EXIT=0，0 error**（格式化后复跑；新增改动后 auth / email / api 三包再验仍 EXIT=0）     |
| 单元/集成测试默认态（20 个包）         | **439 passed / 23 skipped 文件，6829 passed / 490 skipped 用例，0 failed**                     |
| 改动后复跑                             | 修复 1 条被误改断言 + 1 条漏改集成夹具后，关键单文件与 email 全绿（见 §2.3）                   |
| Lint / Format / docs:check             | 本轮修复后 **全部 EXIT=0**（含新增 2 个改动文件复验）                                          |
| 测试态字体抖动 / 缓存清理阻断          | **0 失败、0 字体错误、0 safe-delete 拦截**                                                     |
| DB 集成测试（本机 Postgres 打开 gate） | **未通过：108 条失败，全部为共享单机 DB 的环境性超时/死锁 + 1 条夹具未适配（已修）**，详见补记 |

一句话：**定制版在当前可稳定复现的默认态检查里已经全绿**；与上游的差距不再是「单测挂了」，而是
「主动裁剪造成的不可直接合并分叉」+「默认被 gate 关掉、且本机单机 DB 跑不稳的集成测试」。
11-06 记下的「上游遗留的 en-US 默认值」已在 11-07 部分收敛：新建简历由 `applyChinaAtsDefaults()` 写入
`zh-CN`，`default.ts` 的 `en-US` 保留为中性夹具；仍是 `en-US` 的只剩 career / ATS / PDF 兜底路径（§3.3）。

---

## 1. 本轮完成的收尾修复（11-06）

### 1.1 locale 收窄遗留的 104 处类型错误 → 0

上一轮把界面语言从上游 55 个目录收窄为 `zh-CN` + Lingui 伪语言 `zu-ZA`（`packages/utils/src/locale.ts` 的
`localeSchema`）。全仓类型检查因此报出 104 处 `TS2322`（`en-US` 不再是合法 `Locale`）。本轮逐类清理：

| 位置                                                      | 处理方式                                                                                                                                                                                                                                                           |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `packages/api/src/**/*.test.ts`（约 90 处）               | ORPC `context.locale` 测试夹具统一改用 `zu-ZA`。它只用来验证 i18n 管道，不在 `supportedLocales` 里，不会污染真实语言选择。                                                                                                                                         |
| `packages/email/src/templates/*.tsx` + `auth-messages.ts` | 邮件函数的 `locale` 参数从 `Locale` 放宽为 `string`。**账号语言是存量数据，不是界面目录**：升级前注册的账号仍带 `en-US` / `de-DE`，邮件必须继续按账号语言出英文/中文，不能因为界面只发中文就把类型收死。`auth.test.tsx` 的英文用例与 `lang="en-US"` 断言因此保留。 |
| `packages/api/src/features/resume/initial-data.ts`        | `CreateResumeDataOptions.locale?: Locale` → `string`，同样为兼容存量账号，`LETTER_LOCALES` 的 Letter 纸型判定保持不变。                                                                                                                                            |
| `apps/mobile/src/features/share/letter.ts`                | 55 项 `loaders` 表 → 实际存在的 2 个 `.po`（`zh-CN` / `zu-ZA`）；旧表指向已删除文件会让 Metro 打包分享面板失败。                                                                                                                                                   |
| `apps/mobile/scripts/parity/device.ts`                    | 模板收敛后 `"azurill"` 已不在 `templateSchema`，改为 `templateSchema.parse(templateSchema.options[0])`；原本挂在 azurill 上的一次性 rasterizer 非法页守卫也跟着改挂首个枚举模板，不再把 ID 写死。                                                                  |

### 1.2 修复一条被「批量替换」误伤的断言

`packages/api/src/features/career/discovery-router.test.ts` 中
`expect(service.suggest).toHaveBeenCalledWith("owner", { ...input, locale: ... }, undefined)`
的 `locale` 来自 **`roleSuggestionsInputSchema` 的输入默认值 `en-US`**（`packages/schema/src/career.ts`），
不是 ORPC context 的界面语言。批量替换把它改成 `zu-ZA` 后，改动后复跑出现 1 条真实失败：
期望 `zu-ZA`、收到 `en-US`。已还原为 `en-US` 并加注释说明两者来源不同。这也是本轮坚持「改完全量重跑」的原因。

### 1.3 工程链路修复

- `tooling/docs/check.mjs`：仍硬编码读取已删除的 `apps/web/locales/en-US.po`，`pnpm docs:check` 直接 `ENOENT` 崩溃。
  改为读 `zh-CN.po`（脚本只取 msgid，即英文源串，任何真实目录等价），`sourceLocale` 保持 `en-US`。
  现在 EXIT=0，输出 252 条「供人工复核」的文档图片/措辞提示（非阻断）。
- `docs/spec.json`：6 MB 的 OpenAPI 快照还是 11-03 的上游版本，里面 47 处 `azurill`、43 处 `bronzor` 等旧模板 ID，
  且缺 `dashscope`。执行 `pnpm docs:gen` 重新生成：旧 ID 归零、新 ID 到位（47 处 `general-single`、43 处 `asia-standard`）、
  通义千问 8 处出现。**运行时 `/openapi.json` 本来就是代码动态生成，此处只修提交快照。**
- `apps/web/src/features/homepage/faq.tsx`：一个空的 `<div></div>` 触发 `react/self-closing-comp`，`pnpm lint` 报 1 error。
  改为自闭合标签后 `0 warnings / 0 errors`。
- `pnpm format:check` 原本报 127 个文件格式漂移（分布：pdf 39、web 33、api 10、server 9、resume 8、mcp 4、mobile 4、
  其余零散），全部来自前几轮手工编辑。执行仓库自带的 `pnpm format` 统一后，`format:check` 与 `lint` 均 EXIT=0。

### 1.4 修复存量账号邮件语言被强制中文化（DB 集成跑批发现的真实回归）

打开集成 gate 后，`account-email-locale.integration.test.ts` 报
`AssertionError: expected null to be 'ar-SA'`。追下去发现两件事：

1. **夹具漏改**：上游用 `ar-SA` 当「非默认账号语言」的样本，但 `requestLocale()`（`packages/auth/src/config.ts`）
   用 `isLocale()` 校验 cookie，而 `isLocale` 只认 `zh-CN` / `zu-ZA`，`ar-SA` 不再写入 `user.locale`。
   `config.test.ts` 与 `timezone-signup.test.ts` 早已改用 `zu-ZA` 并明确注释「Upstream used ar-SA here」，
   这个集成文件是收窄时**唯一漏改的夹具**。
2. **产品逻辑 bug**：`accountEmailLocale()` 原先用 `isLocale(saved) ? saved : (requestLocale ?? defaultLocale)`
   判定存量账号语言。升级前注册的账号带 `en-US` / `de-DE`，`isLocale` 会把它们判为「无语言」，
   再 fallback 到 `defaultLocale = "zh-CN"` —— **存量英文账号会突然收到中文验证邮件**。
   这与 `packages/email/src/templates/auth-messages.ts` 特意把 `locale` 放宽成 `string`、
   注释写明「accounts created before this build ... still carry tags like en-US」直接矛盾。

修复：

- `accountEmailLocale()` 改为 `typeof saved === "string" && saved ? saved : (requestLocale(...) ?? defaultLocale)`，
  保留任意存量 BCP-47 tag 交给 `authEmailMessages()`（无目录时逐条回退英文）；新账号与无语言账号行为不变。
- 集成夹具改用 `zh-CN` + 中文脚本断言，并以 `zu-ZA` 作「另一种请求语言」验证账号语言优先；
  末尾新增一段：把 legacy 账号手动置为 `en-US`，断言仍收到英文 `Reset your password`，直接锁住上述修复。

**复验证据**：带 `OAUTH_TEST_DATABASE_URL` 单文件复跑 `1 passed / EXIT=0`（8.3s）；
`packages/email` 全量 `7 passed / EXIT=0`；auth / email / api 三包 `tsc --noEmit` 均 `EXIT=0`；
两个改动文件 `vp fmt --check` 与 `vp lint --deny-warnings` 均 `EXIT=0`。

---

## 2. 全量回归证据（11-06 基线）

### 2.1 Typecheck（格式化后复跑）

21 个包全部 `EXIT=0`：`ai api auth db docx dsh-plugin email env fonts forme-native import mcp odt pdf resume schema ui utils mobile server web`。
日志：`/tmp/tsc-final.log`。注意本机 `pnpm typecheck` 走不通（见 §4.1），实际用 `tsc --noEmit -p tsconfig.json` 逐包执行。

### 2.2 默认态全量测试（`/tmp/monorepo-final.log`）

| 包         | 测试文件                   | 用例                   | 包      | 测试文件                   | 用例                |
| ---------- | -------------------------- | ---------------------- | ------- | -------------------------- | ------------------- |
| ai         | 4 passed                   | 28                     | pdf     | 69 passed                  | 486                 |
| **api**    | **89 passed / 19 skipped** | **4007 / 467 skipped** | resume  | 31 passed                  | 363                 |
| auth       | 10 passed                  | 71                     | schema  | 25 passed                  | 237                 |
| db         | 1 passed / 2 skipped       | 1 / 4 skipped          | ui      | 10 passed                  | 20                  |
| docx       | 7 passed                   | 25                     | utils   | 12 passed                  | 228                 |
| dsh-plugin | 无测试                     | —                      | server  | 29 passed / 1 skipped      | 255 / 10 skipped    |
| email      | 2 passed                   | 7                      | **web** | **129 passed / 1 skipped** | **825 / 9 skipped** |
| env        | 2 passed                   | 52                     | import  | 12 passed                  | 156                 |
| fonts      | 1 passed                   | 20                     | mcp     | 5 passed                   | 25                  |
| odt        | 1 passed                   | 23                     |         |                            |                     |

合计 **439 passed / 23 skipped 文件，6829 passed / 490 skipped 用例（共 7319）**，所有包 `EXIT=0`。
字体加载失败、safe-delete 拦截、`pdftotext EBUSY` 均为 0；此前记录的 pdf 包 39 条「上游既有失败」在本轮已消失。
**11-07 之后这些数字已变化**，见 §3.4。

### 2.3 改动后复跑（`/tmp/rerun-postedit.log`）

因为 locale 修复发生在全量回归的 api/email 段之后，对 `packages/api`、`packages/email`、
`apps/server` 又跑了一遍。首轮唯一失败是 §1.2 那条断言。修复后新增证据：`discovery-router.test.ts`
单文件 `1 passed / EXIT=0`，`packages/email` 全量 `7 passed / EXIT=0`，三包 `tsc --noEmit` 均 `EXIT=0`。
随后又对 `packages/api` 做了一次默认态全量复跑（`/tmp/api-postfix.log`，398.44s）：
`4007 passed / 467 skipped`、**0 failed**，与 §2.2 基线一致，确认 §1.2 / §1.4 未破坏 api 包。

### 2.4 DB 集成测试（11-06 额外打开 gate）

默认态有 23 个测试文件被跳过，全部是 `describe.skipIf(!process.env.*_TEST_DATABASE_URL)` 或需要实时服务的用例：

- `INTEGRATIONS_TEST_DATABASE_URL` / `COVER_LETTER_TEST_DATABASE_URL` → api 的 13 个集成文件、db 的 2 个文件；
- `OAUTH_TEST_DATABASE_URL` → api 的 5 个账号/OAuth 文件 + server 的 `oauth-flow.integration.test.ts`；
- `RX106_BINDING_APP_URL` → web 的 `account-binding.integration.test.ts`（需要一台 disposable 服务器，本轮未启动）。

11-06 曾启动本机 Postgres 并把三个 DB 变量都指向同一个 `postgres` 库跑批，结果全是环境性失败，结论见文末补记。

### 2.5 Lint / Format / 文档（11-06）

| 命令                | 修复前                              | 修复后                                       |
| ------------------- | ----------------------------------- | -------------------------------------------- |
| `pnpm lint`         | 1 error（faq.tsx 自闭合）           | **0 warnings / 0 errors**                    |
| `pnpm format:check` | 127 文件格式漂移                    | **All matched files use the correct format** |
| `pnpm docs:check`   | `ENOENT: apps/web/locales/en-US.po` | **EXIT=0**（252 条人工复核提示）             |
| `pnpm docs:gen`     | 未执行（快照过期）                  | **已重新生成 `docs/spec.json`**              |

---

## 3. 与上游的分叉清单

### 3.1 已补齐（上游没有 / 上游不满足中国市场）

| 项                                   | 落点                                                                                                                                                                                                                |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 游客登录（**11-08 实证纠正**）       | **不是本版补齐**：上游 v6.0.10 的 `packages/env/src/server.ts:211`、`.env.example:198` 已有 `FLAG_ENABLE_GUEST_LOGIN`，该文件与上游 MD5 相同。本版只是用 `.env.local` 把默认值 `false` 打开；部署漏配仍退回注册墙。 |
| 国产 AI 供应商（**11-08 实证纠正**） | 上游 `apps/web/src/features/settings/ai/catalog.ts:74` **已有 `deepseek`**；本版真实新增只有 `dashscope`（通义千问）一个条目（+7 行）及默认 baseURL / 模型；`docs/spec.json` 已同步。                               |
| ATS 中文适配                         | `packages/resume/src/ats-pdf/**`：`Intl.Segmenter("zh")` 分词、中文复合词/停用词/章节别名、中文动词与第一人称、中文 bullet 长度阈值、中文姓名与地名识别；新增 25 例中文测试。                                       |
| 中式模板                             | `packages/schema/src/templates.ts` 现为 19 个语义 ID（9 套上游单栏改名 + 10 套新增中式），全部单栏 ATS-safe；画廊中文名 + 校招/技术岗筛选。                                                                         |
| 品牌与中文 PWA                       | 「页见」全套 logo/favicon/PWA 图标，`manifest.webmanifest` 的 name / lang / theme / shortcuts 中文化。                                                                                                              |
| 中文目录                             | `apps/web/locales/zh-CN.po`（4215 条，4214 已译，唯一空 `msgstr` 是文件头）、`apps/mobile/locales/zh-CN.po`（3437 条）。                                                                                            |
| 中国市场产品层                       | 11-07 新增，见 §3.4：`metadata.chinaMarket` schema、领域纯函数、Web + Mobile 双端面板、中文样例、中文日期解析。                                                                                                     |

> **11-08 校验说明**：上表前两行已按原版 ZIP 的哈希级 diff 修正；其余各项均在真实 diff 中成立。
> 但本节不是完整文件清单——`packages/mcp` / `email` / `ui` / `apps/server` / `utils` / `ai` 等仍有
> 未记录的修改，写对外说明时应以 `UPSTREAM-DIFF.md` §4 / §5 为准。

### 3.2 主动裁剪（与上游不可直接合并，是设计决定而非 bug）

1. **语言 55 → 2**：`localeSchema = z.enum(["zh-CN","zu-ZA"])`，`supportedLocales` 只剩 `zh-CN`，
   `getPreferredLocale()` 恒返回 `zh-CN`，hreflang 只剩 `zh-CN` + `x-default`。web/mobile 各只剩 2 个 `.po`。
   上游的多语言 SEO、Crowdin 同步、`locale=` 深链全部失效；`tooling/docs/check.mjs` 已随之改读 `zh-CN.po`。
2. **模板 ID 全量重命名 + 9 套删除**：旧宝可梦 ID 写进过数据库 `resume.data.metadata.template`。
   已提供 `migrations/20261103090000_localize_template_ids/migration.sql`：9 组改名、9 个删除模板统一落到
   `general-single`，不在名单里的值不动。**未执行迁移的旧库 / 旧客户端分享链接 / 直接调 API 传旧 ID 会被 zod 拒绝**。
3. **双栏模板移除**：侧栏相关测试删除、`packages/docx/src/builder.ts` 的 `SIDEBAR_BACKGROUND` 清空、
   画廊去掉 one/two 筛选、ATS 的 `TWO_COLUMN_LAYOUT` 触发用例删除。`TemplateLayout.columns / sidebarSide` 字段保留但恒为 `1 / null`。
4. **品牌资源**：favicon.ico 只给 32/48/64（手迹笔画在 16px 下不足 1 像素，实测所有增强方案都是噪点）；
   若干 `.svg` 实为内嵌 base64 PNG，非矢量。

### 3.3 仍未处理的产品缺口（截至 2026-11-07）

- 手机号 / 短信验证码登录：`packages/auth/src/config.ts` 仍只有邮箱密码 + passkey。
- 隐私政策、用户协议、ICP 备案：首页 footer 仍只有锚点链接。
- AI 仍是 BYO-key；PDF / DOCX 导入强依赖 key，无 key 时核心路径断。
- **非新建路径的 `en-US` 兜底值**（11-07 校订后收窄）：
  - **已收敛**：`createResumeData()` 的 `applyChinaAtsDefaults()`
    （`packages/api/src/features/resume/initial-data.ts:26`）对新建空白简历写入 `zh-CN`、A4、Noto Serif SC、
    单栏、无照片、隐藏图标、内置 `chinaMarket`。11-06 记的「新简历默认 en-US」不再成立。
  - **刻意保留**：`packages/schema/src/resume/default.ts:81` 的 `locale: "en-US"` 是**中性夹具**，被导入、
    AI sanitising、DB 列默认值、PDF 分页几何、ATS 抽取等测试钉住，不是用户可见默认值；中文样例另在
    `china-sample.ts`。**不要把它改成 zh-CN** —— 11-07 试过，污染了 40+ 测试，详见 §3.4 的创建策略修正。
  - **仍是 `en-US`、待产品拍板**：`packages/db/src/schema/career.ts:96` 列默认值、
    `packages/schema/src/career.ts:370` 与 `packages/api/src/features/career/router.ts:337` 的 AI 生成默认值、
    `packages/resume/src/ats/index.ts:84` 与 `ats-pdf/analyze/semantics.ts:248` 的 ATS 兜底、
    `packages/pdf/src/html/messages.ts:47`。这些是 career / ATS / PDF 降级路径，改动会牵动日期与 ATS 断言。
- 邮件模板保留英文分支是**有意的**（兼容存量账号），不算缺口；`accountEmailLocale()` 强制中文化的回归已在 §1.4 修复。

### 3.4 11-07 增量：中国市场简历产品化（原报告未覆盖）

**产品框架**：中国市场是「平台在线结构化简历 + 附件 PDF」双轨，平台预设字段的在线表单由算法抓取、
HR 无条件先看；附件 PDF 是非结构化文本，通常在建立沟通后才看。因此核心是
**一份结构化主档 → 三种输出**（附件 PDF / 平台表单映射 / JD 关键词对齐报告），PDF 只是输出之一。
调研与原型见 `china-resume-prototype.html`、`.workbuddy-ai/verify-prototype.cjs`。

| 层          | 落点                                                                       | 说明                                                                                                            |
| ----------- | -------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| 数据模型    | `packages/schema/src/resume/china-market.ts`                               | `scene`(market/campus/soe)、`preset`(ats/xhs/table/custom)、`platform`、`style` 五开关、`profile` 12 个网申字段 |
|             | `packages/schema/src/resume/data.ts`                                       | 加**可选** `metadata.chinaMarket`，缺失回落 `defaultChinaMarket`，旧简历无需迁移                                |
| 领域纯函数  | `packages/resume/src/china-market.ts` + `package.json` 的 `./china-market` | scene/preset/style/platform/profile/JD/文件名/风险判定，全部 `structuredClone` 后返回新对象                     |
|             | `resolveChinaMarketTemplate()`                                             | 视觉开关映射到**已有**模板，不新增 renderer                                                                     |
| 中文样例    | `packages/schema/src/resume/china-sample.ts`                               | 「尝试样品」走 `chinaSampleResumeData`（陈嘉宁）；`sample.ts` 恢复为上游中性英文夹具                            |
| 创建策略    | `packages/api/src/features/resume/initial-data.ts`                         | `applyChinaAtsDefaults()` 只在新建时应用中文 ATS 安全值；显式传 `template` 时把 preset 标 `custom`              |
| 中文日期    | `packages/schema/src/resume/period.ts`                                     | `parseEndpoint` 支持 `YYYY.MM` / `YYYY/MM` / `YYYY年M月`                                                        |
|             | `packages/resume/src/ats-pdf/analyze/dates.ts`                             | `YEAR_MONTH` + CJK ongoing（至今/迄今/现在/在职…），显示与 PDF 抽取口径一致                                     |
| Web 面板    | `apps/web/src/features/resume/editor/design/china-market-group.tsx`        | 接入 `design-panel.tsx` 的 GROUPS / `DesignSheet` 的 `china` tab；新增 `china-market-group.test.tsx` 渲染测试   |
| Mobile 面板 | `apps/mobile/src/features/design/china-market-group.tsx`                   | 接入 `design-pane.tsx`，与 Web 动作、顺序、纯函数完全一致（feature parity）                                     |
| 文案        | `apps/web/locales/zh-CN.po`、`apps/mobile/locales/zh-CN.po`                | 新增 57 条，msgid 保持英文；`lingui extract --clean` **不能加 `--overwrite`**，会清空既有译文                   |

**关键设计修正**：中文 ATS 默认值不是 `defaultResumeData` / `sampleResumeData` 的属性，而是
`createResumeData()` 的**创建策略**。11-07 曾直接把两个全局夹具改成中文，污染了导入、AI sanitising、
DB 列默认值、PDF 分页几何、ATS 抽取等 40+ 测试；最终拆成「中性夹具 + 中文样例 + 创建时应用」三层。
另：UI 里 `structuredClone` 不能 clone immer draft（Proxy），所以先用 store 已提交的 `data` 算 `next`，
再 `Object.assign(draft, next)` 写回。

**明确的否决项**（`CHINA_MARKET_EXCLUSIONS`）：不做一等字段的「自我评价」（HR 初筛权重低、多为形容词空话）、
不默认展示证明人 / 兴趣爱好 / 志愿服务、不全局加中式字段（政治面貌等只属央国企网申表单）、
不默认 LinkedIn（领英职场 2023-08-09 停服）、不把表格式登记表当通用模板（合并单元格降低中文 ATS
解析率，仅作带风险标注的对照预设）。

**11-07 回归**：schema 241 / resume 376 / pdf 486 / odt 23 / docx 25 / web 827 / api（非集成）4010 passed；
八包 `tsc --noEmit` EXIT=0；`vp lint --deny-warnings` 0 warning（2052 文件）；`vp fmt --check` 全绿（2462 文件）。
`apps/mobile` 6 条 `scripts/*.test.mjs` 失败是 esbuild 在 Windows 上把 `/D:/...` 当绝对路径解析，属环境噪声，非代码回归。
原型格式化后复跑仍 `ERRORS=[]`、`PDF_PAGES=1`、`TABLE_PDF_PAGES=1`、`STYLEBAR_IN_PRINT=none`。

---

## 4. 工程与环境债

1. **`pnpm typecheck` 在本机不可用**：各包脚本是 `tsrs --noEmit`，而 `tsrs` 没有 `@tsrs/win32-x64` 二进制
   （只发布 darwin/linux）。本机必须用 `node node_modules/typescript/bin/tsc --noEmit -p tsconfig.json` 逐包替代。
   `turbo run typecheck` 同样受 §0 的 spawn 问题影响。
2. **字体依赖 `fonts.gstatic.com`**：`packages/pdf/src/forme/fonts.ts` 的 `load()` 已有双 host 竞速，生产未加重试。
   本轮用 **测试态**方案根治抖动：`vitest.shared.mts` 固定 `maxWorkers: 2` + 每包独立 `fsModuleCachePath`
   （避免互相清缓存），`packages/pdf/vitest.fonts.setup.ts` 通过 `configureFontReader` 把下载字节按 URL hash
   落盘缓存（只缓存真字体，先写临时文件再 rename 防并发读半包），在 `packages/pdf`、`packages/api`、
   `apps/server` 三包 `fontCache: true` 开启。**生产渲染路径零改动**，根治公网抖动仍需环境侧镜像/本地字体。
3. **集成测试默认关闭**：490 条用例（467 api + 4 db + 10 server + 9 web）需要外部 DB / 实时服务。
   11-06 已用本机 Postgres 打开 DB 类 gate，但**因单机性能跑不稳**（见补记）；web 的 `RX106_BINDING_APP_URL`
   需要起一套 disposable 服务，未覆盖。
4. **`pnpm check` 会自动改写文件**：其链路是 `lint:fix → format → lint`，CI 的 `autofix.yml` 跑的就是它。
   本轮已先用 `pnpm format` 把 127 个漂移文件统一，避免 CI 产生一个大格式 diff。
5. `docs/spec.json` 是提交产物，不是运行时数据源；模板/供应商/枚举变更后必须 `pnpm docs:gen`，否则文档站会继续展示宝可梦 ID。
6. **DB 集成测试必须「一文件一库 + 串行」**：11-06 把三个 gate 指向同一个 `postgres` 库，108 个 isolate worker
   并发跑 `CREATE SCHEMA` / 全量 migration / `TRUNCATE ... CASCADE`，产生 108 条环境性失败（死锁、连接池耗尽、
   hook 超时）。这不是代码回归，但也说明本机跑法离 CI 可用还很远，见补记。
7. `auth/config-lifecycle.test.ts` 首用例的 5s 阈值贴边：默认态全量回归耗时 **4233ms**，冷缓存 + 高负载会超到
   ~5.8s。已用对照实验（临时还原 `accountEmailLocale` 后仍超时 5760ms）确认与本轮改动无关。
   未放宽该用例超时值，以免为了让日志变绿而改动上游断言；如 CI 常驻该 flake，建议单独给冷 import 用例加显式 timeout。
8. **`.md` 格式化在本机报 `os error 5`**：`vp fmt --write` 对 Markdown 会拒绝访问。绕法：
   `pnpm exec vp fmt --stdin-filepath=X.md < X.md > /tmp/out.md`，再 `cp /tmp/out.md X.md`。
9. **`apps/mobile` 的 `scripts/*.test.mjs`**：esbuild 在 Windows 上把 `/D:/...` 当绝对路径解析，
   6 个文件报 `Could not resolve`。属本机环境噪声，不计入代码回归判据。

---

## 5. 复现命令

```sh
# Typecheck（逐包，绕开 turbo / tsrs 的 Windows 限制）
for p in ai api auth db docx dsh-plugin email env fonts forme-native import mcp odt pdf resume schema ui utils; do
  (cd packages/$p && node /d/Deepseek/reactive-resume-main/node_modules/typescript/bin/tsc --noEmit -p tsconfig.json)
done
for p in mobile server web; do
  (cd apps/$p && node /d/Deepseek/reactive-resume-main/node_modules/typescript/bin/tsc --noEmit -p tsconfig.json)
done

# 测试（逐包；vitest.shared.mts 已限 maxWorkers=2）
for d in packages/* apps/server apps/web; do (cd "$d" && pnpm exec vp test run --passWithNoTests); done

# 打开 DB 集成测试（建议一文件一库 + 串行，见补记）
/d/pgrun/bin/postgres.exe -D D:/Deepseek/.pgdev2/pgdata -p 5433 -c listen_addresses=127.0.0.1
export INTEGRATIONS_TEST_DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5433/postgres
export COVER_LETTER_TEST_DATABASE_URL=$INTEGRATIONS_TEST_DATABASE_URL
export OAUTH_TEST_DATABASE_URL=$INTEGRATIONS_TEST_DATABASE_URL
(cd packages/db && pnpm exec vp test run --passWithNoTests)
(cd packages/api && pnpm exec vp test run --passWithNoTests)
(cd apps/server && pnpm exec vp test run --passWithNoTests)

# 单文件复验（11-06 两处修复点）
(cd packages/api && pnpm exec vp test run src/features/career/discovery-router.test.ts)
(cd packages/api && OAUTH_TEST_DATABASE_URL=$INTEGRATIONS_TEST_DATABASE_URL \
  pnpm exec vp test run src/features/auth/account-email-locale.integration.test.ts)

# 11-07 新增面板与中文样例
(cd apps/web && pnpm exec vp test run src/features/resume/editor/design/china-market-group.test.tsx)
(cd packages/resume && pnpm exec vp test run)

# 静态检查 / 文档
pnpm lint && pnpm format:check && pnpm docs:check
pnpm docs:gen   # 枚举或路由变更后重新生成 docs/spec.json

# 收尾：关闭本机开发库
/d/pgrun/bin/pg_ctl.exe stop -D D:/Deepseek/.pgdev2/pgdata -m immediate
```

---

## 补记：DB 集成测试（11-06 历史记录，不代表当前状态）

11-06 曾启动本机 PostgreSQL 18.6（5433），把 `INTEGRATIONS_TEST_DATABASE_URL`、
`COVER_LETTER_TEST_DATABASE_URL`、`OAUTH_TEST_DATABASE_URL` 三个 gate 全部指向同一个 `postgres` 库，
依次跑 `packages/db` → `packages/api` → `apps/server`（21m01s）。**108 条失败全部是共享单机 DB 的
环境性 `Hook timed out` / `deadlock detected` / 连接池耗尽**，外加 `backup.integration.test.ts` 要求 URL
pathname 含 `test`、`account-storage.test.ts` 自带 5s 上限、以及冷 import 超时；不是代码回归。
唯一真实断言失败是 `account-email-locale.integration.test.ts` 的 `ar-SA` 夹具，已在 §1.4 修复并单文件
复跑 `1 passed / EXIT=0`。默认态（gate 关闭）下同一批文件全绿，见 §2.2。

**结论**：这 108 条不能作为定制版代码回归的判据。要在 CI 覆盖这 490 条 gate 用例，必须：
① 每个集成文件一个独立库（或 pathname 含 `test` 的 disposable 库）；② `--maxWorkers=1` 串行且一次只跑一个集成包；
③ 提高 `hookTimeout` 容纳 Windows 全量 migration；④ 用 Linux/容器 Postgres，避免本机 fsync 拖慢 DDL。
11-06 受限于单机环境没有做这一套，如实记为未覆盖（§4.6）。`RX106_BINDING_APP_URL` 需要的 disposable
服务同样未启动。

本机 PostgreSQL 已 `pg_ctl stop -m immediate` 关闭，数据目录 `D:/Deepseek/.pgdev2/pgdata` 保留、无进程占用。
