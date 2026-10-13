# 部署文档 · 物流运输履约控制塔

Vue 3 + Vite 前端项目。AI 能力有两种工作模式，**自动切换**：

| 模式 | 触发条件 | Key 存放位置 | 适用场景 |
|---|---|---|---|
| **代理模式** | 部署环境配置了服务端环境变量 | 服务端（不下发浏览器） | 对外演示站，访客开箱即用 |
| **自带 Key 模式** | 用户在页面「AI 设置」填入 | 浏览器 localStorage | 买家自用、本地开发 |

> 项目内置 `api/chat.js`（Vercel Serverless Function）作为 AI 代理。若部署到不支持 Serverless 的平台（如纯静态 OSS），会自动降级为「自带 Key 模式」，功能不受影响。

---

## 1. 环境要求

| 项 | 要求 |
|---|---|
| Node.js | ≥ 18（推荐 20 / 22） |
| 包管理器 | npm / pnpm / yarn |

> ⚠️ **重要**：本项目**不提交 `package-lock.json`**（已在 `.gitignore` 忽略）。
> 原因：Windows 生成的 lock 会固化 `@esbuild/win32-x64` 顶级条目，导致 Linux 构建环境（Vercel）报 `EBADPLATFORM`。交由构建环境现场解析依赖可彻底规避跨平台问题。

---

## 2. 本地运行

```bash
npm install
npm run dev        # 开发服务器 http://localhost:5173
```

> Windows 本地若 `npm install` 时 esbuild 报 `spawnSync EBUSY`，是文件被占用的偶发问题，重试即可；或改用系统 Node 执行。

## 3. 生产构建

```bash
npm run build      # 产物输出到 dist/
npm run preview    # 本地预览产物
```

---

## 4. 部署方式

### 方式 A：Vercel（推荐，一键）

1. 把项目推送到 GitHub / GitLab 仓库
2. 在 [vercel.com](https://vercel.com) 导入该仓库
3. 框架自动识别为 Vite（项目已含 `vercel.json`，无需手工填构建参数）
4. **配置 AI 代理环境变量**（见下方第 5 节）
5. Deploy 完成即获得线上地址

### 方式 B：Netlify

1. 在 [netlify.com](https://netlify.com) 导入仓库
2. 构建命令 `npm run build`，发布目录 `dist`
3. 如需 AI 演示，把 `api/chat.js` 改写成 Netlify Function（放在 `netlify/functions/` 下）

### 方式 C：任意静态托管（Nginx / OSS / GitHub Pages）

构建后把 `dist/` 目录整体上传即可。注意：

1. **SPA 路由**：本项目用 history 路由，需把 404 重定向到 `index.html`。
   - Nginx：`try_files $uri $uri/ /index.html;`
   - OSS / GitHub Pages：需配置默认首页 `index.html` 与错误页回退。
2. **无 Serverless 支持** → 自动降级为「自带 Key 模式」，访客需自己填 Key 才能用 AI。
3. 若部署在子路径（如 `https://x.com/app/`），需在 `vite.config.ts` 加 `base: '/app/'` 后重新构建。

---

## 5. AI 代理配置（部署者视角）

> 仅 Vercel 部署需要。目的是让**访客打开演示就能看到 AI 效果**，同时 Key 不会泄露。

在 Vercel 项目 **Settings → Environment Variables** 添加：

| 变量名 | 是否必填 | 说明 |
|---|---|---|
| `AI_API_KEY` | **必填** | 你的真实 Key。**切勿加 `VITE_` 前缀**，否则会被编译进前端产物泄露 |
| `AI_PROVIDER` | 可选 | `deepseek`（默认）或 `qwen` |
| `AI_BASE_URL` | 可选 | 覆盖默认 API 端点 |
| `AI_MODEL` | 可选 | 覆盖默认模型名 |

配置后 **Redeploy** 一次生效。

**内置防护**：代理函数已做限流（每 IP 每分钟 6 次）+ 请求规模上限（12000 字符），可挡住普通爬虫与滥用。如需更强防护，可在 `api/chat.js` 中接入 Upstash Redis 做分布式限流。

**成本控制建议**：演示站建议用额度较小的 Key（如 DeepSeek 充 10-20 元即可支撑很久），并定期在服务商后台查看用量。

---

## 6. AI Key 配置（买家视角，零代码）

买家**无需改代码、无需重新构建**，在页面右上角「AI 设置」里填入 Key 即可（会覆盖演示代理，用自己的额度）：

- DeepSeek：https://platform.deepseek.com 申请
- 通义千问：https://dashscope.aliyun.com 申请

Key 仅保存在用户浏览器本地（localStorage），不会上传到任何服务器。

---

## 7. 地图数据与合规说明

- 地图边界数据采用合规数据源，已包含 **省级区划、台湾省、南海诸岛（西沙/南沙/中沙/东沙群岛）及十段线（断续线）**，符合国家地图标准。
- **自带 Key 模式**下浏览器直连 DeepSeek / 通义千问（两者均支持 CORS），无需后端。
- **代理模式**下前端只请求同源 `/api/chat`，无跨域问题。

---

## 8. 常见问题

| 问题 | 解决 |
|---|---|
| Vercel 构建报 `EBADPLATFORM @esbuild/win32-x64` | 确认仓库中**没有** `package-lock.json`（本项目已 gitignore） |
| 演示站 AI 点击无反应，提示"尚未配置 AI 服务" | Vercel 未配 `AI_API_KEY`，或配了 `VITE_` 前缀（改回 `AI_API_KEY`）后未 Redeploy |
| AI 提示"请求过于频繁" | 触发了限流（每 IP 每分钟 6 次），等 1 分钟 |
| AI 调用失败 / HTTP 401 | Key 无效或余额不足 |
| 地图不显示 | 确认 `src/assets/china.json` 存在且未被 git 忽略 |
| 部署后刷新页面 404 | 按「方式 C」配置 SPA 回退（Vercel 已由 `vercel.json` 处理） |
