# FeelCurve（手感）

> 看得上的动效，复制成提示词。

Monorepo 结构（npm workspaces）：

- `packages/web` — Next.js 前端（动效展示站）
- `packages/api` — NestJS 后端（登录接口；后续可扩展上传等）

## 本地开发

```bash
npm install
npm run dev:web    # http://localhost:3000
npm run dev:api    # http://localhost:3001
```

## 登录与账号（可选）

`packages/api` 提供邮箱密码和 GitHub OAuth 登录，前端页面为 `/login`、`/register`；不登录仍可浏览、调参和复制。登录态使用 httpOnly Cookie（`fc_session`，7 天），密码以 bcrypt 哈希保存。

接口：

- `POST /api/auth/register`、`POST /api/auth/login`、`POST /api/auth/logout`、`GET /api/auth/me`
- `GET /api/auth/github`、`GET /api/auth/github/callback`

### 本地配置

1. 复制 `packages/api/.env.example` 为 `packages/api/.env`，至少填入 `JWT_SECRET`；需要 GitHub 登录时再填 OAuth App 的 Client ID/Secret。
2. 初始化 SQLite 数据库（schema 变化后重新执行）：

   ```bash
   npm run db:push
   ```

3. 可选：复制 `packages/web/.env.example` 为 `packages/web/.env.local`。默认 API 地址已是 `http://localhost:3001`，本地通常不用改。
4. 分别启动 `npm run dev:api` 和 `npm run dev:web`。

GitHub OAuth App 的 Authorization callback URL 填 `http://localhost:3001/api/auth/github/callback`。本地不配置 GitHub 也能使用邮箱登录；生产环境把 `WEB_APP_URL`、`API_PUBLIC_URL`、`CORS_ORIGIN` 改成实际 HTTPS 地址，重新生成 `JWT_SECRET`，并在构建前端时设置 `NEXT_PUBLIC_API_URL`（默认值只适用于本地）。生产建议让 API 与站点同源，或放在同一可注册域名的子域下，否则 `SameSite=Lax` 的会话 Cookie 不会被发送。

当前边界：尚无邮箱验证、找回密码、账号自助删除和登录限流；退出只清除浏览器 Cookie，已签发的 JWT 在 7 天内仍然有效。上线公网前建议补登录限流，并评估缩短会话有效期。

## 更新服务器网站

保存代码后，在 Windows 上双击根目录的 `update.cmd`，或在项目目录运行：

```powershell
.\update.cmd
```

脚本会打包当前保存的代码、上传并在服务器构建，构建成功后切换版本；失败时保留或恢复旧版本。私钥放在 Git 忽略的 `.secrets/_feelcurve-ecs.pem`。运行条件、打包范围和回退步骤见 [部署说明](deploy/README.md)。

## 数据库

Prisma + SQLite，schema 在 `packages/api/prisma/schema.prisma`。
`DATABASE_URL` 走环境变量，默认 `file:./dev.db`，上服务器时改成文件绝对路径或换 Postgres 均可。

## 许可

- 代码：MIT，见 [LICENSE](LICENSE)。
- 提示词、文案和文档内容：CC BY 4.0，见 [LICENSE-CONTENT](LICENSE-CONTENT)。
- 最终许可证由项目所有者确认。如果希望限制商用，可以把内容许可改为 CC BY-NC 4.0；修改前请确认它符合你的分发方式。
