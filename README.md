# FeelCurve（手感）

> 看得上的动效，复制成提示词。

Monorepo 结构（npm workspaces）：

- `packages/web` — Next.js 前端（动效展示站）
- `packages/api` — NestJS 后端（为用户上传、登录等扩展预留）

## 本地开发

```bash
npm install
npm run dev:web    # http://localhost:3000
npm run dev:api    # http://localhost:3001
```

## 数据库

Prisma + SQLite，schema 在 `packages/api/prisma/schema.prisma`。
`DATABASE_URL` 走环境变量，默认 `file:./dev.db`，上服务器时改成文件绝对路径或换 Postgres 均可。
