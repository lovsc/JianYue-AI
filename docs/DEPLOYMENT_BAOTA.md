# 简跃 AI：阿里云 Linux + 宝塔部署

目标地址为 `https://octopush5.com`。这是完整应用部署，保留现有 Vue、Express、SQLite 和豆包接口。本文不包含面板地址、登录凭据、AI 密钥或本地用户数据。

## 2026-10-17 实际部署记录

已部署到用户现有的 Alibaba Cloud Linux 3（x86_64）服务器，沿用原主域名及 HTTPS 证书。原站点文件保留在原位置，原站点和 Nginx 配置另备份于 `/www/backup/jianyue-deploy-20261017/`。

本次通过独立 Node 22.23.3 和 systemd 管理服务，**没有使用下文的宝塔 Node 项目管理器或 PM2**，避免给服务器额外安装另一套进程管理器：

- 应用：`/www/wwwroot/jianyue`。
- 运行环境：`/opt/jianyue-runtime/node-v22.23.3-linux-x64/bin/node`，下载自 Node 官方站并核验 SHA-256。
- 服务：`jianyue-ai.service`，以 `www` 用户单实例运行，设置开机自启和失败重启。
- 日志：宝塔终端执行 `journalctl -u jianyue-ai -n 100 --no-pager`。
- 重启：`systemctl restart jianyue-ai`；状态：`systemctl status jianyue-ai --no-pager`。
- 数据：`/www/jianyue-data/resume.db`，应用更新时保留该目录。
- 主域名代理：`/www/server/panel/vhost/nginx/octopush5.com.conf`，原 SSL 和 ACME 验证配置保留。
- 备案展示：构建时设置公开环境变量 `VITE_ICP_RECORD`，沿用原站点的备案号；普通构建留空时不展示。

通过公网 HTTPS 验证了注册、登录、简历创建与保存、真实 AI SSE 聊天、真实岗位分析、导出准备接口以及重启后数据保留。部署测试账号会清理；实际浏览器 PDF 分页与此前审查的问题仍需后续专项验收。

以下为从零安装参考。维护当前已部署站点时，应使用上述 systemd 命令，不要重复创建宝塔 Node 项目。

## 部署结构

浏览器 → 宝塔 Nginx（HTTPS）→ `127.0.0.1:3000` → Node（网页和 `/api/v1`）→ SQLite / 豆包。

Node 只监听本机，不需要在阿里云安全组开放 3000 或 5173。仅网站需要 80/443。不要让 Nginx 将项目源码目录作为静态根目录；网页由 Node 仅从 `frontend/dist` 提供。

独立目录：

- 应用：`/www/wwwroot/jianyue`
- 持久数据：`/www/jianyue-data/resume.db`
- 密钥配置：应用内 `backend/.env`，仅在服务器生成

## 1. 检查现有站点并备份

在宝塔查看 `octopush5.com` 是否绑定现有网站，备份其站点配置、文件和数据库。不要直接删除或覆盖原站点。已有网站需要确认可以切换后，才将主域名反代改到本项目；旧内容和原反代配置应保留，以便回滚。

在阿里云域名解析确认根域名（主机记录 `@`）的 A 记录指向当前服务器公网 IPv4。原有记录已正确时无需修改；不要清除邮件或其他业务记录。`www` 仅在单独配置 DNS 和证书后使用。

## 2. 构建并上传发布包

开发电脑已有前端依赖时，在项目根目录执行：

```powershell
node scripts/package-release.mjs
```

发布包在项目 `tmp/releases/<时间>/jianyue-release.tar.gz`，所有构建临时文件均在 D 盘。发布包只包含白名单内的后端源码、锁文件、部署脚本和构建后的前端，不包含 `.env`、本地简历数据库、聊天记录、Git 历史或 Windows 的 `node_modules`。

在宝塔「文件」上传并解压，让最终文件位置为 `/www/wwwroot/jianyue/backend/server.js`。不要再嵌套一个同名 `jianyue` 目录，也不要覆盖其他网站目录。

## 3. 准备 Node 和服务器配置

在宝塔安装或选择 **Node 22（至少 22.12）**，在项目设置及终端均使用该版本。终端运行 `node -v`、`npm -v` 确认。Node 18 不适用；不要使用前端 Vite 开发服务器作为生产服务。

首次安装，在宝塔终端执行：

```bash
cd /www/wwwroot/jianyue
node deploy/configure.mjs --origin https://octopush5.com --data-dir /www/jianyue-data
cd backend
npm ci --omit=dev
```

配置脚本生成随机 JWT 密钥，已有 `backend/.env` 时会停止并保留原文件，不会重置登录密钥或覆盖数据库。确认目录属于本项目后，如 Node 项目选择 `www` 用户运行，首次配置后在宝塔终端设置权限：

```bash
chown -R www:www /www/wwwroot/jianyue /www/jianyue-data
chmod 600 /www/wwwroot/jianyue/backend/.env
chmod 700 /www/jianyue-data
```

在宝塔文件编辑器中设置服务器上 `backend/.env` 的 `DOUBAO_API_KEY` 和 `DOUBAO_MODEL_ENDPOINT`；不要放到前端、发送到聊天或提交仓库。没有配置时，网页和账号功能可用，但真实 AI 不可用。

SQLite 的 `better-sqlite3` 是原生依赖，必须在 Linux 上安装，不能上传 Windows 的依赖。如果预编译包不可用，需要按服务器实际发行版安装 Python 3、make 和 C++ 编译工具，再重试；不要直接使用不明来源的安装脚本。

## 4. 创建守护进程

在宝塔「网站 → Node 项目」或已安装的 Node 项目管理器中添加：

| 项目项 | 值 |
| --- | --- |
| 名称 | jianyue-ai |
| 项目目录 / 工作目录 | /www/wwwroot/jianyue/backend |
| 启动文件 | server.js |
| 启动命令（如以命令配置） | npm start |
| Node | 22.12 以上的 22.x |
| 端口 | 3000 |
| 运行用户 | www（与前一步权限一致） |
| 实例数 | 1 |
| 环境 | NODE_ENV=production |
| 自动重启 / 开机启动 | 开启 |

如果现有平台只能通过 PM2 管理，可使用发布包内 `deploy/ecosystem.config.cjs`；选一种进程管理方式，避免两个进程争抢同一端口。不要使用 PM2 cluster 模式或多实例运行当前 SQLite 应用。

启动后在服务器终端验证：

```bash
curl -fsS http://127.0.0.1:3000/api/v1/health
curl -I http://127.0.0.1:3000/
curl -I http://127.0.0.1:3000/resumes/1
```

健康接口应返回 JSON，首页和页面路由应返回 HTML。若 3000 已被其他服务占用，先确认归属，不要终止陌生进程；在 `.env` 与代理配置中一致改用空闲端口。

## 5. 绑定主域名和 HTTPS

如果使用 Node 项目提供的域名映射，绑定 `octopush5.com`，确认生成的代理目标为 `http://127.0.0.1:3000`。如果已有主域名站点，使用该站点的反向代理功能，将代理目录 `/` 转发到上述地址，**不要另建重复绑定主域名的站点**。

反代中关闭缓存和缓冲，超时至少 180 秒，使 AI 的 SSE 输出不被整段缓存。提供的 `deploy/nginx-location.conf` 是站点 `server` 块内部的 `location /` 示例；替换已有同名 location，不能重复粘贴；保留宝塔的证书和 ACME 验证配置。不要将该片段覆盖整个 Nginx 配置。保存前测试配置，成功后重载。

应用只信任本机反向代理（`TRUST_PROXY=loopback`）；示例 Nginx 会覆盖客户端传来的转发 IP 请求头。若另加 CDN 或负载均衡，需要重新核对代理链配置。

使用宝塔为 `octopush5.com` 申请或绑定证书，验证 HTTPS 正常后开启强制 HTTPS。阿里云安全组和服务器防火墙应允许网站 80/443，Node 3000 保持不对公网开放。

参考：[宝塔反向代理文档](https://docs.bt.cn/user-guide/site/php/site-config/reverse-proxy)、[Express 可信代理说明](https://expressjs.com/en/guide/behind-proxies/)。实际面板菜单依已安装版本为准。

## 6. 验收

使用手机移动网络或另一台电脑打开 `https://octopush5.com`，验证：

1. 注册测试账号、退出并重新登录。
2. 创建并保存简历，刷新编辑页，确认内容仍在。
3. 粘贴 JD 并分析一次，确认报告生成；这一步会产生真实模型费用。
4. 打开 AI 助手，确认能逐步输出，而非等待结束才整体出现。
5. 打开导出页，通过浏览器另存为 PDF，检查内容和分页。
6. 重启 Node 项目后重新登录，确认简历和报告没有丢失。
7. 浏览器网络请求应指向当前域名的 `/api/v1`，不得指向 localhost。

## 更新、数据和日志

后续发布只更新应用代码和 `frontend/dist`。保留服务器 `backend/.env` 和 `/www/jianyue-data`；不要把每次发布当作首次安装，也不要重新生成 JWT 密钥。替换前保留上一份可用代码及站点配置，更新后重新安装后端依赖（锁文件有变化时）并重启。

SQLite 启用了 WAL，在线备份应使用 SQLite Backup API 或停机后整体备份数据库及其 WAL 文件；不能在运行中只复制主数据库文件就认定备份完整。通过宝塔安排定期备份，并实际验证可恢复。

日志通过宝塔 / PM2 查看，配置轮转和保留期限，避免长期无限增长。数据库、配置和日志不要放进 `frontend/dist`。

`AI_RATE_LIMIT_MAX` 默认每账号每小时 20 次 AI 请求，分析和两种聊天接口共享额度，失败请求也计入。此为单进程内存限流，重启会重置，不能代替订阅计费、全站成本上限或持久化用量统计。

本次仅完善部署配置和必要的发布保护。此前审查发现的多标签页覆盖、建议错位、报告快照和移动布局等问题仍需后续修复，不应把成功部署等同于已完成收费上线验收。
