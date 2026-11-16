# 部署

这份文档记录「页见」当前可运行的生产部署，以及把它放到公网上的两条路。

## 1. 现在跑着的这一份

| 项       | 值                                                           |
| -------- | ------------------------------------------------------------ |
| 地址     | http://localhost:4100                                        |
| 数据库   | `yejian_prod`（全新空库，与开发库 `postgres` 完全分离）      |
| 进程     | 单进程单端口：`node apps/server/dist/index.mjs`              |
| 前端     | `apps/web/dist`（生产构建产物，由服务端直接提供）            |
| 启动迁移 | 服务启动时自动执行，日志打印 `Database migrations completed` |

验证过：首页 200、`/api/health` 为 `healthy`、访客登录 200、建简历 200、列表能读回。

## 2. 起一份生产模式

```sh
# 构建（本机 turbo 起不来，见第 5 节，分两步）
pnpm --filter web build
cd apps/server && pnpm exec tsdown && cd ../..

# 建一个空库
createdb -h 127.0.0.1 -p 5433 -U postgres yejian_prod   # 或用任意 Postgres 客户端

# 启动
PORT=4100 APP_URL=http://localhost:4100 \
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5433/yejian_prod \
NODE_ENV=production pnpm start
```

`pnpm start` 就是 `node apps/server/dist/index.mjs`。停止：结束该进程即可，没有常驻守护。

## 3. 环境变量

必填四项，缺任何一个都起不来：

| 变量                | 说明                                                       |
| ------------------- | ---------------------------------------------------------- |
| `DATABASE_URL`      | PostgreSQL 连接串                                          |
| `APP_URL`           | 对外访问地址，**必须和浏览器里的域名一致**，否则登录态失效 |
| `AUTH_SECRET`       | 会话签名密钥                                               |
| `ENCRYPTION_SECRET` | 加密密钥（AI 供应商 Key 等敏感字段）                       |

生成密钥：`openssl rand -base64 32`（Windows 用 `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`）。

可选项，不配也能跑：`REDIS_URL`（不配则不做缓存与限流）、`SMTP_*`（不配则不发邮件）、`S3_*`（不配则用本地磁盘，`LOCAL_STORAGE_PATH` 默认 `./data`）。

## 4. 放到公网

### 路线 A：一台有公网 IP 的服务器（推荐）

仓库自带 `compose.yml`，含 postgres / redis / seaweedfs（对象存储）/ 应用本体，应用服务是本地 `build` 而不是拉镜像。

```sh
# 服务器上
git clone <你的仓库> && cd reactive-resume-main
# 改 compose.yml 里应用的 APP_URL / AUTH_SECRET / ENCRYPTION_SECRET
docker compose up -d
```

前面再挂一个反向代理（Caddy / Nginx）把 80/443 转给应用的 3000，并把 `APP_URL` 写成 `https://你的域名`。

这条路线**尚未在本机验证**：本机 Docker daemon 没运行，`docker compose up` 没跑过。第一次上线时按日志确认迁移和健康检查。

### 路线 B：托管 Postgres + 任意 Node 主机

1. 在 Neon / Supabase 建一个免费 Postgres，拿到连接串（需要 `sslmode=require`）。
2. 主机上 `pnpm install && pnpm --filter web build && cd apps/server && pnpm exec tsdown`。
3. 用第 2 节的启动命令，把 `DATABASE_URL` 换成托管连接串、`APP_URL` 换成公网域名。

托管库要允许来自主机的连接（Neon 默认允许，Supabase 需要放行 IP）。

## 5. 已知问题

**Windows 上 `pnpm build` 失败：`所有的管道范例都在使用中 (os error 231)`。**
turbo 在这台机器上无法派生任何子进程，与代码无关；直接跑两个包的构建脚本可以正常出包（见第 2 节）。Linux 服务器上 `pnpm build` 正常。

**`apps/server/tsdown.config.ts` 的 Windows 路径判断 bug（已修）。**
`shouldExternalizeThirdParty` 原本只认 `"."` / `"@"` / `"/"` 前缀，而 rolldown 传给 `deps` 的是**解析后的绝对路径**。Windows 下是 `D:\…`，一个前缀都不匹配，于是整个 workspace 被当成第三方包外部化，产物只有一个 4KB 外壳，`import` 直接指向 `.ts` 源文件，`node dist/index.mjs` 报 `ERR_MODULE_NOT_FOUND`。已补 `isAbsolutePath` 判断，构建后 162 个 chunk / 6.87MB，可正常启动。

**公网隧道在本机跑不起来。**
`cloudflared` 启动即 panic：`Failed to load iphlpapi.dll: winapi error #5`，放开沙箱限制也一样，属系统层限制。因此「本机 + 隧道」这条临时公网方案在这里不可用。
