# 简跃 AI（ResumeLeap）求职辅助平台：项目开发与交接文档

> 文档版本：1.0  
> 更新日期：2026-07-12  
> 项目目录：`D:\4my-web\graduation-project`

## 1. 文档目的

本文档面向第一次接触本项目的开发者、测试人员、指导教师和后续维护人员，说明项目要解决的问题、业务流程、技术架构、数据模型、接口、环境配置、启动方式、已完成进度、开发中遇到的问题及优化方案。

读完本文档后，应能够：

- 理解项目的产品定位和核心业务闭环；
- 在本地正确启动前端、后端和 AI 服务；
- 知道各目录和代码层的职责；
- 理解用户、简历、岗位分析、版本、聊天和导出之间的关系；
- 根据统一规范继续开发接口和页面；
- 快速排查登录失败、跨域、AI 响应慢、SSE 不流式、布局溢出等常见问题；
- 了解项目当前完成度和上线前仍需补齐的能力。

---

## 2. 产品定位

### 2.1 项目名称

当前产品名称为“简跃 AI”，英文名为“ResumeLeap”，品牌主张是“让简历成为职业跃迁的起点”。产品定位为 AI 驱动的简历优化与求职辅助平台。

### 2.2 目标用户

- 应届毕业生；
- 有跳槽需求的职场用户；
- 需要针对不同岗位修改简历的求职者；
- 需要准备面试问题、梳理项目表达的开发者或其他专业人士。

### 2.3 核心问题

传统简历工具通常只解决“填写和排版”，但求职者还会遇到以下问题：

1. 不知道简历是否符合目标岗位；
2. 不清楚 JD 中的关键词是否被简历覆盖；
3. 项目经历描述笼统，缺少量化成果；
4. AI 给出建议后，修改过程不可追踪、不可回退；
5. 对不同岗位反复修改简历，容易丢失历史版本；
6. 面试准备与简历上下文脱节；
7. 最终简历缺少规范、稳定的 PDF 输出。

### 2.4 核心业务闭环

```text
注册/登录
  → 创建结构化简历
  → 录入目标岗位 JD
  → AI 分析简历与岗位匹配度
  → 查看优势、差距、关键词和改写建议
  → 选择性采纳 AI 建议
  → 自动保存修改前版本
  → 继续编辑或恢复历史版本
  → 选择模板并导出 PDF
  → 使用带简历上下文的 AI 助手准备面试
```

该闭环是项目最重要的设计基础。新增功能应优先服务这条链路，避免退化成通用聊天应用。

---

## 3. 当前完成进度

项目核心业务完成度约为 **75%–80%**。

### 3.1 已完成模块

| 模块 | 状态 | 主要能力 |
|---|---|---|
| 用户认证 | 已完成 | 注册、登录、JWT、密码哈希、路由鉴权 |
| 个人中心 | 已完成 | 显示名称、邮箱、城市、简介、修改密码 |
| 工作台 | 已完成 | 简历、分析、对话、导出的真实聚合统计 |
| 简历管理 | 已完成 | 创建、编辑、删除、结构化内容、实时预览 |
| 自动保存 | 已完成 | 1.2 秒防抖、并发保护、失败重试、离开提醒 |
| 岗位管理 | 已完成 | 公司、岗位、JD 的创建、读取、修改、删除 |
| AI 匹配分析 | 已完成 | 评分、优势、差距、关键词、改写建议、面试题 |
| 建议采纳 | 已完成 | 选择目标模块、一键写入、避免重复采纳 |
| 版本管理 | 已完成 | 自动快照、手动快照、备注、历史恢复 |
| AI 助手 | 已完成 | SSE 流式输出、历史会话、简历上下文、停止生成 |
| PDF 导出 | 已完成 | 两套 A4 模板、打印预览、导出记录 |
| 性能优化 | 已完成基础部分 | 按需导入、懒加载、索引、上下文裁剪、SSE 优化 |

### 3.2 尚未完成或需增强

- 正式数据库迁移工具，目前由启动代码进行兼容性建表和加列；
- 后端接口自动化测试、前端组件测试和端到端测试；
- Swagger/OpenAPI 接口文档；
- 服务端直接生成并保存 PDF 文件；
- 忘记密码、邮件验证、多设备登录管理；
- Refresh Token 或 HttpOnly Cookie 认证方案；
- AI Token、调用次数、费用和失败率统计；
- 分析任务异步队列；
- 简历模块拖拽排序和更多字段；
- Docker Compose、Nginx、HTTPS、日志轮转和自动备份；
- CI/CD 自动检查、测试和部署。

---

## 4. 技术栈

### 4.1 前端

| 技术 | 用途 |
|---|---|
| Vue 3 | 页面与组件开发，使用 Composition API |
| Vite 8 | 本地开发和生产构建 |
| Vue Router | 页面路由和登录守卫 |
| Pinia | 用户、Token 等全局状态管理 |
| Element Plus | 表单、按钮、输入、消息提示等 UI 组件 |
| Axios | 普通 REST API 请求 |
| Fetch + ReadableStream | SSE 流式聊天读取 |
| Sass | 登录页等局部复杂样式 |
| Prettier | 统一代码格式 |
| unplugin-auto-import | Element Plus API 按需导入 |
| unplugin-vue-components | Element Plus 组件按需导入 |

### 4.2 后端

| 技术 | 用途 |
|---|---|
| Node.js 20+ | JavaScript 服务端运行环境 |
| Express 5 | HTTP API 和中间件 |
| better-sqlite3 | SQLite 同步数据库访问 |
| bcryptjs | 密码哈希 |
| jsonwebtoken | JWT 签发和验证 |
| dotenv | 环境变量加载 |
| Axios | 调用火山方舟/豆包 API |
| express-rate-limit | 登录接口频率限制 |
| cors | 开发环境跨域控制 |

### 4.3 外部服务

- 火山方舟 Chat Completions API；
- 豆包模型接入点 Endpoint；
- SSE 流式传输。

### 4.4 数据库选择

当前使用 SQLite，适合毕业设计、单机演示和轻量部署：

- 无需单独安装数据库服务器；
- 数据存储在 `backend/database.db`；
- 支持事务、外键、索引和 JSON 函数；
- `better-sqlite3` 使用简单，适合当前访问规模。

如果未来需要多实例部署、高并发写入或在线多人服务，建议迁移 PostgreSQL。

---

## 5. 系统架构

### 5.1 整体架构

```text
浏览器
  │
  ├── Vue 3 前端（localhost:5173）
  │     ├── 页面和组件
  │     ├── Router 路由守卫
  │     ├── Pinia 登录状态
  │     ├── Axios REST 请求
  │     └── Fetch SSE 流读取
  │
  └── Express 后端（localhost:3000）
        ├── JWT 鉴权
        ├── 业务服务
        ├── SQLite 持久化
        └── 豆包 API 代理与流式转发
```

前端不直接持有豆包 API Key，所有模型调用必须经过后端，避免密钥泄露。

### 5.2 后端分层

```text
backend/
├── server.js                 # 启动入口
├── database.db              # SQLite 数据库
├── .env                     # 本地密钥，禁止提交
├── .env.example             # 环境变量模板
├── package.json
└── src/
    ├── app.js               # Express 应用和全局中间件
    ├── config/              # 环境配置
    ├── database/            # 数据库连接、建表与兼容升级
    ├── routes/              # URL 与中间件绑定
    ├── controllers/         # 请求解析和响应组织
    ├── services/            # 核心业务规则和事务
    ├── repositories/        # SQL 与数据访问
    ├── middleware/          # JWT、404、异常处理
    └── utils/               # 响应、异步包装、自定义错误
```

分层职责：

- `routes` 不写业务，只定义接口路径；
- `controllers` 不直接写复杂 SQL；
- `services` 处理权限之外的业务规则、事务和第三方调用；
- `repositories` 只负责数据库读写；
- `middleware` 处理跨接口通用行为。

### 5.3 前端结构

```text
frontend/src/
├── api/                     # Axios 实例和业务 API
├── assets/                  # 全局样式和静态资源
├── components/
│   ├── analysis/            # 分析报告组件
│   └── resume/              # 简历编辑、打印组件
├── layouts/                 # 登录后的统一应用布局
├── router/                  # 页面路由和守卫
├── stores/                  # Pinia 状态
├── views/                   # 页面级组件
├── App.vue
└── main.js
```

页面采用路由懒加载，Element Plus 采用按需导入，避免将完整 UI 库放入首屏包。

---

## 6. 环境配置与启动

### 6.1 环境要求

- Node.js `^20.19.0` 或 `>=22.12.0`；
- npm；
- 一个有效的火山方舟 API Key；
- 一个有效的豆包模型 Endpoint ID。

### 6.2 后端配置

复制 `backend/.env.example` 为 `backend/.env`：

```env
PORT=3000
CLIENT_ORIGIN=http://localhost:5173
DATABASE_PATH=database.db
JWT_SECRET=请替换为足够长的随机字符串
JWT_EXPIRES_IN=7d
DOUBAO_API_KEY=你的新APIKey
DOUBAO_MODEL_ENDPOINT=你的模型接入点ID
DOUBAO_CHAT_THINKING=disabled
DOUBAO_CHAT_MAX_TOKENS=1200
```

说明：

- `.env` 已加入 `.gitignore`，不可提交；
- API Key 一旦进入公开代码或聊天记录，应立即撤销并重新生成；
- 普通 AI 助手默认关闭深度思考以降低首字延迟；
- 岗位匹配分析使用独立分析服务，不因普通聊天配置而降低结构化分析质量；
- 生产环境必须使用强随机 `JWT_SECRET`。

### 6.3 前端配置

默认无需创建 `.env`，也可以复制 `.env.example`：

```env
VITE_API_BASE_URL=http://localhost:3000/api/v1
```

### 6.4 安装依赖

```powershell
cd D:\4my-web\graduation-project\backend
npm install

cd D:\4my-web\graduation-project\frontend
npm install
```

### 6.5 启动后端

```powershell
cd D:\4my-web\graduation-project\backend
npm run dev
```

终端应显示：

```text
Server running at http://localhost:3000
```

后端根路径 `/` 没有网页，因此访问 `http://localhost:3000/` 返回“接口不存在”是正常现象。健康检查地址是：

```text
http://localhost:3000/api/v1/health
```

### 6.6 启动前端

另开一个终端：

```powershell
cd D:\4my-web\graduation-project\frontend
npm run dev
```

浏览器访问：

```text
http://localhost:5173
```

### 6.7 生产构建

```powershell
cd frontend
npm run build
```

格式检查：

```powershell
npm run format:check
```

自动格式化：

```powershell
npm run format
```

---

## 7. 页面与业务模块

### 7.1 登录注册

路由：`/`

功能：

- 登录/注册模式切换；
- Element Plus 表单校验；
- 注册成功后直接建立登录会话；
- 登录成功后保存 JWT 和用户公开信息；
- 已登录用户访问登录页时跳转工作台。

安全规则：

- 密码使用 bcrypt 12 轮哈希；
- 旧数据库中的明文密码在首次正确登录后自动升级为哈希；
- 登录和注册接口 15 分钟最多 30 次请求；
- 后端从不向前端返回密码。

### 7.2 产品首页

路由：`/home`

登录后首先进入产品介绍和使用指引首页。首页展示平台价值、核心能力、三步业务流程，并根据用户已有的简历、分析和导出数量推荐下一步操作。

### 7.3 工作台

路由：`/dashboard`

展示真实聚合数据：

- 简历总数；
- 完整简历数量；
- 岗位分析次数；
- AI 对话数量；
- PDF 导出数量；
- 最近修改的简历。

统计由单个数据库聚合接口返回，而不是前端下载所有表后计算。

### 7.4 简历管理

路由：

- `/resumes`：简历列表；
- `/resumes/:id`：简历编辑器。

结构化字段：

```text
basics
├── name
├── phone
├── email
├── location
└── summary

education[]
experience[]
projects[]
skills[]
```

编辑器特性：

- 表单与简历预览同步；
- 自动判断草稿/完整状态；
- 停止输入约 1.2 秒后自动保存；
- 保存请求并发保护；
- 保存失败后保留脏状态并在 5 秒后重试；
- 未保存时刷新、关闭或切换路由会提醒；
- 可以手动保存；
- 可以创建带备注的重要版本快照。

### 7.5 岗位匹配

路由：

- `/analysis`：选择简历并录入 JD；
- `/analysis/:id`：结构化报告。

输入：

- 目标简历；
- 公司名称（可选）；
- 岗位名称；
- 完整 JD，至少 20 个字符。

输出：

- 0–100 匹配评分；
- 总体判断；
- 核心优势；
- 高、中、低优先级能力差距；
- 已匹配关键词；
- 缺失关键词；
- 简历分模块改写建议；
- 面试准备问题。

模型被要求输出 JSON。后端负责去除 Markdown 包裹、解析 JSON、限制数组长度并归一化字段，前端不直接信任模型原始输出。

### 7.6 建议采纳与版本管理

采纳流程：

```text
用户选择建议
  → 选择应用到个人简介/教育/工作/项目的具体位置
  → 开启 SQLite 事务
  → 保存修改前快照
  → 写入优化内容
  → 记录建议已采纳
  → 提交事务
```

如果任何一步失败，整次操作回滚。

版本来源：

- `ai_apply`：采纳 AI 建议前自动创建；
- `before_restore`：恢复历史版本前自动创建；
- `manual`：用户主动创建。

### 7.7 AI 助手

路由：`/chat`

功能：

- 新建、切换、删除会话；
- 刷新后恢复历史消息；
- 创建会话时选择一份简历作为上下文；
- 已开始的会话不允许中途切换简历，避免语义混乱；
- SSE 流式输出；
- 停止生成；
- 长回答在消息区域滚动，输入框固定在底部；
- 删除会话使用列表内二次确认，避免全局弹窗层级错乱。

上下文控制：

- 只发送最近 30 条消息；
- 简历上下文由服务端根据 `resume_id + user_id` 读取；
- 用户不能引用别人的简历；
- 普通聊天最大输出默认 1200 tokens。

### 7.8 PDF 导出

路由：

- `/exports`：导出中心；
- `/resumes/:id/print`：A4 打印预览。

模板：

- 经典专业；
- 现代简约。

导出方式：

1. 选择简历；
2. 选择模板；
3. 打开打印预览；
4. 点击“打印/保存 PDF”；
5. 浏览器中选择“另存为 PDF”；
6. 纸张选择 A4，建议开启背景图形并关闭浏览器页眉页脚。

工作、项目、教育条目使用 `break-inside: avoid`，减少跨页截断。

### 7.9 个人中心

路由：`/profile`

功能：

- 显示名称；
- 邮箱；
- 城市；
- 个人介绍；
- 注册日期；
- 修改密码。

新密码规则：8–72 位，同时包含字母和数字，且必须先验证当前密码。

---

## 8. 数据模型

### 8.1 users

存储用户身份和资料：

```text
id, username, password, display_name, email, bio, location,
created_at, updated_at
```

### 8.2 resumes

```text
id, user_id, title, content_json, status,
created_at, updated_at
```

简历主体采用 JSON 存储，便于扩展结构化模块。

### 8.3 resume_versions

```text
id, resume_id, user_id, version_number, title,
content_json, source, change_summary, created_at
```

同一简历的 `version_number` 唯一。

### 8.4 job_descriptions

```text
id, user_id, company, position, content,
created_at, updated_at
```

### 8.5 resume_analyses

```text
id, user_id, resume_id, job_description_id,
status, result_json, model, duration_ms, created_at
```

### 8.6 analysis_suggestion_actions

记录某条建议是否被采纳，以及应用位置和采纳前版本：

```text
analysis_id, suggestion_index, resume_id, user_id,
target_path, version_id, created_at
```

### 8.7 chat_sessions / chat_messages

```text
chat_sessions:
id, user_id, resume_id, title, created_at, updated_at

chat_messages:
id, session_id, role, content, created_at
```

### 8.8 export_records

```text
id, user_id, resume_id, template, format, created_at
```

当前只记录导出行为，没有保存实际 PDF 文件。

### 8.9 外键与索引

数据库启用了：

```sql
PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;
```

关键索引覆盖：

- 用户简历更新时间；
- 用户岗位更新时间；
- 用户分析创建时间；
- 简历版本创建时间；
- 用户导出时间；
- 用户会话更新时间；
- 会话消息顺序。

---

## 9. API 设计

统一前缀：

```text
http://localhost:3000/api/v1
```

除健康检查、登录和注册外，其他接口都需要：

```http
Authorization: Bearer <token>
```

### 9.1 统一响应

成功：

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

失败：

```json
{
  "success": false,
  "data": null,
  "message": "错误描述",
  "code": "ERROR_CODE"
}
```

### 9.2 接口清单

#### 系统与认证

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/health` | 健康检查 |
| POST | `/auth/register` | 注册 |
| POST | `/auth/login` | 登录 |
| GET | `/users/me` | 当前用户 |
| PATCH | `/users/me` | 更新资料 |
| POST | `/users/me/password` | 修改密码 |

#### 简历与版本

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/resumes` | 简历列表 |
| POST | `/resumes` | 创建简历 |
| GET | `/resumes/:id` | 简历详情 |
| PATCH | `/resumes/:id` | 保存简历 |
| DELETE | `/resumes/:id` | 删除简历 |
| GET | `/resumes/:id/versions` | 版本列表 |
| POST | `/resumes/:id/versions` | 手动创建版本 |
| POST | `/resumes/:id/versions/:versionId/restore` | 恢复版本 |

#### 岗位与分析

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/jobs` | 岗位列表 |
| POST | `/jobs` | 创建岗位 |
| GET | `/jobs/:id` | 岗位详情 |
| PATCH | `/jobs/:id` | 更新岗位 |
| DELETE | `/jobs/:id` | 删除岗位 |
| GET | `/analyses` | 分析历史 |
| POST | `/analyses` | 执行 AI 分析 |
| GET | `/analyses/:id` | 报告详情 |
| POST | `/analyses/:id/apply` | 采纳建议 |

#### 聊天

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/chat/sessions` | 会话列表 |
| POST | `/chat/sessions` | 创建会话 |
| GET | `/chat/sessions/:id` | 会话和消息 |
| DELETE | `/chat/sessions/:id` | 删除会话 |
| POST | `/chat/sessions/:id/messages` | 发送消息，SSE 返回 |

`/chat/stream` 是早期兼容接口，新功能应优先使用持久化会话接口。

#### 其他

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/exports` | 导出历史 |
| POST | `/exports` | 创建导出记录 |
| GET | `/dashboard` | 工作台聚合数据 |

---

## 10. 身份认证与权限

### 10.1 登录流程

```text
用户名/密码
  → 后端查找用户
  → bcrypt 比较密码
  → 签发 JWT
  → 前端保存 access_token
  → Axios 请求拦截器添加 Bearer Token
```

### 10.2 路由守卫

- `requiresAuth`：没有 Token 时跳转登录页；
- `guestOnly`：已登录访问登录页时跳转工作台。

### 10.3 Token 失效

Axios 收到 401 时：

1. 清除 Token；
2. 清除缓存用户；
3. 触发未授权事件；
4. 跳转登录页。

### 10.4 数据隔离

所有用户业务查询必须包含 `user_id`，例如：

```sql
SELECT * FROM resumes WHERE id = ? AND user_id = ?;
```

不能只根据业务 ID 查询后再相信前端传入的用户信息。

---

## 11. AI 接入与流式响应

### 11.1 为什么由后端代理

- 不暴露 API Key；
- 统一 Prompt 和模型参数；
- 注入服务端校验过的简历上下文；
- 控制长度、频率、超时和成本；
- 保存会话消息；
- 未来可以替换模型供应商。

### 11.2 SSE 链路

```text
Vue Fetch
  → Express SSE 接口
  → Axios 请求豆包 stream=true
  → 豆包 SSE 分块
  → Express res.write 原样转发
  → 浏览器 ReadableStream
  → TextDecoder
  → 按 data: 行解析 JSON
  → 追加 delta.content
```

### 11.3 已实施的低延迟配置

后端：

- 立即设置并刷新 SSE 响应头；
- `Cache-Control: no-cache, no-transform`；
- `X-Accel-Buffering: no`；
- `socket.setNoDelay(true)`；
- 每 10 秒发送心跳；
- 客户端断开时关闭上游连接。

前端：

- 使用 `reactive` 助手消息对象，保证每个分块触发渲染；
- 不重复创建空助手气泡和 loading 气泡；
- `AbortController` 支持停止生成；
- 消息区域独立滚动；
- 输入框固定在可视区域底部。

### 11.4 实际性能验证

普通聊天关闭深度思考后，最小测试曾测得：

```text
首个可见文字约 1.4 秒
22 个流式分块
回答长度约 326 字符
```

具体时间仍受网络、模型负载、Prompt 长度和简历上下文大小影响。

---

## 12. 关键问题与解决记录

### 12.1 后端根路径显示“接口不存在”

现象：访问 `http://localhost:3000/` 返回 404 JSON。

原因：后端是 API 服务，没有定义网页首页。

解决：

- 后端状态访问 `/api/v1/health`；
- 用户页面访问 `http://localhost:5173`。

### 12.2 API Key 暴露

早期问题：Key 直接写在 `server.js`。

风险：代码提交或分享后任何人可调用并产生费用。

解决：

- 撤销旧 Key；
- 重新生成；
- 移到 `.env`；
- `.env` 加入 `.gitignore`；
- 浏览器只调用本地后端。

### 12.3 密码明文存储

解决：

- 新密码使用 bcrypt 12 轮哈希；
- 旧账号第一次正确登录时自动升级；
- 查询和响应永不返回密码。

### 12.4 前后端跨域与地址混淆

开发端口：

```text
前端 5173
后端 3000
```

解决：

- 后端 CORS 只允许 `CLIENT_ORIGIN`；
- 前端统一通过 `VITE_API_BASE_URL`；
- 不在每个页面重复写 `http://localhost:3000`。

### 12.5 AI 回答等待很久后一次性显示

原因组合：

1. Vue 数组中的普通原始对象被持续修改，不能稳定逐分块刷新；
2. 后端在上游连接完成后才发送响应头；
3. 深度思考产生大量推理分块，但页面只显示最终内容；
4. 中间代理可能缓冲 SSE。

解决：

- 助手消息改为 `reactive`；
- 后端立即 `flushHeaders()`；
- 禁止缓冲，开启 `NoDelay`；
- 普通聊天设置 `thinking.type=disabled`；
- 模型不支持该参数时自动去掉参数重试；
- 限制普通回答最大 tokens。

### 12.6 长回答后输入框消失

原因：嵌套 Flex 容器缺少 `min-height: 0`，并使用 `calc(100vh - ...)` 推算高度，内容把整个聊天窗口撑出视口。

解决：

- 聊天窗口使用视口四边固定约束；
- `conversation` 和 `messages` 设置 `min-height: 0`；
- 只有消息区域允许纵向滚动；
- footer 固定占据底部空间；
- 长文本使用安全换行。

### 12.7 删除对话提示出现在页面背景

原因：Element Plus 全局 MessageBox Teleport 到根节点，与固定聊天窗口产生层级错位。

解决：改成会话列表内部二次确认，提示、取消和删除都限制在当前会话行。

### 12.8 岗位分析按钮一直禁用

原因：按钮依赖已选简历、岗位名和至少 20 字 JD，但页面没有显示缺失条件。

解决：

- 按钮保持可点击；
- 实时显示缺失项；
- 点击后给出具体提示；
- 信息完整后显示可分析状态。

### 12.9 简历修改丢失风险

解决：

- 1.2 秒防抖自动保存；
- 请求并发保护；
- 保存期间再次修改会进入下一轮；
- 失败后 5 秒重试；
- 未保存离开提醒；
- AI 修改和版本恢复前自动快照。

### 12.10 前端包体过大

早期 Element Plus 全量注册导致主入口 JS 约 915 KB，CSS 约 363 KB。

解决：

- Element Plus 按需自动导入；
- 页面懒加载；
- 业务 API 拆分；
- 构建后不再出现原有超大入口包警告。

---

## 13. 性能设计

### 13.1 前端

- 路由级懒加载；
- Element Plus 按需导入；
- 自动保存防抖；
- SSE 增量渲染；
- 页面内状态局部更新；
- AI 报告持久化，重新查看不重新调用模型。

### 13.2 后端

- SQLite WAL 模式；
- 高频排序字段建立索引；
- 工作台使用单次聚合查询；
- 聊天只读取最近 30 条消息；
- 分析历史和导出历史限制返回数量；
- 请求体限制 1 MB；
- AI 请求设置超时；
- 普通聊天限制输出长度。

### 13.3 AI 成本

- 报告保存后复用；
- 不重复分析历史报告；
- 聊天上下文裁剪；
- 停止生成时关闭上游连接；
- 普通问答关闭深度思考；
- 复杂岗位分析保留较高质量设置。

---

## 14. 安全设计

已完成：

- API Key 环境变量；
- bcrypt 密码；
- JWT 鉴权；
- 用户级数据隔离；
- 登录限流；
- 参数长度限制；
- CORS 来源限制；
- 统一错误响应；
- 不返回密码；
- AI 输入角色白名单；
- 简历目标路径白名单；
- SQLite 事务保护建议采纳与恢复。

上线前建议：

- JWT 改为短时 Access Token + Refresh Token；
- 或改用 Secure、HttpOnly、SameSite Cookie；
- 增加 CSRF 保护；
- 使用 HTTPS；
- 增加 Helmet 安全响应头；
- 生产环境按用户和 IP 对 AI 接口限流；
- 增加审计日志；
- 上传文件时做 MIME、大小和病毒检查；
- 对个人敏感信息增加明确提示。

---

## 15. 测试与验证情况

开发期间已进行的关键联调：

- 注册、登录、JWT 用户接口；
- bcrypt 哈希确认；
- 旧明文密码升级；
- 简历创建、查询、修改、删除；
- 岗位创建与分析报告存储；
- 真实豆包结构化分析；
- 建议采纳、版本快照和恢复事务；
- 导出记录创建与查询；
- PDF 样例 A4 渲染和视觉检查；
- 聊天 SSE 流式分块和消息持久化；
- 首个可见文字延迟测试；
- 个人资料更新和新密码登录；
- 手动版本快照；
- 多次前端生产构建。

测试使用的临时用户和数据在测试后已清理。

目前主要不足是测试尚未固化为自动化测试文件。后续建议：

```text
backend/test/
├── auth.test.js
├── resumes.test.js
├── versions.test.js
└── permissions.test.js

frontend/e2e/
├── auth.spec.js
├── resume-flow.spec.js
└── analysis-flow.spec.js
```

---

## 16. 常见故障排查

### 16.1 前端打不开

检查：

```powershell
cd frontend
npm run dev
```

确认访问 `http://localhost:5173`，而不是 3000。

### 16.2 接口请求失败

检查：

1. 后端终端是否运行；
2. `/api/v1/health` 是否成功；
3. 前端 `VITE_API_BASE_URL` 是否正确；
4. 浏览器 Network 中状态码；
5. Token 是否存在；
6. CORS 的 `CLIENT_ORIGIN` 是否匹配前端地址。

### 16.3 登录后立即跳回登录页

可能原因：

- JWT Secret 被修改，旧 Token 全部失效；
- Token 过期；
- 后端没有读取正确 `.env`；
- 请求未携带 `Authorization`。

处理：退出后重新登录，确认前后端环境配置一致。

### 16.4 AI 聊天提示未配置

检查：

```env
DOUBAO_API_KEY=
DOUBAO_MODEL_ENDPOINT=
```

填入有效值并重启后端。不要在前端或代码中填写 Key。

### 16.5 AI 请求慢

检查：

- 是否重启后端加载最新配置；
- `DOUBAO_CHAT_THINKING` 是否为 `disabled`；
- 简历上下文是否过大；
- Endpoint 使用的模型是否为推理模型；
- 火山方舟控制台是否限流；
- Network 中是否持续收到 SSE 分块。

### 16.6 AI 一次性显示整段内容

检查响应头：

```text
Content-Type: text/event-stream
Cache-Control: no-cache, no-transform
X-Accel-Buffering: no
```

如果经过 Nginx，应关闭该路径的代理缓冲。

### 16.7 修改 `.env` 后没有效果

环境变量只在进程启动时读取，必须重启后端：

```powershell
Ctrl + C
npm run dev
```

### 16.8 数据库字段不存在

先重启后端，让 `initializeDatabase()` 执行。不要随意删除用户真实的 `database.db`。

### 16.9 中文在终端显示乱码

部分 Windows PowerShell 输出编码可能与 UTF-8 不一致。浏览器正常不代表终端一定正常。建议：

- VS Code 文件统一保存为 UTF-8；
- 新终端使用 UTF-8；
- 不要根据乱码输出批量覆盖源码；
- 修改后运行生产构建确认 Vue 模板仍能解析。

---

## 17. 开发规范

### 17.1 新增后端业务

推荐顺序：

```text
数据库表/索引
→ repository
→ service
→ controller
→ route
→ 接口联调
```

规则：

- 用户数据必须带 `user_id`；
- 参数在 service 层规范化和校验；
- 多表写入使用事务；
- 第三方错误不要原样暴露给前端；
- controller 使用统一 `success()`；
- 异步 controller 使用 `asyncHandler()`。

### 17.2 新增前端页面

推荐顺序：

```text
api 模块
→ 页面状态与接口
→ 路由
→ AppLayout 导航
→ 加载/空/错误状态
→ 响应式样式
→ npm run build
```

规则：

- 不在页面散落完整后端 URL；
- 不直接操作 Token；
- 不全量引入 Element Plus；
- 大页面继续拆分业务组件；
- 异步操作必须有 loading 和错误反馈；
- 删除、恢复等高风险操作需要二次确认；
- 长文本必须考虑换行、滚动和移动端布局。

### 17.3 命名和格式

- Vue 组件使用 PascalCase；
- API、store、工具文件使用小写或语义命名；
- 数据库使用 snake_case；
- JavaScript 业务对象使用 camelCase；
- 提交前执行 `npm run format:check` 和 `npm run build`。

---

## 18. 后续开发路线

### 阶段一：工程稳定性

1. 引入正式 migration 工具；
2. 后端接口测试；
3. Playwright 核心流程；
4. 404、500 和网络异常页面；
5. Swagger/OpenAPI；
6. 统一日志。

### 阶段二：产品增强

1. 简历模块拖拽排序；
2. 求职意向、证书、奖项、网站等字段；
3. AI 单模块润色；
4. 建议采纳前后 Diff；
5. 模拟面试与评分报告；
6. 服务端 PDF 文件生成和下载。

### 阶段三：上线能力

1. PostgreSQL；
2. Redis 与任务队列；
3. Docker Compose；
4. Nginx 和 HTTPS；
5. AI 用量、成本和配额；
6. 日志、监控和备份；
7. CI/CD。

---

## 19. 交接检查清单

新开发者接手时，应完成：

- [ ] 安装正确 Node.js 版本；
- [ ] 前后端分别执行 `npm install`；
- [ ] 创建后端 `.env`；
- [ ] 使用自己的有效 API Key 和 Endpoint；
- [ ] 启动后端并访问 health；
- [ ] 启动前端并完成注册；
- [ ] 创建一份测试简历；
- [ ] 完成一次岗位分析；
- [ ] 采纳建议并恢复版本；
- [ ] 完成一次 AI 流式对话；
- [ ] 打印预览 PDF；
- [ ] 执行前端生产构建；
- [ ] 确认 `.env` 未进入版本控制。

---

## 20. 总结

本项目目前已具备真实 AI 求职产品的主要业务骨架，而不是简单的聊天 Demo。关键设计原则是：

1. 以“简历—岗位—分析—修改—版本—导出”为主业务；
2. AI 输出必须结构化、可验证、可采纳；
3. AI 修改必须可追踪和可恢复；
4. 所有用户数据必须隔离；
5. API Key 和模型调用必须留在服务端；
6. 普通聊天追求低延迟，复杂分析追求质量；
7. UI 必须同时覆盖加载、空、错误、长文本和响应式场景；
8. 继续开发时优先补测试、迁移和部署能力，再扩展大型功能。

按照本文档的目录、接口和业务规则，新成员可以在不破坏现有闭环的前提下继续维护和扩展项目。
