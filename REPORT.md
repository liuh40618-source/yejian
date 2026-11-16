# 页见 · YeJian 迭代报告

**时间**：2026-11
**基线**：Reactive Resume `v6.0.10`（MIT，Copyright (c) 2026 Amruth Pillai）
**范围**：三轮「优化 → 调试 → 再优化」，目标是把产品做到真正适用于中国招聘市场，并让仓库可以作为一个二次开发项目上传 GitHub。

---

## 1. 结论先说

三轮做完，三件事成立：

1. **产品层**：JD 关键词对齐不再只认产品设计岗，跨行业 JD（工程、产品、央国企、公务员）都能给出有意义的命中率；「一份主档 → 三种交付物」这条链路的出口全部接通，包括真实下载的文件名。
2. **代码层**：`pnpm knip` 从 9 个未使用文件 + 1 个未用依赖 + 4 个未用导出，降到 **0**。
3. **发布层**：字体 OFL 许可证补齐，CI 从上游的发布闸门收窄为贡献者能用的 lint + typecheck + 单测，README / NOTICE 不再自称「私有」。

还差的部分在 §7，主要是法务页面和真实用户验证。

---

## 2. 三轮做了什么

| 轮次   | 提交      | 主题                                      |
| ------ | --------- | ----------------------------------------- |
| 第一轮 | `3a47b26` | 修产品功能缺口：JD 对齐、字段包、导出命名 |
| 第二轮 | `3a20598` | 清理死代码与死资源                        |
| 第三轮 | `9890ff2` | GitHub 二次开发项目就绪                   |

### 2.1 第一轮：产品功能缺口

**问题**：JD 报告的分母是写死的 10 个产品设计岗关键词。前端架构岗 JD 只命中「团队管理」→ 显示 `命中 0 / 1`；国企党建岗一个都不命中 → 整块报告消失。注释宣称「分母只算 JD 真正要求的词」，但候选集本身是死的。

**改法**：

- 关键词来源拆成两路：**跨行业字典**（45 个词，覆盖教育/身份、工程、产品/运营、央国企/公务员）+ **从 JD 动态抽取的 Latin token**（React、TypeScript、CET-6、ATS 这类），上限 24 个。
- `hasBaseline` 从「识别到关键词」改成「JD 非空」，新增 `unrecognized`：粘了 JD 但一个词都没识别时，显示解释文案，而不是 `0 / 0` 或空白。
- 改写建议从「样例人物的具体数字」改成占位模板（`{A}` / `{N}` / `{X}`）。原文案会诱导用户照抄编造的履历。
- 12 个场景主档字段（微信、期望城市、薪资、到岗、CET、专业全称、绩点、核心课程、政治面貌、性别、籍贯、学生干部）纳入 JD 对齐的正文来源。之前它们填了也不参与匹配。
- 平台字段包升到 `version: 2`，带上 `jobReport`，交接文件里直接写明这份表单该强调什么。
- `email` 与 `contact` 拆成两个字段键：纯邮箱字段只给邮箱，合并的「联系电话 · 电子邮箱」行才给手机 + 邮箱。
- 工作经历 / 项目经验从「计数说明」改成可粘贴的正文。
- 新增 `chinaMarketFileBaseName()` / `chinaMarketDefaultFileName()`，把中国式命名接进**每一条真实下载路径**：Web 一键 PDF、Web 下载面板、Web 求职信「简历+求职信」合并下载、Mobile 下载面板、Mobile 求职信分享、API PDF 下载、API 文档导出、公开简历 PDF。
- 文件命名逻辑从 `packages/utils/src/file.ts` 拆到新的 `file-name.ts`，因为原文件带 `downloadWithAnchor`，会把 `document` 依赖带进纯领域包 `packages/resume`（实测报 `TS2584`）。

**边界**：Cover letter、legacy 文档、空白未定制简历仍走上游命名。`applications/packet.ts` 的 `resume-<versionId>.pdf` 保持不变——那是投递包内部存档名，靠 versionId 保唯一，不是给 HR 看的附件名。

### 2.2 第二轮：代码健康

`pnpm knip` 的每一条都做了人工判定，不是照着报告删。

**删掉的（确认无任何引用）**：

- `apps/web/src/features/locale/combobox.tsx`
- `packages/pdf/src/templates/shared/sidebar-background.tsx`
- `SemanticContactRowView`（`primitives.tsx`）
- `resolvePlacementColor` 及其选项类型（`styles.ts`）
- `hasFullWidthPunctuation`（`normalize.ts`）——顺带删掉它依赖的模块级 `/[...]/g` 正则，那个正则的 `lastIndex` 会在多次调用间泄漏状态
- `scripts/shot-brand.mjs`（硬编码了本机绝对路径）

**降级为文件内私有**：`HEADING_TRACKING_MAX`。

**判定为误报，改为配置而非删代码**：

- 两个 `fonts/cn/*.css` 被 `index.html` / `preview.html` 的 `<link>` 引用
- `src/preview.tsx` 是 `preview.html` 的入口，`editor-preview.tsx` 由它引入
- `scripts/generate-template-previews.ts` 是手工运行的正规维护脚本
- `lefthook` 由 git 调用，不由 package script 调用

**补的真缺口**：`generate-template-previews.ts` 用了 `@napi-rs/canvas`，但根包从未声明，之前靠 hoisting 侥幸能跑。已在根 `devDependencies` 声明（`1.0.13`），lock 只增 3 行。

### 2.3 第三轮：公开发布就绪

**字体许可证（硬阻塞）**：505 个 woff2（Noto Sans SC 303 + Noto Serif SC 202，13.13 MB）此前没有任何许可证文本，而 README 自己标着「公开前必须补」。现在两份 OFL 原文按各自版权行分开存放：

- `OFL-noto-sans-sc.txt` — `Copyright 2014-2021 Adobe`
- `OFL-noto-serif-sc.txt` — `Copyright 2012 Google Inc.`

同目录 `README.md` 记录来源（Fontsource / Google Fonts）并说明**字形未修改**，只用了 Fontsource 的 unicode-range 分片，因此不构成 Modified Version，Reserved Font Name 条款不适用。

**CI 收窄**：上游的 `ci.yml` 是发布闸门——单测 + 浏览器 e2e + Cloudflare 打包 + Vercel 构建 + 部署冒烟。后三项依赖上游的云项目或部署密钥，fork 一 push 就是满屏红。现在只跑 lint、格式、类型、单测，配 Postgres service。

**其余清理**：

- `docker-publish.yml` 去掉 `push` 触发，改为手动（原逻辑每次提交都推上游镜像）
- 删 `autofix.yml`、`issue-maintenance.yml`（上游仓库运营用，依赖上游 bot）
- 删 `FUNDING.yml`（指向 Amruth Pillai，fork 上会误导）
- README 新增「公开发布前检查」表，NOTICE 的字体与状态段落同步更新

---

## 3. 验证证据

### 3.1 真实浏览器端到端（Chromium，非 preview 外壳）

游客登录 → 自动新建空白简历 → `/builder` 真实交互，**10/10 PASS**，零 HTTP 失败、零页面异常：

| #   | 验证点              | 结果                                                               |
| --- | ------------------- | ------------------------------------------------------------------ |
| 01  | 游客登录 + 新建简历 | 进入 `/builder/<uuid>`                                             |
| 02  | 基本信息四项        | `陈嘉宁 / 高级产品设计师 / 邮箱 / 手机` 全部落库                   |
| 03  | 12 个场景主档字段   | 展开 12 个输入；薪资 / CET / 政治面貌填入成功                      |
| 04  | 跨行业 JD 报告      | `命中 0 / 12`，分母来自 JD（微服务、高并发、React、TypeScript 等） |
| 05  | 无关键词 JD         | 显示解释文案，不出现 `0 / 0`                                       |
| 06  | 纯邮箱字段          | 字段包「邮箱」= 邮箱，「手机号码」独立一行，不串值                 |
| 07  | 字段包 v2           | `version=2`，含 `jobReport.required/hits/misses`，16 个字段        |
| 08  | 文本导出            | 含「【JD 关键词对齐】」段落                                        |
| 09  | 真实 PDF 下载名     | `陈嘉宁-高级产品设计师-工作年限.pdf`，`%PDF-` 文件头               |
| 10  | 刷新持久化          | JD 与主档值均保留                                                  |

第 04 项的 `命中 0` 是正确的：空白简历没有任何经历，分母 12 来自 JD。改之前这里会显示 `命中 0 / 1`。

### 3.2 单元测试

| 包                                  | 文件                   | 测试                        |
| ----------------------------------- | ---------------------- | --------------------------- |
| `packages/pdf`                      | 69                     | **486 passed**              |
| `packages/resume`                   | 32                     | **396 passed**              |
| `packages/schema`                   | 25                     | **241 passed**              |
| `packages/utils`                    | 12                     | **228 passed**              |
| `packages/api`（导出相关 3 个文件） | 3                      | **29 passed**               |
| `apps/web`                          | 131 passed / 1 skipped | **833 passed / 9 skipped**  |
| **合计**                            | **272**（api 非全量）  | **2213 passed / 9 skipped** |

`packages/api` 只跑了 `resume/export`、`resume/public-pdf`、`documents/exports` 三个文件，不是全量。

### 3.3 静态检查

| 项                  | 结果                                         |
| ------------------- | -------------------------------------------- |
| `pnpm lint`         | 2030 文件 / 174 规则 / **0 warning 0 error** |
| `pnpm format:check` | 2438 文件，**全部合规**                      |
| `pnpm knip`         | **无任何报告**（exit 0）                     |
| `git diff --check`  | 干净                                         |
| 各包 `tsc --noEmit` | web / mobile / pdf / resume **全部 0 错误**  |

`pnpm typecheck` 在本机不可用：各包脚本是 `tsrs --noEmit`，其二进制只发布 macOS arm64 与 Linux x64/arm64，Windows 上必然失败。已改用逐包 `tsc --noEmit` 替代。

---

## 4. 现在能做到什么

一个中国求职者可以：

1. 游客身份直接试用，不需要注册。
2. 填一份结构化主档（基本信息 + 12 个场景字段），选投递场景（社招 / 校招 / 央国企）。
3. 粘贴目标岗位 JD，看到：命中哪些关键词、缺哪些、缺的怎么写才不算编造、主档里有几句量化表述。
4. 导出平台表单字段包（JSON / 纯文本），按「可直接粘贴 / 需补齐 / 需人工」分段贴进 BOSS 直聘、智联、前程无忧、央国企网申。
5. 下载附件 PDF，文件名自动是「姓名-岗位-工作年限」或「姓名-岗位-政治面貌-学校」。
6. 换一份 JD 不会覆盖主档内容。

---

## 5. 不能做到什么（明确边界）

- **不自动填表、不代提交**。只导出字段，边界写在面板上。
- **两条投递链路未合并**：页见的 `chinaMarket` 与上游 `applications` → `FormFillPlan` → 浏览器 helper 是独立的两条线，`chinaMarket` 在 `applications` / `career` / `db` / `api` 里仍是 0 引用。一份主档无法对应多份投递，因为缺关联键。
- **JD 有两套数据源**：`metadata.chinaMarket.jobDescription`（per-resume）与 `applications.job_description`（per-application）互不复用。
- **自动填充的最后一公里没有**：`packetFillPlan()` 的 host 白名单只认 Greenhouse / Lever / Ashby，中国平台 URL 返回 `null`。
- **法务页面缺失**：隐私政策、用户协议、ICP 备案都没有；Mobile 的法务链接仍指向上游文档站。
- **无手机号 / 短信登录**；AI 功能全部 BYO-key。

---

## 6. 上传 GitHub 的操作

仓库已就绪，只差 remote。

```sh
# 1. 在 GitHub 建一个空仓库（不要勾选 README / .gitignore / license）

# 2. 配置远端
git remote add origin git@github.com:<你的账号>/<仓库名>.git

# 3. 推上去
git push -u origin main
```

推送前建议再确认三件事：

```sh
git status --short          # 应为空
git log --oneline | head -5 # 应有完整历史，首提交是上游 v6.0.10 快照
grep FLAG_ENABLE_GUEST_LOGIN .env.example  # 公开部署前改 false
```

仓库结构对二次开发友好：首提交是纯净的上游快照，之后每个提交都是真实 diff，`UPSTREAM-DIFF.md` 有哈希级文件清单，方便日后合并上游更新。

---

## 7. 遗留项与下一步

| 优先级 | 项                     | 说明                                                  |
| ------ | ---------------------- | ----------------------------------------------------- |
| P0     | 法务页面               | 上线前必须有隐私政策、用户协议；国内部署还要 ICP 备案 |
| P0     | 游客登录改回 `false`   | `.env.example` 当前为 `true`，公开部署会允许匿名写入  |
| P1     | 两条投递链路合并       | 需要给 `chinaMarket` 与 `applications` 之间加关联键   |
| P1     | 中国平台自动填充适配器 | 目前只有海外 ATS 白名单                               |
| P2     | 手机号 / 短信登录      | 中国用户预期能力                                      |
| P2     | 真实用户走查           | 以上全部是工程验证，还没有真人用过                    |
| P3     | 浏览器 e2e 进 CI       | 本机可跑，CI 里未启用                                 |

---

## 8. 环境说明（Windows 本机）

Docker daemon 与 WSL 在本机都不可用，完整链路靠免安装 PostgreSQL 跑通：

```sh
# PostgreSQL（正常关闭用 pg_ctl stop -m fast，别 kill，否则下次要崩溃恢复）
/d/pgrun/bin/postgres.exe -D D:/Deepseek/.pgdev2/pgdata -p 5433 -c listen_addresses=127.0.0.1

# Hono API（必须非 watch 的 tsx，tsx watch 会停在 Validating local storage path）
pnpm exec dotenvx run --ignore=MISSING_ENV_FILE -f .env.local -- \
  pnpm exec tsx --tsconfig tsconfig.json apps/server/src/index.ts

# Web
pnpm --filter web dev
```

本机网络有系统代理，访问本地服务要加 `--noproxy '*'`，Playwright 要加 `--no-proxy-server`，否则本地请求会被代理成 502。
