# Ubuntu 服务器部署

当前部署前端展示站，访问地址为 https://feelcurve.com（HTTP 自动跳转到 HTTPS）。后端与数据库暂未启用。

## 一键更新（推荐）

保存本机代码后，双击项目根目录的 `update.cmd`。也可以在本机 PowerShell 执行：

```powershell
cd D:\_projects\aiprompt
.\update.cmd
```

脚本会先在本机执行 `npm run build:web`，再把源码和 `packages/web/.next` 生产产物打包，包含未提交到 Git 的修改；无需先执行提交或推送。服务器只在新目录安装运行时依赖，成功后短暂停止旧进程、切换目录，再启动和检查新版本。这样构建不再占用服务器内存。关闭本机开发服务不会影响这个过程。

本地构建失败时不会上传；服务器安装、切换、启动、健康检查或保存 PM2 配置失败时会尝试恢复旧版本。全过程不删除文件或目录。成功后，窗口显示 `Deployment complete`，然后打开 https://feelcurve.com 检查页面。

- 本地私钥：`.secrets/_feelcurve-ecs.pem`，仅用于 SSH 认证。
- 本地发布包和记录：`output/deploy/<版本号>/`。
- 服务器上传目录：`/root/feelcurve-uploads/<版本号>/`。
- 服务器旧版本：`/opt/feelcurve-backup-<版本号>`。
- 发布失败的目录会保留，清理时按 AGENTS.md 规则手动处理。

打包范围固定为项目的包配置、`packages/`、`deploy/` 和几个根目录文档/入口文件。本地构建模式会额外包含 `packages/web/.next` 的生产产物，并排除 `.next/cache`、`.next/dev`、`.next/trace` 等开发文件；私钥、`.secrets`、`.env*`、`node_modules`、`dist` 和本地数据库仍会被排除。源码模式（`-SourceBuild`）仍排除 `.next`，由服务器构建。归档中存在链接时会拒绝上传。服务器再次验证包的 SHA-256、成员路径和文件类型，并使用文件锁阻止同时更新。

仅在本机构建并检查包，不连接服务器：

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\deploy\update.ps1 -PackageOnly
```

默认使用本地构建。如需临时回到服务器构建（应急/旧流程）：

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\deploy\update.ps1 -SourceBuild
```

服务器只有 2 vCPU / 1.7GiB 内存，不建议在服务器构建；本地构建失败不会上传，也不会影响线上。

更换服务器或私钥路径时：

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\deploy\update.ps1 -Server 47.116.63.161 -KeyPath "D:\_projects\aiprompt\.secrets\_feelcurve-ecs.pem"
```

脚本沿用电脑已验证的 SSH 主机记录，不自动信任新主机。服务器需要现有的 FeelCurve、Node.js、npm、PM2、Python 3、curl 和 flock；当前 Ubuntu 服务器已具备这些条件。

## 目录与服务

- 源码：`/opt/feelcurve`
- PM2 进程：`feelcurve-web`
- Next.js：`127.0.0.1:3000`，由 Nginx 转发公网 80/443 端口（443 为 HTTPS，80 仅做跳转）
- Nginx 配置：`/etc/nginx/conf.d/feelcurve.conf`
- 运行环境：Node.js 22、npm、PM2、Nginx

## 安装和构建

正常发布由 `update.cmd` 在本机构建，服务器只安装运行时依赖：

```bash
cd /opt/feelcurve
npm ci --omit=dev --workspace @feelcurve/web --include-workspace-root
```

只有在使用 `-SourceBuild` 或手工源码部署时，才在服务器完整构建：

```bash
cd /opt/feelcurve
npm ci --workspace @feelcurve/web --include-workspace-root
npm run build:web
```

不要上传本机的 `node_modules`、`.env` 或 `.secrets`。本地构建模式会自动上传 `.next` 的生产产物（不含 `cache`/`dev`）；本地私钥仅用于 SSH 连接，保存在 Git 忽略的 `.secrets/` 目录内。

## 后台运行

```bash
pm2 start /opt/feelcurve/deploy/ecosystem.config.cjs
curl -I http://127.0.0.1:3000
pm2 startup systemd -u root --hp /root
pm2 save
```

配置为单个进程，内存超过 512MB 时自动重启。工作目录固定为 `packages/web`，确保动效源码读取路径正确。

## Nginx

首次部署、确认目标配置文件尚不存在时执行：

```bash
cp -n /opt/feelcurve/deploy/feelcurve.nginx.conf /etc/nginx/conf.d/feelcurve.conf
nginx -t && systemctl reload nginx
```

若目标配置已存在，应先核对并备份再更新。配置按 `feelcurve.com`、`www.feelcurve.com` 和公网 IP 匹配站点；更换 IP 或绑定域名时，同时更新 `server_name`。

模板本身是首次部署用的 HTTP 版本；HTTPS 由 certbot 在此文件基础上自动生成（见下节），线上已启用 TLS 时不要直接用模板覆盖。

## HTTPS

证书由 Let's Encrypt 经 snap 版 certbot 签发。不要安装 apt 版 certbot：Ubuntu 22.04 自带的 1.21 版本会因机器上遗留的旧证书 lineage 报错，且会与 snap 版重复定时续期。

```bash
snap install --classic certbot
/snap/bin/certbot --nginx -d feelcurve.com -d www.feelcurve.com \
  --non-interactive --agree-tos --register-unsafely-without-email --redirect
```

- 证书与私钥：`/etc/letsencrypt/live/feelcurve.com/`，有效期至 2027-02-07；certbot 会改写 `/etc/nginx/conf.d/feelcurve.conf` 并自动 reload。
- 自动续期：`snap.certbot.renew.timer` 每天检查两次，无需手工操作；用 `systemctl list-timers | grep certbot` 查看。
- 80 端口对域名和 IP 都 301 到 `https://feelcurve.com`；`https://47.116.63.161` 会因证书不含 IP 而告警，属预期。安全组需放行 443。
- 上线后启用了 HSTS（`max-age=31536000`）。

## 访问统计（Umami）

统计默认关闭。`packages/web/lib/analytics-config.ts` 中两个常量都为空时，页面不会渲染 Umami 脚本，也不会发出统计请求；清空常量并重新发布即可关闭。

### Umami Cloud

1. 在 https://umami.is/ 注册并登录，新建 website，域名填 `feelcurve.com`。
2. 打开该 website 的 Tracking code，复制 `script.js` 地址和 `data-website-id`。
3. 填入 `packages/web/lib/analytics-config.ts`：

```ts
// 以 Umami 控制台 Tracking code 显示的地址为准。
export const UMAMI_SCRIPT_URL = "https://cloud.umami.is/script.js";
export const UMAMI_WEBSITE_ID = "<你的 website id>";
```

这两个值都是公开信息，会出现在页面 HTML 里，不是密钥。不要把 Umami API key、登录密码或其他令牌写进仓库。

### 自托管 Umami

在自托管实例中新建 website 后，把 `UMAMI_SCRIPT_URL` 设为 `https://<你的 Umami 域名>/script.js`，`UMAMI_WEBSITE_ID` 填该 website 的 ID。脚本地址必须能被公网 HTTPS 访问；不需要新增 npm 依赖或构建环境变量。

### 发布与验证

```powershell
cd D:\_projects\aiprompt
.\update.cmd
```

发布后：

1. 打开 https://feelcurve.com，在浏览器 DevTools 的 Network 面板筛选 `script.js`，确认请求返回 200；Console 执行 `window.umami` 应能看到跟踪对象。
2. 在 Umami 的 Realtime 或 Events 中确认出现页面访问（PV）。
3. 点击任意“复制提示词”按钮，确认出现事件 `copy_prompt`，属性包含 `slug`、`surface`、`stack`、`variant`、`lang`。
4. 把两个常量改回空字符串并重新发布，确认不再请求 Umami、Console 无报错。

埋点只发送上述公开元数据；不会发送提示词正文、源码、邮箱，也不会把 IP 放进事件参数。

## 错误上报（Sentry）

默认关闭。`packages/web/lib/telemetry.ts` 里的 `SENTRY_DSN` 为空时，Sentry 的 `enabled` 为 `false`，不会发送上报请求；填入 DSN 并重新发布后启用。

### 创建项目并填入 DSN

1. 登录 https://sentry.io/，新建 Project，平台选 Next.js。
2. 在 Project Settings → Client Keys (DSN) 复制 DSN。
3. 填入 `packages/web/lib/telemetry.ts`：

```ts
export const SENTRY_DSN = "https://<key>@o<orgId>.ingest.sentry.io/<projectId>";
```

DSN 是公开标识，会出现在浏览器请求里，不是密钥。`SENTRY_AUTH_TOKEN` 是密钥，绝不能写进仓库或提交到 Git。

### 发布

```powershell
cd D:\_projects\aiprompt
.\update.cmd
```

### 验证

Sentry 官方说明：直接在浏览器 DevTools Console 里 throw 的错误可能被沙箱化，不会触发上报。用下面的临时文件在本地验证，验证后删除，不要发布到线上。

1. 浏览器端：临时新增 `packages/web/app/sentry-test/page.tsx`：

```tsx
"use client";

export default function SentryTestPage() {
  return (
    <button
      type="button"
      onClick={() => {
        throw new Error("sentry-browser-test");
      }}
    >
      触发浏览器错误
    </button>
  );
}
```

运行 `npm run dev --workspace @feelcurve/web`，打开 `http://127.0.0.1:3000/sentry-test`，点击按钮，Sentry Issues 应出现 `sentry-browser-test`。

2. Server 端：临时新增 `packages/web/app/api/sentry-test/route.ts`：

```ts
export function GET() {
  throw new Error("sentry-server-test");
}
```

访问 `http://127.0.0.1:3000/api/sentry-test`，Sentry Issues 应出现 `sentry-server-test`；该错误由 `instrumentation.ts` 的 `onRequestError` 捕获。

3. 验证完成后删除两个临时文件，再确认 `git status` 不包含它们。

### Source map 与令牌

P0 不上传 source map：`packages/web/next.config.ts` 中已设置 `sourcemaps: { disable: true }`，构建不读取 `SENTRY_AUTH_TOKEN`，没有 token 也不会失败。P1 需要可读堆栈时再配置 Sentry 的 `org`、`project` 和服务器/CI 环境里的 `SENTRY_AUTH_TOKEN`，并去掉该禁用项；令牌只放在部署环境，不进仓库。

错误上报不会主动附加提示词正文或源码；`dataCollection` 已关闭默认用户信息和请求体采集，Session Replay 也未开启。

## 可用性监控

站点提供只读健康检查接口 `GET /api/health`：

```json
{ "status": "ok", "timestamp": "2026-11-09T09:00:00.000Z", "uptime": 12345 }
```

- 固定返回 `200`，响应头 `Cache-Control: no-store`，不包含提交号、环境变量或主机名。
- 与其他页面共用 Nginx 现有的 `/` 转发，不需要新增 location。
- 本机或服务器验证：

```bash
curl -i http://127.0.0.1:3000/api/health
curl -fsS http://127.0.0.1:3000/api/health | grep -q '"status":"ok"' && echo "health: ok"
```

第一条确认状态码和响应头；第二条在 HTTP 非 2xx 或 JSON 不是 `status: ok` 时返回非零退出码。

### 外部监控（UptimeRobot / BetterStack）

这部分需要监控平台账号，按下面的步骤在平台控制台手动完成；仓库中不保存账号、Webhook 地址或令牌。

1. 登录 https://uptimerobot.com 或 https://betterstack.com，创建监控。
2. 健康接口监控：
   - URL：`https://feelcurve.com/api/health`
   - 间隔：5 分钟
   - 判定：HTTP 状态码为 `200`，且响应体包含 `"status":"ok"`。UptimeRobot 选 Keyword 类型并填关键字 `"status":"ok"`；BetterStack 选 Keyword 类型，或在 HTTP 监控中配置响应体关键字断言。
   - 只有状态码和 JSON 内容同时满足才算健康；只看 `200` 无法发现接口返回错误内容的情况。
3. 页面监控：
   - URL：`https://feelcurve.com/effects/magnetic-button`
   - 间隔：5 分钟
   - 判定：HTTP `200`，并可加一个稳定关键字（如页面标题中的 `Magnetic`）确认拿到的是页面而非错误页。
4. 告警：在 Alert Contacts / On-call 中添加邮箱；需要微信通知时，使用平台的 Webhook 集成转发到企业微信群机器人（或 Server酱等），按对应服务的文档填写地址。至少配置一个实际能收到的渠道，并用平台的测试告警确认送达。
5. 免费套餐可能限制 5 分钟间隔或告警渠道；若 5 分钟不可选，使用套餐允许的最短间隔。

监控只验证 HTTPS 公网入口，不替代 PM2 的进程状态检查。收到告警后先按「常用操作」查看 `pm2 status`、`pm2 logs feelcurve-web` 和 `curl -i http://127.0.0.1:3000/api/health`，再判断是应用、PM2 还是 Nginx/证书问题。

### PM2 日志轮转

服务器执行一次即可：

```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 14
pm2 set pm2-logrotate:compress true
```

- `max_size 10M`：单个日志超过 10MB 时轮转。
- `retain 14`：最多保留 14 个历史日志文件。
- `compress true`：轮转后的日志用 gzip 压缩。

查看当前配置和运行状态：

```bash
pm2 conf
pm2 list
pm2 describe pm2-logrotate
ls -lh /root/.pm2/logs/
```

`pm2 conf` 应显示 `max_size: 10M`、`retain: 14`、`compress: true`；`pm2 describe pm2-logrotate` 中 `status` 应为 `online`，`pm2 list` 也应能看到该模块。轮转文件出现在 `/root/.pm2/logs/`（文件名带时间戳，压缩后以 `.gz` 结尾）。

日志轮转只处理 PM2 日志，不需要重启 `feelcurve-web`，也不需要修改 `deploy/ecosystem.config.cjs`；其中的 `name`、`cwd`、`script`、`args`、`instances` 由 `update-server.sh` 校验，保持不变。

## ICP 备案

站点已通过 ICP 备案（安徽管局、个人主体）。按管局要求，首页页脚需要展示备案号并链接到 https://beian.miit.gov.cn/ 。新增备案号后修改前端页脚，再执行 `update.cmd` 部署。域名未备案时阿里云会拦截访问（403 / `Non-compliance ICP Filing`），不要指望用 IP 或非标准端口绕过。

## 常用操作

```bash
pm2 status
pm2 logs feelcurve-web --lines 50 --nostream
pm2 restart feelcurve-web
systemctl is-enabled pm2-root
curl -I https://feelcurve.com
```

需要停止网站时执行 `pm2 stop feelcurve-web`；停止后再执行 `pm2 save` 可保存停止状态。

## 手动更新代码

更新时在新目录构建，构建成功后再切换。切换期间会短暂重启网站。旧版本目录保留用于回退，Nginx 无需重新配置。

### 1. 本机打包并上传

在 Windows PowerShell 执行。先检查并提交本次要发布的修改，第一次还需把 `.gitignore` 和 `deploy/` 一起提交。`git archive HEAD` 只打包已提交内容，不包含仅保存到编辑器、尚未提交的修改。

```powershell
cd D:\_projects\aiprompt
git status --short
git add .
git commit -m "Update FeelCurve"
```

确认提交成功后，再执行打包和上传：

```powershell
New-Item -ItemType Directory -Path output\deploy -Force | Out-Null
git archive --format=tar.gz --prefix=feelcurve/ --output=output/deploy/feelcurve-update.tar.gz HEAD
scp -i "D:\_projects\aiprompt\.secrets\_feelcurve-ecs.pem" -o IdentitiesOnly=yes "D:\_projects\aiprompt\output\deploy\feelcurve-update.tar.gz" root@47.116.63.161:/root/
```

每条命令成功后再继续。已提交全部修改时可跳过提交步骤。私钥目录被 Git 忽略，不会被此归档命令打包；不要强制将私钥加入 Git，也不要把整个本机项目文件夹上传到公网服务器。

### 2. 在新目录安装和构建

在服务器同一个 SSH 窗口执行以下准备命令。后续切换还会用到 `release` 和 `backup` 两个变量，请保持此窗口打开。

```bash
stamp=$(date +%Y%m%d-%H%M%S)
release="/opt/feelcurve-release-$stamp"
backup="/opt/feelcurve-backup-$stamp"

mkdir "$release" &&
tar -xzf /root/feelcurve-update.tar.gz -C "$release" --strip-components=1 &&
cd "$release" &&
npm ci --workspace @feelcurve/web --include-workspace-root &&
npm run build:web
```

只有看到构建成功并返回命令提示符，才继续切换。构建失败时，当前网站仍使用原目录运行。不要在正在运行的 `/opt/feelcurve` 中执行 `npm ci` 或重建 `.next`。

### 3. 切换版本并验证

在刚才的同一个服务器窗口执行：

```bash
cd /opt &&
test -f "$release/packages/web/.next/BUILD_ID" &&
test -f "$release/deploy/ecosystem.config.cjs" &&
test -d /opt/feelcurve &&
test ! -e "$backup" &&
pm2 stop feelcurve-web &&
mv -T -- /opt/feelcurve "$backup" &&
mv -T -- "$release" /opt/feelcurve &&
pm2 restart /opt/feelcurve/deploy/ecosystem.config.cjs --update-env &&
curl --retry 10 --retry-connrefused --retry-delay 1 --max-time 10 -fsS -o /dev/null http://127.0.0.1:3000/ &&
curl --max-time 10 -fsS -o /dev/null http://127.0.0.1:3000/effects/magnetic-button &&
pm2 save &&
printf 'Update complete. Previous version: %s\n' "$backup"
```

记下最后输出的旧版本路径，并打开 https://feelcurve.com 检查页面。PM2 始终使用固定的 `/opt/feelcurve` 路径；不要直接用另一个目录的配置重启并假定 PM2 会切换工作目录。

### 4. 回退

需要回退时，在同一个 SSH 窗口执行。若已重新登录，先把 `backup` 赋值为第 3 步输出的确切旧版本路径。以下命令保留有问题的新版本目录，方便检查。

```bash
failed="/opt/feelcurve-failed-$(date +%Y%m%d-%H%M%S)"
cd /opt &&
test -f "$backup/packages/web/.next/BUILD_ID" &&
test ! -e "$failed" &&
pm2 stop feelcurve-web &&
mv -T -- /opt/feelcurve "$failed" &&
mv -T -- "$backup" /opt/feelcurve &&
pm2 restart /opt/feelcurve/deploy/ecosystem.config.cjs --update-env &&
curl --retry 10 --retry-connrefused --retry-delay 1 --max-time 10 -fsS -o /dev/null http://127.0.0.1:3000/ &&
pm2 save
```

如果在目录切换中途报错，先保留现场并查看具体路径，不要接着执行其他切换命令。旧版本不会自动删除；按项目 AGENTS.md 规则，需要清理目录时由用户手动处理。
