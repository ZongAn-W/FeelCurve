# Ubuntu 服务器部署

当前部署前端展示站，访问地址为 http://47.116.63.161 。后端与数据库暂未启用。

## 一键更新（推荐）

保存本机代码后，双击项目根目录的 `update.cmd`。也可以在本机 PowerShell 执行：

```powershell
cd D:\_projects\aiprompt
.\update.cmd
```

脚本会打包当前已经保存的源码，包含未提交到 Git 的修改；无需先执行提交或推送。它会上传到服务器，在新目录安装依赖并构建，成功后短暂停止旧进程、切换目录，再启动和检查新版本。关闭本机开发服务不会影响这个过程。

构建失败时旧站继续运行；切换、启动、健康检查或保存 PM2 配置失败时会尝试恢复旧版本。全过程不删除文件或目录。成功后，窗口显示 `Deployment complete`，然后打开 http://47.116.63.161 检查页面。

- 本地私钥：`.secrets/_feelcurve-ecs.pem`，仅用于 SSH 认证。
- 本地发布包和记录：`output/deploy/<版本号>/`。
- 服务器上传目录：`/root/feelcurve-uploads/<版本号>/`。
- 服务器旧版本：`/opt/feelcurve-backup-<版本号>`。
- 发布失败的目录会保留，清理时按 AGENTS.md 规则手动处理。

打包范围固定为项目的包配置、`packages/`、`deploy/` 和几个根目录文档/入口文件。私钥、`.secrets`、`.env*`、`node_modules`、`.next`、`dist` 和本地数据库会被排除；归档中存在链接时会拒绝上传。服务器再次验证包的 SHA-256、成员路径和文件类型，并使用文件锁阻止同时更新。

仅打包并检查，不连接服务器：

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\deploy\update.ps1 -PackageOnly
```

更换服务器或私钥路径时：

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\deploy\update.ps1 -Server 47.116.63.161 -KeyPath "D:\_projects\aiprompt\.secrets\_feelcurve-ecs.pem"
```

脚本沿用电脑已验证的 SSH 主机记录，不自动信任新主机。服务器需要现有的 FeelCurve、Node.js、npm、PM2、Python 3、curl 和 flock；当前 Ubuntu 服务器已具备这些条件。

## 目录与服务

- 源码：`/opt/feelcurve`
- PM2 进程：`feelcurve-web`
- Next.js：`127.0.0.1:3000`，由 Nginx 转发公网 80 端口
- Nginx 配置：`/etc/nginx/conf.d/feelcurve.conf`
- 运行环境：Node.js 22、npm、PM2、Nginx

## 安装和构建

从源码压缩包解压到 `/opt/feelcurve` 后，在服务器执行：

```bash
cd /opt/feelcurve
npm ci --workspace @feelcurve/web --include-workspace-root
npm run build:web
```

不要上传本机的 `node_modules`、`.next`、`.env` 或 `.secrets`。本地私钥仅用于 SSH 连接，保存在 Git 忽略的 `.secrets/` 目录内。

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

若目标配置已存在，应先核对并备份再更新。配置按当前公网 IP 匹配站点；更换 IP 或绑定域名时，同时更新 `server_name`。当前使用 HTTP，HTTPS 需另行配置。

## 常用操作

```bash
pm2 status
pm2 logs feelcurve-web --lines 50 --nostream
pm2 restart feelcurve-web
systemctl is-enabled pm2-root
curl -I http://47.116.63.161
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

记下最后输出的旧版本路径，并打开 http://47.116.63.161 检查页面。PM2 始终使用固定的 `/opt/feelcurve` 路径；不要直接用另一个目录的配置重启并假定 PM2 会切换工作目录。

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
