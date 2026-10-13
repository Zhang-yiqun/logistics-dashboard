# 部署文档 · 物流运输履约控制塔

纯前端项目（Vue 3 + Vite），无需后端服务器。AI 调用由浏览器直接请求 DeepSeek / 通义千问 API（两者均支持 CORS），因此可部署到任意静态托管平台。

---

## 1. 环境要求

| 项 | 要求 |
|---|---|
| Node.js | ≥ 18（推荐 20 / 22） |
| 包管理器 | npm / pnpm / yarn |

> ⚠️ Windows 注意：若 `npm install` 时 esbuild 报 `spawnSync EBUSY` 或 `@esbuild/win32-x64 could not be found`，本项目已在 `devDependencies` 里固定了 `@esbuild/win32-x64`，通常不会遇到。若仍报错，手动执行：
> `npm install @esbuild/win32-x64@0.21.5 --save-dev`

---

## 2. 本地运行

```bash
npm install
npm run dev        # 开发服务器 http://localhost:5173
```

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
3. 框架自动识别为 Vite，或手动填写：
   - **Build Command**：`npm run build`
   - **Output Directory**：`dist`
4. Deploy 完成即获得线上地址

### 方式 B：Netlify

1. 在 [netlify.com](https://netlify.com) 导入仓库
2. 构建命令 `npm run build`，发布目录 `dist`

### 方式 C：任意静态托管（Nginx / OSS / GitHub Pages）

构建后把 `dist/` 目录整体上传即可。注意两点：

1. **SPA 路由**：本项目用 history 路由，需把 404 重定向到 `index.html`。
   - Nginx：`try_files $uri $uri/ /index.html;`
   - OSS / GitHub Pages：需配置默认首页 `index.html` 与错误页回退。

2. 若部署在子路径（如 `https://x.com/app/`），需在 `vite.config.ts` 加 `base: '/app/'` 后重新构建。

---

## 5. AI Key 配置（买家视角，零代码）

买家**无需改代码、无需重新构建**，在页面右上角「AI 设置」里填入 Key 即可：

- DeepSeek：https://platform.deepseek.com 申请，填 `API Key` 即可
- 通义千问：https://dashscope.aliyun.com 申请，填 `API Key` 即可

Key 仅保存在用户浏览器本地（localStorage），不会上传到任何服务器。

---

## 6. 地图数据与合规说明

- 地图边界数据采用合规数据源，已包含 **省级区划、台湾省、南海诸岛（西沙/南沙/中沙/东沙群岛）及十段线（断续线）**，符合国家地图标准。
- AI 跨域已实测：DeepSeek 与通义千问的 API 均支持浏览器 CORS 直接调用，无需后端代理。

---

## 7. 常见问题

| 问题 | 解决 |
|---|---|
| AI 调用失败 / HTTP 401 | Key 无效或余额不足，重新在「AI 设置」里填写 |
| 地图不显示 | 确认 `src/assets/china.json` 存在且未被 git 忽略 |
| 部署后刷新页面 404 | 按「方式 C」配置 SPA 回退 |
