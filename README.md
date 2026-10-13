# 物流运输履约控制塔 · AI 经营分析（MVP）

面向中小物流公司 / 货代 / 3PL / 贸易商的「控制塔」可视化产品。
深色科技风大屏 + 5 个可视化页面 + 4 个 AI 能力，开箱即用。

## 技术栈

- Vue 3 + TypeScript + Vite
- Element Plus（UI）+ 图标库
- ECharts 5（图表 + 中国地图）
- Vue Router 4 + Pinia
- DeepSeek / 通义千问（AI 能力）

## 快速开始

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # 生产构建 → dist/
```

## 配置 AI（页面内完成，零代码）

点击右上角「AI 设置」，填入 DeepSeek 或通义千问的 API Key 即可，**无需改代码、无需重新构建**。

- DeepSeek：https://platform.deepseek.com
- 通义千问：https://dashscope.aliyun.com

Key 仅保存在本机浏览器（localStorage）。未配置时看板可视化功能不受影响，AI 功能会提示引导配置。

## 功能清单

**5 个页面**：总览驾驶舱（含全国在途轨迹地图）、异常管理、承运商绩效、成本到服务、线路时效。

**4 个 AI**：异常归因、经营日报生成、承运商绩效点评、延迟风险预测。

## 项目结构

```
src/
├── main.ts / App.vue        # 入口 / 布局
├── router/                  # 5 个页面路由
├── types/                   # 数据模型（运单/承运商/线路/异常/KPI）
├── mock/                    # 真实感中文物流 mock 数据
├── api/                     # 数据访问层（接真实数据只改这里）
├── config/ai.config.ts      # AI 配置（页面配置优先，localStorage 持久化）
├── ai/insights.ts           # AI-2/3/4 的 prompt 与调用
├── utils/markdown.ts        # 极简 Markdown 渲染
├── composables/             # useECharts 等复用逻辑
├── components/              # StatCard / AISettingsDialog 等
├── assets/china.json        # 中国地图（省界 + 南海诸岛，合规数据源）
└── views/                   # 5 个页面
```

## 部署

见 [DEPLOY.md](./DEPLOY.md)，支持 Vercel / Netlify / 任意静态托管。

## 地图合规说明

地图数据已包含**省级区划、台湾省、南海诸岛（西沙/南沙/中沙/东沙群岛）及十段线（断续线）**，符合国家地图标准。

## 待办

- [ ] mock 数据替换为真实接口（改 `src/api/index.ts`）
- [ ] 上架平台（文案见 `商品页文案.md`）
