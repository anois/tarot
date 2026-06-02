# 塔罗 · 3D 在线占卜

一个**纯前端、无后端**的塔罗占卜网页：用 react-three-fiber 实现 3D 洗牌 / 浏览 / **用户自行抽牌** / 落位 / 翻牌；内置公版 Rider‑Waite‑Smith 78 张牌；通过 **BYOK**（自带大模型密钥）在浏览器中直连大模型，把「问题 + 牌阵 + 抽到的牌（含正逆位）+ 牌义」打包成结构化上下文请求解读。界面与解读以中文为主。

## 特性

- **3D 牌桌**：crypto 级 Fisher‑Yates 洗牌动画 → 78 张牌扇形展开 → 用户点选抽牌 → 牌飞向牌阵位置并翻面（逆位牌旋转 180°）。
- **牌阵**：内置 6 种（单张 / 三张 / 关系 / 马蹄 / 凯尔特十字 / 年度之轮）+ JSON 导入导出 + **可视化拖拽编辑器**。
- **大模型解读（BYOK）**：OpenAI 兼容客户端，默认 DeepSeek（浏览器可直连），OpenRouter 一键回退；支持 4 种模板（结构化 / 叙事 / 速答 / 深入追问），SSE 流式渲染 Markdown。
- **本地历史**：每次带解读的占卜自动保存到 IndexedDB，可回看、导出 / 导入分享。

## 开发

```bash
pnpm install
pnpm dev        # 启动开发服务器
pnpm test       # 运行单元测试（vitest）
pnpm lint       # ESLint
pnpm build      # 类型检查 + 生产构建
pnpm preview    # 预览构建产物
```

### 大模型密钥（BYOK）

- 生产环境严格 BYOK：用户在「设置」中填入**自己的**密钥，仅保存在浏览器（默认仅内存；可选 session / localStorage），直接发往所选服务商，**绝不经过任何后端**。
- 本地开发便利：在 `.env` 中设置 `VITE_DEV_LLM_API_KEY` / `VITE_DEV_LLM_BASE_URL` / `VITE_DEV_LLM_MODEL`（见 `.env.example`），仅在 `pnpm dev` 时预填密钥框；该值**不会**被打进生产 bundle（受 `import.meta.env.DEV` 死代码消除保护）。
- 服务商：DeepSeek（推荐，实测浏览器可直连）、OpenRouter（通配 CORS，回退/多模型）、Anthropic（需特殊浏览器直连头）、自定义（OpenAI 兼容）。OpenAI 直连被浏览器拦截，请走 OpenRouter 或代理。

## 牌面素材与版权

- `public/deck/` 为 Rider‑Waite‑Smith 78 张牌面（美国公有领域）。当前取自 `metabismuth/tarot-json`。
- ⚠ 公开部署前请核实素材为 **1909 原版**（而非仍受版权的 1971 U.S. Games 重上色版），或替换为确认 1909 / CC0 的素材；`imageKey↔文件名` 映射稳定，可直接替换。详见 `public/deck/LICENSE.txt`。
- 牌义数据：`dariusk/corpora`（CC0）。
- 「Rider‑Waite」为 U.S. Games 商标，请勿以该商标命名 / 宣传。

## 部署

`pnpm build` 产出纯静态 `dist/`，可部署到任意静态托管（Cloudflare Pages / Netlify / GitHub Pages 等）。`public/_headers` 提供了生产环境的 CSP 等安全响应头（Netlify / CF Pages 格式）：`connect-src` 已限制为所选大模型服务商，自定义服务商需相应放宽。

## 技术栈

Vite 7 + React 19 + TypeScript · react-three-fiber / drei / @react-spring/three · zustand · zod · dexie（IndexedDB）· i18next · tailwindcss v4 · react-markdown + remark-gfm。测试用 Vitest（67 个单测，纯逻辑跑 node 环境，React 组件按文件 opt-in jsdom）。

## 项目结构

```
src/
  deck/        78 张牌的数据、牌义、图片映射
  mechanics/   crypto 级洗牌 / 抽牌 / 正逆位 RNG
  spreads/     牌阵：内置 + 校验 + 导入导出 + 仓储
  features/
    deck3d/      3D 牌桌（洗牌→coverflow 浏览→抽牌→落位→翻面）
    divination/  占卜状态机与解读面板
    settings/    BYOK 大模型配置表单
    spreads/     可视化拖拽牌阵编辑器
  llm/         OpenAI 兼容客户端 + SSE 解析 + 密钥存储 + 分享链接
  prompt/      4 种解读模板与上下文组装
  reading/     一次占卜的记录、历史仓储、导入导出
  routes/      页面路由（占卜 / 牌阵 / 编辑器 / 历史 / 设置）
public/deck/   牌面图片素材（见 LICENSE.txt）
```

## 许可

- 应用源码：**MIT**（见 `LICENSE`）。
- 牌面图片：Rider‑Waite‑Smith，美国公有领域；公开部署前请核实 1909 原版，详见 `public/deck/LICENSE.txt`。
- 牌义数据：`dariusk/corpora`（CC0）。
- 「Rider‑Waite」为 U.S. Games 商标，请勿以此命名 / 宣传。
