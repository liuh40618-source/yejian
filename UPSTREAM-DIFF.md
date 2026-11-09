# 与上游 v6.0.10 的真实文件级差异

> 生成：2026-11-08 · 基线：用户提供的 `D:/Chrome/reactive-resume-main.zip` · 方法：MD5 逐文件比对
> 用途：二次创新的**可追溯**证据，也是 README「改了什么 / 为什么」的素材来源。
> 本文只陈述文件事实；回归与测试证据见 `REGRESSION-UPSTREAM-GAP.md`。
>
> **状态更新（2026-11-08 晚）**：P0 已执行。项目定名**页见**；本地 git 已按 §8 建立两段真实提交
> （`deef281` 上游基线 → `4b637dc` 定制版），**无 remote、未推送**；`package.json` / `README.md` /
> `NOTICE.md` / `SECURITY.md` 已改写，`docs/spec.json` 已重新生成。
> 因此 §1、§6 描述的「身份文件与上游相同」和 §9 的状态表都是**执行前快照**，仅作历史证据；
> 现状与公开前待办见 **§10**。仓库当前**私有**，等完善后再开源。

---

## 0. 基线与方法

| 项         | 值                                                                                                                                             |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| 上游来源   | GitHub 源码 ZIP 快照 `reactive-resume-main.zip`（52 MB，3769 条目，单顶层目录 `reactive-resume-main/`）                                        |
| 上游身份   | `package.json`: `name: reactive-resume` / `version: 6.0.10` / `license: MIT` / `author: Amruth Pillai`                                         |
| 上游版权   | `LICENSE`: `Copyright (c) 2026 Amruth Pillai`                                                                                                  |
| 快照局限   | **ZIP 内无 `.git`**：是源码快照不是 clone。可做文件级 diff、可造 baseline commit，**不提供 commit history / tag / blame**                      |
| 解压位置   | `D:/Deepseek/.upstream-src/reactive-resume-main`（项目外部，不污染工作区）                                                                     |
| 比对方法   | 递归遍历两棵树，排除 `node_modules` / `dist` / `build` / `.turbo` / `.next` / `.expo` / `coverage` / `.cache` / `test-results`；同名文件比 MD5 |
| 完整清单   | `D:/Deepseek/.upstream-src/diff-report.txt`（1224 行，ADDED / REMOVED / MODIFIED 全列表）                                                      |
| 当前工作区 | 建库前**无 `.git`**；现已按 §8 建立两段提交（见顶部状态更新与 §10）                                                                            |

复现（Windows / Git Bash）：

```sh
/d/Python/Python1/py/python.exe - <<'PY'
import os, hashlib
UP, CUR = r"D:/Deepseek/.upstream-src/reactive-resume-main", r"D:/Deepseek/reactive-resume-main"
SKIP = {"node_modules",".git","dist","build",".turbo",".next",".expo","coverage",".cache","test-results"}
def walk(root):
    out={}
    for dp,dns,fns in os.walk(root):
        dns[:]=[d for d in dns if d not in SKIP]
        for f in fns:
            p=os.path.join(dp,f); out[os.path.relpath(p,root).replace("\\","/")]=p
    return out
def md5(p):
    h=hashlib.md5()
    with open(p,"rb") as f:
        for c in iter(lambda:f.read(1<<20),b""): h.update(c)
    return h.hexdigest()
u,c=walk(UP),walk(CUR); us,cs=set(u),set(c)
print("ADDED",len(cs-us),"REMOVED",len(us-cs))
print("MODIFIED",sum(md5(u[r])!=md5(c[r]) for r in cs&us))
print("SAME",sum(md5(u[r])==md5(c[r]) for r in cs&us))
PY
```

---

## 1. 一页结论

| 指标                 | 数量     | 说明                                   |
| -------------------- | -------- | -------------------------------------- |
| 上游文件             | 3226     |                                        |
| 当前文件             | 3713     | 净增 487                               |
| **SAME（字节相同）** | **2717** | 占上游 **84.2%** → 确为 fork，不是重写 |
| ADDED                | 710      | 其中 505 是中文字体                    |
| REMOVED              | 223      | 其中 106 是 `.po`                      |
| MODIFIED             | 286      | 其中 248 是 `.ts` / `.tsx`             |

一句话：**84% 的文件与上游完全相同，创新集中在约 61 个新增代码/文档文件 + 286 个修改文件**；
但 `README.md` / `package.json` / `LICENSE` / `SECURITY.md` / `.env.example` **五份身份文件与上游字节级相同** ——
工程上改了很多，作品身份上还是上游本体。

---

## 2. ADDED 710：拆掉水分

| 类别                                                                | 数量            | 处置建议                                                                   |
| ------------------------------------------------------------------- | --------------- | -------------------------------------------------------------------------- |
| 中文字体 `apps/web/public/fonts/cn/*.woff2`                         | 505（13.13 MB） | **保留**，19 套中式模板与中文 ATS 排版依赖；README 需说明字体来源与授权    |
| 过程噪声（`.workbuddy-ai` / 截图 / 临时脚本）                       | 88              | **不进公开仓库**，见 §7                                                    |
| 运行时资产（模板预览 19 jpg + 19 pdf、品牌 9、logo/icon 4、其他 1） | 52              | **保留**                                                                   |
| 真正的新代码 / 文档                                                 | **65**          | 作品主体；其中 1 个 0 字节临时文件 + 3 个本地预览文件应剔除 → **约 61 个** |

四类相加 505 + 88 + 52 + 65 = 710，与总数自洽。

### 2.1 创新文件按主题

- **PDF 模板 19 套**：`packages/pdf/src/templates/<id>/{XxxPage.tsx, semantic.ts}` 共 38 个 + 2 个测试。
  上游 18 套 → 删 9 套、改名 9 套、新增 10 套 = 19 套；`templates.ts` 中 `oneColumn` 被引用 19 次、
  无 `columns: 2`，「全部单栏 ATS-safe」成立。
- **中国市场领域层**：schema `china-market.ts` / `china-sample.ts`、resume `china-market.ts` +
  `china-market.test.ts` + 2 个 `chinese.test.ts`、Web / Mobile 各 1 个面板 + Web 面板渲染测试。
- **ATS 中文适配**：`packages/resume/src/ats-pdf/**` 共 **15 个差异文件 = 13 个改造上游既有文件**
  （`analyze/*`、`jd/*`、`rules/*`、`types.ts`）+ **2 个新增中文测试**。不是「新加一套 ATS 引擎」。
- **迁移与工程**：`migrations/20261103090000_localize_template_ids/`（SQL + snapshot）、
  `packages/pdf/vitest.fonts.setup.ts`、`packages/utils/src/brand.ts`、
  `tooling/locales/` 4 个译文工具与词表、字体 CSS 2 个、
  根目录 `scripts/` 7 个品牌资源 / 模板预览生成脚本（**有复现价值，建议保留**）。
- **文档**：`REGRESSION-UPSTREAM-GAP.md`、本文件。

---

## 3. REMOVED 223：主动裁剪的证据

| 类别                                    | 数量                                 |
| --------------------------------------- | ------------------------------------ |
| `.po` 语言目录                          | 106（web 53 + mobile 53，语言 55→2） |
| `apps/web/public/doodles/*.webp` 装饰图 | 36                                   |
| 删除模板的 `.ts` / `.tsx`               | 44（18 + 26）                        |
| 模板预览 `.jpg` / `.pdf`                | 18 + 18                              |
| `.json`                                 | 1                                    |

分布：`apps/web` 129、`apps/mobile` 53、`packages/pdf` 41。
与 `REGRESSION-UPSTREAM-GAP.md` §3.2「语言收窄 / 9 套模板删除 / 双栏移除 / 品牌替换」一致。

---

## 4. MODIFIED 286：报告未覆盖的部分

| 目录                    | 数    | 目录              | 数  |
| ----------------------- | ----- | ----------------- | --- |
| `apps/web`              | 85    | `packages/resume` | 19  |
| `packages/pdf`          | 54    | `apps/mobile`     | 13  |
| `packages/api`          | 47    | `apps/server`     | 12  |
| `packages/schema`       | 9     | `packages/mcp`    | 8   |
| `packages/email`        | 7     | `packages/ui`     | 5   |
| `packages/utils`        | 5     | `packages/ai`     | 4   |
| `packages/import`       | 4     | `packages/auth`   | 3   |
| `packages/docx` / `env` | 2 + 2 | `packages/fonts`  | 1   |

`REGRESSION-UPSTREAM-GAP.md` §3 只覆盖了 web / pdf / api / resume / schema 主线；
**`packages/mcp`、`packages/email`、`packages/ui`、`apps/server`、`packages/utils`、`packages/ai` 的改动从未被记录**。
写 README「改了什么」时不能只抄 §3，应以本文件的文件清单为准。

根目录被改的只有 4 个：`CLAUDE.md`、`GLOSSARY.md`、`pnpm-workspace.yaml`、`vitest.shared.mts`。

---

## 5. 校验：旧报告 §3.1 有两处失真（本次实证纠正）

| 报告原文                                             | 真实情况                                                                                                                                                                                                  | 判定               |
| ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| 「游客登录：上游没有，已补齐」                       | 上游 `packages/env/src/server.ts:211`、`.env.example:198` **本来就有** `FLAG_ENABLE_GUEST_LOGIN`（默认 `false`）；当前 `packages/env/src/server.ts` 与上游 **MD5 相同**。本版只是用 `.env.local` 打开开关 | 不是补齐，只是配置 |
| 「国产 AI 供应商：新增 `deepseek` + `dashscope`」    | 上游 `apps/web/src/features/settings/ai/catalog.ts:74` **已有 `deepseek`**；真实新增只有 `dashscope`（通义千问）一个条目，diff 恰好 +7 行                                                                 | 部分失真           |
| ATS 中文适配                                         | 15 个差异文件（13 改 + 2 增）                                                                                                                                                                             | 方向对，措辞需精确 |
| 19 套中式模板 / 中文目录 / 品牌 / chinaMarket 产品层 | 全部在真实 diff 中                                                                                                                                                                                        |                    |
| `default.ts` 的 `en-US` 是中性夹具                   | 文件确实被改（`template: onyx→minimal-photo`、section 顺序、追加 `chinaMarket`、加注释），但 `locale: "en-US"` 那行**没动**                                                                               | 结论成立           |

---

## 6. 身份层：五份文件与上游字节级相同

```
IDENTICAL  README.md
IDENTICAL  package.json
IDENTICAL  LICENSE
IDENTICAL  SECURITY.md
IDENTICAL  .env.example
```

- `LICENSE` 相同**是好事**：MIT 唯一硬性要求「保留版权声明」已满足，**不要删、不要改成自己的名字**；
  正确做法是保留原文，另加 `NOTICE.md` 与 README Attribution 声明自己的修改。
- 其余四份相同是**交付缺口**：陌生人 clone 下来会以为拿到 Reactive Resume 本体；`package.json` 仍是上游
  作者 / 仓库 / 版本号，`SECURITY.md` 仍讲上游 `5.0.x` 安全策略，`README.md` 仍有 38 处上游外链。
- 这四份文件不涉及任何业务代码，是二次创新投入产出比最高的改动。

---

## 7. 交付边界：`git init` 前实测的忽略规则

在临时 git 仓库中用真实 `git check-ignore` 验证现有 `.gitignore`：

| 路径                                                                                                                                                | 状态                                                                              |
| --------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `.env` / `.env.local`                                                                                                                               | 已忽略（`.env*` + `!.env.example`），`AUTH_SECRET` / `ENCRYPTION_SECRET` 不会泄露 |
| `.agents/*`、`*.log*`                                                                                                                               | 已忽略                                                                            |
| `.env.example`                                                                                                                                      | 正确放行                                                                          |
| `.workbuddy-ai/`（58）、`shots/`（6）、`shot-*.mjs`（约 10）、`e2e-walk.mjs`、`.npmrc`、`rename-templates.mjs`、`scan-latin.mjs`、`apps/web/_tmp_*` | 原本**均未被忽略**                                                                |

本轮已在 `.gitignore` 末尾补上上述排除项（带注释，可逐行撤销）。
`apps/web/{preview.html, src/preview.tsx, src/features/homepage/editor-preview.tsx}` 与
`china-resume-prototype.html` **未忽略**：前三者是自包含的本地预览入口（无数据库即可看界面，有复现价值），
后者被 `REGRESSION-UPSTREAM-GAP.md` §3.4 引用，忽略会造成文档断链。如需精简可另行剔除，
它们不参与正式构建（`vite.config.ts` 与上游 SAME，未加多入口）。

---

## 8. 用 ZIP 建立可追溯基线（P0 第一步，脚本已实测）

ZIP 无 history，但足以造出「上游 commit → 定制 commit」两阶段真实历史，且**不需要复制任何文件**：
利用临时 index 把上游快照写成第一个 commit，再让工作区（定制版）自然成为第二个 commit 的 diff。

```sh
cd /d/Deepseek/reactive-resume-main
git init -b main

# ① 上游基线 commit：临时 index + 上游 work-tree，完全不碰当前工作区
export GIT_INDEX_FILE="D:/Deepseek/.upstream-src/.baseline-index"
git --work-tree="D:/Deepseek/.upstream-src/reactive-resume-main" add -A
TREE=$(git write-tree)
BASE=$(GIT_AUTHOR_NAME="Upstream" GIT_AUTHOR_EMAIL="upstream@local" \
       GIT_COMMITTER_NAME="Upstream" GIT_COMMITTER_EMAIL="upstream@local" \
       git commit-tree "$TREE" -m "chore: import upstream Reactive Resume v6.0.10 (MIT, Amruth Pillai)")
unset GIT_INDEX_FILE
git update-ref refs/heads/main "$BASE"
git reset --mixed -q HEAD        # index 回到基线，工作区保持定制版不动

# ② 第二个 commit = 全部真实差异（含 223 个删除）
git add -A
git commit -m "feat: Chinese-market resume customization"
git diff --stat HEAD~1 HEAD      # 应显示约 710 added / 223 deleted / 286 modified
```

已在隔离目录用最小样例验证：`git log` 得到两个 commit，`git show --name-status` 正确输出 M / D / A。
注意：① 的基线会带上上游原版 `.gitignore`（不含本轮补充的排除项），② 才会用定制版 `.gitignore`，
所以过程噪声不会进第二个 commit。**执行前请先确认项目正式名、署名、是否开源** —— 这三项目前仍未提供。

---

## 9. 对二次创新的意义

| 条件   | 状态                                                                                                         |
| ------ | ------------------------------------------------------------------------------------------------------------ |
| 可追溯 | **条件已具备、动作未做**：有了 v6.0.10 干净基线，但工作区仍无 `.git`                                         |
| 可辨识 | **未具备**：5 份身份文件与上游相同，README 仍是上游文案                                                      |
| 可复现 | **部分具备**：代码可跑、§0 与 `REGRESSION-UPSTREAM-GAP.md` §5 有复现命令；缺一份面向新人的 README 与快速启动 |

下一动作不是加功能，而是：§8 建基线 → 改 4 份身份文件 → 新增 `NOTICE.md` →
把本文 §2 / §5 提炼成 README 的 "What changed / Why"。

> 以上四项已于 2026-11-08 晚全部完成，见 §10。

---

## 10. 现状与公开前清单

### 10.1 P0 已落地（2026-11-08 晚）

| 项       | 结果                                                                                                                                                |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| 可追溯   | 本地 git：`deef281` 上游基线 → `4b637dc` 定制版 → `b3cc019` 项目身份层；`git diff` 真实可核对                                                       |
| 可辨识   | 定名**页见**；`package.json` → `yejian` / `0.1.0` / 自有 author；README 重写为中文；新增 `NOTICE.md`；`SECURITY.md` 去掉上游 `5.0.x` 策略与上游邮箱 |
| 合规     | `LICENSE` **原样保留** MIT 原文与 `Copyright (c) 2026 Amruth Pillai`；`NOTICE.md` 声明修改部分版权与来源、明确上游不背书                            |
| 联动     | `apps/server/src/openapi/generator.ts` 去掉上游 LICENSE URL；`pnpm docs:gen` 重跑后 `docs/spec.json` 为 `页见` / `0.1.0` / MIT                      |
| 私有保证 | `git remote -v` 为空，未推送；`.env.local`、`.workbuddy-ai/` 均未被跟踪                                                                             |

MIT 是宽松许可，**不要求公开衍生作品**。当前不发布完全合规；一旦公开，只要在分发物中保留
`LICENSE` 原文与版权声明即满足上游义务。

### 10.2 公开前清单（等项目完善后逐项清掉）

| #   | 项目         | 现状                                                                      | 需要的动作                                                                                                   |
| --- | ------------ | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| 1   | 中文字体授权 | 505 个 Noto woff2 **无 OFL 文本**                                         | 补 `NotoSansSC-OFL.txt` / `NotoSerifSC-OFL.txt`（SIL OFL 1.1 + 字体版权行），照 `ibm-plex-mono-OFL.txt` 放置 |
| 2   | 法务页与链接 | Mobile 设置页、登录页、`store/metadata.json` 共 6 处指向 `docs.rxresu.me` | 补本地隐私政策 / 用户协议页并改链；补 ICP 备案信息                                                           |
| 3   | CI 硬编码    | `docker-publish.yml:26` 为 `docker.io/amruthpillai/reactive-resume`       | 改成本仓库镜像或删除该 workflow；核对 `issue-maintenance.yml` 的定时任务是公共仓库下是否合适                 |
| 4   | 上游内部痕迹 | 5 个 `.agents/docs/rx-*.md` 含作者 Linear 链接与 `/Users/amruth/...`      | 已被 `.gitignore` 忽略、**不会进仓库**；如需从工作区彻底移除再手动删                                         |
| 5   | 品牌资源     | `apps/web/public/opengraph/banner.jpg` 仍是上游图                         | 换成页见 banner；`apps/server/src/static/{web,resume-card,resume-page}.ts` 引用该路径                        |
| 6   | 文档站外链   | `docs/changelog/index.mdx`、`packages/resume/src/patch.ts` 注释等         | 逐项核对：纯溯源链接保留，功能性跳转改本地                                                                   |
| 7   | 个人信息     | commit 历史含 `liuh40618@gmail.com`                                       | 决定是否换 GitHub no-reply 邮箱；如需剔除要在**公开前**重写历史                                              |
| 8   | 署名确认     | 暂用本机 git 身份 `liuh40618-source`                                      | 若要真名 / 笔名，同步改 `package.json`、`NOTICE.md`、README 三处                                             |
| 9   | 版本号联动   | `docs/spec.json` 由 `pnpm docs:gen` 生成                                  | 每次改 `package.json` 的 version 后重跑 `pnpm docs:gen`                                                      |
| 10  | 回归与 CI    | 默认态全绿；DB 集成 490 条受本机单机 Postgres 限制                        | CI 上配 Linux Postgres + 一文件一库串行；修或注明 mobile 6 条 Windows `/D:/` 测试                            |

另外，产品侧还有两件不阻塞发布但决定「好不好用」的事：平台表单映射目前是只读预览（无导出 / 填充），
JD 只存在组件内存、刷新即丢。

### 10.3 生成物审计：`docs/spec.json` 的 4744 行大 diff

身份层提交 `b3cc019` 里 `docs/spec.json` 出现 `4744 ++++` 的大 diff，初看像是身份改写混入了意外内容。
逐叶子比对 `4b637dc:docs/spec.json` 与当前 HEAD 后确认：

| 差异类别                    | 叶子数 | 说明                                                                                                  |
| --------------------------- | ------ | ----------------------------------------------------------------------------------------------------- |
| `chinaMarket` schema 块新增 | 39     | `components.schemas.ResumeData` 及 28 个内联引用该 schema 的 path（部分含请求体与响应体两处）各补一段 |
| `info.version`              | 1      | `6.0.10` → `0.1.0`                                                                                    |
| `info.license.url`          | 1      | 删除指向上游 GitHub 的 LICENSE 链接                                                                   |
| **其它**                    | **0**  | paths 数量 191 不变，无新增 / 删除 path，无新增 / 删除 schema，无其它字段变化                         |

4744 行只是 39 段 pretty-print JSON 展开的结果（每段约 120 行），不是内容膨胀。

**根因**：`4b637dc` 里的 `docs/spec.json` 是手工改过的滞后快照——title / contact / servers 已改成
「页见」与 `localhost`，但定制提交新增的 `metadata.chinaMarket` 从未同步进 spec（旧快照中
`chinaMarket` 出现 **0** 次，新快照 39 次）。`pnpm docs:gen` 按当前 schema 全量重出才补齐。
所以这份 diff 是**修复滞后，不是回归**，应当保留。

复核结论：

- 生成可复现：连续两次 `pnpm docs:gen` 的 sha256 均为 `08a48637…7200`，重跑后工作区无新增改动。
- 上游痕迹：`rxresu.me` / `amruth` / `github.com/reactive-resume` / `6.0.10` 命中均为 0；
  `servers` 为生成默认值 `http://localhost:3000/api/openapi`。
- 残留 8 处 `reactive-resume` 是功能性常量（tag、`reactive-resume-cover-letter` /
  `reactive-resume-application-packet` 等文档类型 const 与 curl 示例），属既有 enum / response shape，
  改动会破坏兼容，**有意保留**。
- `pnpm docs:check` EXIT=0；254 条 warning 是 `docs/images/**` 未被引用的人工复核提示，非阻断。
- 公开前若要让 `servers` 指向真实部署地址，用 `APP_URL` 重跑 `pnpm docs:gen`（见 §10.2 第 9 项）。

### 10.4 决定公开时

```sh
git remote add origin <your-repo-url>
git push -u origin main
```

推送前把 §10.2 清完，并把 README 顶部的「私有」状态、`SECURITY.md` 的状态段、
`NOTICE.md` 末尾的 "Current status" 一起改成公开口径。

## 11. 产品闭环断点：两条投递链路零连接（2026-11-09 复核）

> 本节校正此前两处说得过于绝对的判断：早期「全仓没有平台投递链路」「JD 不持久化」的说法，
> 只在**页见新增的中国市场层**范围内成立；产品整体（继承自上游 v6.0.10）已有一套雇主表单投递链路。

### 11.1 上游已有的链路（不是缺失，是未对接）

| 能力         | 位置                                                                                                                     |
| ------------ | ------------------------------------------------------------------------------------------------------------------------ |
| JD 落库      | `packages/db/src/schema/applications.ts:90` `job_description`，另有 `requirements` / `match_score`                       |
| 投递包审校   | `apps/web/src/features/career/workspace/application-packet.tsx`：review → approve → 下载 JSON + 审批过的 PDF             |
| 表单填充计划 | `packages/utils/src/form-fill.ts` `FormFillPlan` / `FORM_FILL_SCRIPT`；`packages/schema/src/applications/autofill.ts:99` |
| 平台适配器   | `autofill.ts:101-110` 仅 `greenhouse` / `lever` / `ashby`，**中国平台 URL 直接 `return null`**                           |

### 11.2 页见的链路（只读、平行）

`resume.metadata.chinaMarket` → `packages/resume/src/china-market.ts:304` `mapChinaMarketPlatform()`
→ `mapped.rows` → Web `china-market-group.tsx:249-256` / Mobile `:218` 渲染成 `<div>`。
全仓 `chinaMarket` 引用集中在 `packages/resume`、`packages/schema`、`packages/api/.../initial-data.ts`
与两个面板；在 `applications` / `career` / `db` / `api` 目录 **0 引用**。
入口只有 builder 的 Design tab，产品主链路（applications / 投递）看不到它。

### 11.3 四个具体断点

| #   | 断点                 | 证据                                                                          |
| --- | -------------------- | ----------------------------------------------------------------------------- |
| 1   | 映射结果没有出口     | `mapped.rows` 无 Blob / clipboard / download，也未转成 `FormFillPlan.fields`  |
| 2   | 平台白名单不认中国站 | `packetFillPlan()` 的 host 判定只覆盖三家海外 ATS                             |
| 3   | JD 两套数据源        | 面板 `useState("")` 刷新即丢，上游 `job_description` 已落库，二者无引用关系   |
| 4   | 主键粒度错配         | `chinaMarket` 是 per-resume（`metadata` 下），applications 是 per-application |

### 11.4 最后一公里同样不在仓库内

`application-packet.tsx:220` 明写「Import this file into the browser helper」、
「Native browser integration requires its own verified build」；`FORM_FILL_SCRIPT` 只是字符串常量。
仓库内 `tooling/capture/manifest.json` 是**抓取**扩展，不是填充扩展。
即便把页见映射接进 `FormFillPlan`，真正执行 DOM 写入仍需外部 verified build；
上游也明确这是实验性能力：不代提交、不标记已发送、只填已核验的原生控件。

### 11.5 最小补齐路径（不是从零造链路）

1. 把 `mapped.rows` 转成可下载 JSON（或 `FormFillPlan.fields` 形状），先让「主投递件」有真输出。
2. 复用 `applications.job_description` / `applicationId` 作为 JD 与投递上下文，去掉面板里的 `useState` 孤岛。
3. 若要真填充，再为中国平台补 `packetFillPlan` 适配器 + helper build；这属公开后产品化，不阻塞 P0 / P1。

**结论**：交付闭环（可追溯 / 可辨识 / 可复现）与工程闭环均已闭合。
未闭合的是**产品闭环**，具体是「结构化主档 → 平台在线表单」的最后一跳，
以及中国市场层与上游投递主链路之间的四个接口。
