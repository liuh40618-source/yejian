# 页见 · 快速开始

面向第一次拿到这个仓库的人。目标：**5 分钟看到界面，10 分钟说清页见和上游 Reactive Resume 有什么不同**。

前置：Node.js 24.x、pnpm 12.16.1（`package.json` 的 `packageManager` 会自动匹配）、PostgreSQL 14+（仅路径 B 需要）。

## 先选路径

| 路径           | 额外依赖   | 能看到什么                                            | 适合                                 |
| -------------- | ---------- | ----------------------------------------------------- | ------------------------------------ |
| A 零数据库预览 | 无         | 首页、注册页、编辑器外壳（占位数据）                  | 只想先看长相；Windows 上不想装数据库 |
| B 完整启动     | PostgreSQL | 全部功能：中国市场面板、字段包导出、JD 报告、PDF 导出 | 真人走查、真的做一份简历             |

> **别拿路径 A 判断功能。** `apps/web/preview.html` 挂载的是 `src/preview.tsx`：内存路由 + stub 上下文，
> 不连数据库、不写数据、不含「中国市场」面板的真实交互。它只是免安装看外壳的入口。

## 路径 A：零数据库预览

在仓库根目录执行：

```sh
pnpm install --frozen-lockfile
pnpm --filter web dev
```

终端会打印实际地址（默认 `http://localhost:3000`，若 `.env.local` 设了 `PORT` 则以它为准）。打开：

- `/preview.html` — 首页
- `/preview.html?page=register` — 注册页
- `/preview.html?page=editor` — 编辑器外壳

这条命令绕开了根目录 `pnpm dev` 的 turbo 编排，Windows 上不会撞 `turbo spawn os error 231`。

> 预览页控制台会有两条 `502`（`/api/rpc/statistics/getTotals`、`/api/rpc/applications/listSummary`）。
> 这是后端未启动时的预期现象，不影响外壳与中文渲染；中文字体 `Noto Sans SC` 走本地静态资源，正常加载。
> 想让这两条消失，需要按路径 B 把 Hono server 与数据库一起起起来。

## 路径 B：完整启动

```sh
pnpm install --frozen-lockfile
test -e .env.local || cp .env.example .env.local
```

编辑 `.env.local`，最少填三项：

```dotenv
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/postgres
AUTH_SECRET=<openssl rand -hex 32 的输出>
ENCRYPTION_SECRET=<至少 32 个字符，与 AUTH_SECRET 不同>
STORAGE_BACKEND=local
```

`AUTH_SECRET` 用 `openssl rand -hex 32` 生成。`STORAGE_BACKEND=local` 让附件落本机磁盘，
这样只需 PostgreSQL，不必起 Redis 和 seaweedfs。若用 Docker 起数据库：

```sh
docker compose -f compose.dev.yml up -d postgres
```

`APP_URL` / `PORT` / `SERVER_PORT` 保持模板默认值即可（Vite 3000，Hono 3001，Vite 代理 API）。
端口冲突时两处一起改，并留出 3002 给邮件模板预览。

然后迁移并启动：

```sh
pnpm db:migrate
pnpm dev
```

打开 `http://localhost:3000`。**游客登录在 `.env.example` 里已默认开启**，复制模板后无需注册即可进入，
之后还能把游客数据转成正式账号。

> **公网部署前必须改**：`.env.local` 里设 `FLAG_ENABLE_GUEST_LOGIN="false"`、
> `FLAG_DISABLE_SIGNUPS="true"`。游客登录允许任何人匿名写入数据，只适用于本地 / 内网。

## Windows 本机已知限制

| 现象                                             | 原因                       | 替代做法                               |
| ------------------------------------------------ | -------------------------- | -------------------------------------- |
| `pnpm dev` / `pnpm db:migrate` 报 `os error 231` | turbo spawn 子进程         | 用下面的逐包命令，不走 turbo           |
| `pnpm typecheck` 报缺 `@tsrs/win32-x64`          | tsrs 未发布 Windows 二进制 | 用 `tsc --noEmit` 逐包检查             |
| `vp fmt` 直接写 Markdown 报 `os error 5`         | 文件句柄问题               | 用 `--stdin-filepath` 管道格式化后回写 |

逐包启动（各开一个终端，用 dotenvx 加载同一份 `.env.local`）：

```sh
pnpm exec dotenvx run --ignore=MISSING_ENV_FILE -f .env.local -- pnpm --filter @reactive-resume/db db:migrate
pnpm exec dotenvx run --ignore=MISSING_ENV_FILE -f .env.local -- pnpm --filter server dev
pnpm exec dotenvx run --ignore=MISSING_ENV_FILE -f .env.local -- pnpm --filter web dev
```

逐包类型检查与回归：

```sh
./node_modules/.bin/vp lint --deny-warnings
./node_modules/.bin/vp fmt --check
./node_modules/.bin/tsc --noEmit -p apps/web/tsconfig.json
./node_modules/.bin/tsc --noEmit -p apps/mobile/tsconfig.json
./node_modules/.bin/tsc --noEmit -p packages/schema/tsconfig.json
./node_modules/.bin/tsc --noEmit -p packages/resume/tsconfig.json
```

完整环境债与复现命令见 [`REGRESSION-UPSTREAM-GAP.md`](REGRESSION-UPSTREAM-GAP.md) §5。

## 真人走查清单

启动路径 B 后，按顺序走一遍，把卡住的地方记下来（这是当前最缺的一份证据）：

1. 以游客身份进入，新建一份简历。
2. 填结构化主档：姓名、手机、邮箱、城市、期望岗位、经历、项目、技能。
3. 打开右侧「中国市场」面板，切场景（社招 / 校招 / 国企）与视觉预设，看 PDF 预览。
4. 贴一段真实 JD，看关键词对齐报告；刷新页面，确认 JD 还在。
5. 选平台（BOSS直聘 / 智联 / 前程无忧 / 国企），展开映射，核对字段名与「可直接粘贴 / 需补齐 / 需人工」分段。
6. 导出字段 JSON 和文本，或点「复制全部字段」，打开对应平台网页照着贴一次。
7. 导出 PDF，用文本选择工具复制一遍，确认中文没乱码、没丢字。
8. 换一份 JD，确认主档没有被覆盖、字段包跟着变。

走查通过后，用三句话向别人说清这版做了什么：

- 中国市场的**主投递件是平台在线结构化简历**，PDF 是建立沟通后的补充材料。
- 页见改成了「一份结构化主档 → 附件 PDF / 平台表单字段映射 / JD 关键词报告」三输出。
- 产品主动否决了自动填写与代提交，只做人工交接；理由见 [`README.md`](README.md) 的「为什么这样改」与 [`UPSTREAM-DIFF.md`](UPSTREAM-DIFF.md) §11。

## 文档索引

| 文件                                                       | 内容                              |
| ---------------------------------------------------------- | --------------------------------- |
| [`README.md`](README.md)                                   | 项目身份、改动清单、已知限制      |
| [`UPSTREAM-DIFF.md`](UPSTREAM-DIFF.md)                     | 相对上游 v6.0.10 的真实文件级差异 |
| [`REGRESSION-UPSTREAM-GAP.md`](REGRESSION-UPSTREAM-GAP.md) | 全量回归证据、环境债、复现命令    |
| [`NOTICE.md`](NOTICE.md)                                   | 归属与版权声明                    |
