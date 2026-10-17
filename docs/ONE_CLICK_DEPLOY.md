# 一键发布

网站：<https://octopush5.com>。仓库：<https://github.com/lovsc/JianYue-AI>。

## 日常操作

1. 本地修改、测试，然后将代码提交并推送到 `main`。
2. 打开仓库「Actions → 发布到正式网站 → Run workflow」。
3. 分支保持 `main`，点击运行。成功后打开网站；发布结果和提交版本显示在运行摘要里。

工作流入口：<https://github.com/lovsc/JianYue-AI/actions/workflows/deploy.yml>。

普通推送仅触发「项目检查」，不会修改线上网站。正式发布只由 `workflow_dispatch` 手动触发，并限制为 `main`，同一时间只允许一个发布运行。启动手动工作流需要仓库写权限，参见 [GitHub 官方说明](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/manually-run-a-workflow)。

## 首次设置（仅一次）

服务器需要安装本仓库 `deploy/bootstrap-ci.sh` 提供的初始化配置，并授权专用公钥。初始化命令固定到已验证的完整提交 SHA；脚本下载同一提交的文件并校验 SHA-256。部署者通过宝塔终端以 root 执行这一次初始化。

脚本创建 `jianyue-deploy` 专用系统账号。该账号的 SSH 公钥使用 forced-command，仅允许向本项目提交部署包，禁止交互式 shell、端口转发及代理转发。sudo 仅允许调用一个 root 所有的发布程序；该程序校验提交 SHA、包哈希、路径和文件类型，依赖安装及应用代码以 `www` 运行。

GitHub 需要加密保存配套的专用私钥。进入：

<https://github.com/lovsc/JianYue-AI/settings/secrets/actions/new>

- Name：`JY_DEPLOY_SSH_KEY`
- Secret：本次生成的专用 Ed25519 私钥全文（含首尾行）

私钥仅填入 GitHub 的 Secret 输入框，不提交仓库、不发送到聊天或截图。支持放在仓库 Secret 或 `production` 环境 Secret 中；GitHub 会按 [Secrets 规则](https://docs.github.com/en/actions/reference/security/secrets)读取。服务器仅安装对应公钥，豆包密钥和 JWT 密钥仍只保存在服务器上。

完成设置后手动发布一次，并确认最后的公网版本检查通过，才能认定整条流程已启用。代码检查成功不等于服务器授权和发布成功。

## 发布过程

1. 在 GitHub 托管的 Linux Runner 上安装锁定依赖，运行后端测试和发布脚本测试。
2. 构建 Vue，并打包白名单内的源码、构建产物和 `release.json`，不包含本地 `.env`、数据库、Git 历史或 `node_modules`。
3. 通过固定服务器指纹的 SSH 连接，将压缩包流式传给受限部署程序；不使用 root 的 SSH 密钥。
4. 服务器验证提交 SHA、SHA-256、体积和成员路径，拒绝软链接、越界路径和用户数据文件。
5. 在独立版本目录安装 Linux 依赖。复制线上数据库的快照，用副本和临时本机端口预检新应用，不对生产数据库执行预检迁移。
6. 预检成功后进入短暂维护状态，停止旧服务并备份数据库，再原子切换版本链接，启动新服务并检查本机与 HTTPS 域名上的提交 SHA。
7. 成功后恢复写入。失败则停掉新服务，恢复旧版本链接与停机快照，再启动旧服务。工作流显示失败，并保留排查文件。

维护期间写入请求返回 `503` 和 `Retry-After`。发布会有短暂服务重启，不是零停机方案。数据库停机备份后，新代码的维护检查阻止写入，避免失败回滚时覆盖这段时间的新用户数据。

如果旧服务恢复后的健康检查也失败，发布程序会保留维护标记以保护数据，工作流显示失败，需要管理员检查后再恢复写入。发布过程中不要强制取消正在进行的更新。

## 服务器目录

| 路径 | 用途 |
| --- | --- |
| `/www/wwwroot/jianyue` | 指向当前版本的链接，原 systemd 服务入口保持不变 |
| `/www/jianyue-releases` | 独立应用版本、初始化前的 bootstrap 版本及发布锁 |
| `/www/jianyue-data/resume.db` | 持久化数据库 |
| `/www/jianyue-data/production.env` | 私有运行配置，后续版本使用链接读取 |
| `/www/backup/jianyue-ci` | 发布快照、失败版本数据库及部署记录，root 私有 |
| `/usr/local/libexec/jianyue-deploy.py` | root 所有的发布程序 |
| `/usr/local/sbin/jianyue-ci-gateway` | SSH forced-command 入口 |
| `/etc/sudoers.d/jianyue-deploy` | 专用账号的单程序授权 |

Nginx、域名、证书及原站点备份不随每次发布重建。不要为同一个项目再创建一份 PM2 或宝塔 Node 进程。

发布程序不会自动删除历史版本和数据库快照。维护时应定期检查磁盘占用，确认可恢复后再清理不用的历史目录。不要删除当前版本、私有配置或用户数据库。

## 边界

服务器授权及 GitHub Secret 设置完成前，按钮中的发布步骤会失败并说明缺少配置。分支保护、审批人和私钥轮换可在后续补充。此前审查出的产品问题不因加入 CI/CD 而自动解决。
