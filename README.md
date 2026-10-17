# 简跃 AI（ResumeLeap）

让简历成为职业跃迁的起点。

简跃 AI 是一个覆盖结构化简历、岗位匹配、AI 优化、版本管理、求职对话和 PDF 导出的全流程求职辅助平台。

## 技术栈

- 前端：Vue 3、Vite、Pinia、Vue Router、Element Plus
- 后端：Node.js、Express、JWT、SSE
- 数据库：SQLite、better-sqlite3
- AI：火山方舟/豆包 Chat Completions API

## 本地启动

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

```bash
cd frontend
npm install
npm run dev
```

前端默认运行于 `http://localhost:5173`，后端健康检查为 `http://localhost:3000/api/v1/health`。

完整的业务、架构、接口和故障排查说明请阅读 [项目开发与交接文档](docs/PROJECT_DEVELOPMENT.md)。

## 服务器部署

阿里云与宝塔部署说明见 [部署文档](docs/DEPLOYMENT_BAOTA.md)。本地执行 `node scripts/package-release.mjs` 可构建不含密钥、用户数据库和本机依赖的发布包，输出到 D 盘项目的 `tmp/releases/`。

后续更新使用 [一键发布流程](docs/ONE_CLICK_DEPLOY.md)：推送代码只运行检查，正式上线由 GitHub Actions 手动触发。

## 安全提醒

不要提交 `.env`、API Key、JWT Secret、SQLite 数据库或用户生成文件。仓库仅保留 `.env.example` 作为配置模板。
