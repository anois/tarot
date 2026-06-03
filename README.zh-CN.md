<div align="center">

<img src="public/favicon.svg" width="80" alt="塔罗 · 3D 占卜 logo" />

# 塔罗 · 3D 占卜

**一张浏览器里的 3D 塔罗牌桌 —— 洗牌、自己抽牌、再让你自己的大模型为你解读。**

纯前端 · 无后端 · 自带模型密钥 · 中文为主。

<p>
<a href="https://anois.github.io/tarot/"><img src="https://img.shields.io/badge/打开应用-anois.github.io%2Ftarot-d9a441?style=for-the-badge" alt="打开应用" /></a>
</p>

<sub>
<a href="https://tarotj.oss-cn-beijing.aliyuncs.com/">国内镜像</a> ·
<a href="LICENSE">MIT</a> ·
<a href="README.md">English</a> ·
<a href="https://github.com/anois/tarot/issues/new">提个需求 →</a>
</sub>

</div>

---

**塔罗 · 3D** 是一款完全跑在浏览器里的塔罗占卜网页 —— 没有后端、没有账号、没有埋点。在一张烛光氛围的 3D 牌桌上洗一副 crypto 级随机的牌，然后**自己抽牌**（绝不是随机发牌 —— 你横滑浏览牌组、点中间那张抽出来），看着每张牌飞向牌阵中它的位置并翻面，逆位牌旋转 180°。填入你**自己**的大模型密钥（**BYOK**），浏览器会把「问题 + 牌阵 + 抽到的牌（含正逆位）+ 牌义」打包成结构化提示词，把解读以流式返回 —— 全程简体中文。密钥直连你选定的服务商，绝不经过我们的任何服务器。

## 自己抽牌 · 一张真正的 3D 牌桌

整场占卜在同一块沉浸式界面上完成。牌组是主角：点它（或点「洗牌」）开始洗牌，横滑浏览背面朝上的牌组，点中间那张把它抽进下一个牌位。揭示时相机会缓缓推进并把牌阵框正居中。你抽中的那张，就是飞起来翻面的那张 mesh —— 没有偷换。

<table>
  <tr>
    <td width="50%" align="center"><img src="docs/screenshots/01-mobile-idle.jpg" width="290" alt="初始牌组 + 牌阵横滑选择 + 洗牌按钮" /></td>
    <td width="50%" align="center"><img src="docs/screenshots/02-mobile-reading.jpg" width="290" alt="揭示后的三张牌，相机框正牌阵" /></td>
  </tr>
  <tr>
    <td align="center"><sub>待抽 —— 牌组主角、可横滑选牌阵、烛光主 CTA</sub></td>
    <td align="center"><sub>揭示 —— 牌阵居中框正、抽到的牌列表</sub></td>
  </tr>
</table>

## 14 种牌阵 · 从单张到星象十二宫

内置牌阵覆盖单张指引、二选一 / 是非澄清、三张牌时间线、身心灵、关系、五芒星、马蹄、七脉轮、凯尔特十字、占星十二宫轮盘、年度之轮。每个牌阵都用同一套归一化 `[0,1]` 坐标描述，被 2D 预览、3D 牌桌、可视化编辑器共享 —— 所以你也可以**以 JSON 导入 / 导出牌阵**，或在编辑器里**拖出自己的牌阵**，三处渲染完全一致。

<p align="center"><img src="docs/screenshots/05-spreads.jpg" width="860" alt="牌阵库，展示内置牌阵" /></p>

## 自带密钥 · 浏览器直连大模型

回路里没有服务器。你在「设置」里贴上**自己的** API 密钥（默认仅存内存；可选 session / localStorage），浏览器直接调用模型。**DeepSeek** 是实测可浏览器直连的默认项；**OpenRouter** 是通配 CORS 的一键回退；同时支持 Anthropic 原生与任意 OpenAI 兼容端点。五种解读风格任选 —— 结构化逐牌、故事化叙事、简短速答、整体综合分析，以及会记住已抽牌的深入追问 —— 结果以 Markdown 流式呈现。每次占卜自动存入 IndexedDB（历史在你本机，可导出），还能生成 `#cfg=` 分享链接，让没有密钥的朋友也能直接用。

<p align="center"><img src="docs/screenshots/04-desktop-reading.jpg" width="860" alt="桌面端凯尔特十字解读，居中框正" /></p>

## 每一张牌 · 全中文

点任意已揭示的牌，弹出详情：元素、黄金黎明体系星象、数字学、撰写的象征与故事、精选关键词，以及随正逆位切换的牌义 —— 全部简体中文。一个「结合此位置与问题」的按钮可让模型解读这张牌在此牌阵该位置下的含义；整体综合分析模板则读取整副牌面的态势（元素分布、正逆位比例、大阿卡纳密度、主导 / 缺失元素）。

<p align="center"><img src="docs/screenshots/03-mobile-card-detail.jpg" width="320" alt="卡牌详情面板，全中文" /></p>

## 准备一把模型密钥（以 DeepSeek 为例）

应用本身不含密钥，需要你自带。获取 DeepSeek 密钥：

1. 在 **[DeepSeek 开放平台](https://platform.deepseek.com/)** 注册 / 登录（手机号或邮箱）。
2. 进入 **API keys（API 密钥）→ 创建 API key**，复制保存 —— 只显示一次。
3. 在 **充值 / Billing** 里预付一笔**小额**余额。余额就是你的花费上限（DeepSeek 没有按 key 的额度限制），个人占卜几元足够；新账户可能有赠送额度。
4. 回到应用：**设置 → 服务商选 DeepSeek → 粘贴密钥 → 测试连接**。DeepSeek 已实测可浏览器直连。

> **分享安全：** `#cfg=` 链接会内嵌你的密钥并消耗**你的**余额。DeepSeek 只能靠账户余额限额，分享前请保持**小额余额 + 专用可删 key**；若想按 key 设预算上限，改用支持 per-key credit limit 的 **OpenRouter** 密钥。

## 里面都有什么

| 维度 | 内容 |
|---|---|
| **3D 牌桌** | 一套统一的卡牌 mesh：crypto 级 Fisher–Yates 洗牌 → coverflow 浏览 → **你来抽** → 飞入牌位 → 原地翻面（逆位 = 180°）。烛光「秘典」主题、投影、星屑、揭示时相机框正，含 reduced-motion 与移动端性能档。 |
| **抽牌** | 你自己选牌（绝非发牌）；确认前可 LIFO 撤销；正逆位是洗牌后每张独立投币决定。支持仅大阿卡纳模式。 |
| **牌阵** | 14 个内置 + JSON 导入导出 + 可视化拖拽编辑器；2D 预览 / 3D 牌桌 / 编辑器共享同一套归一化 `[0,1]` 约定；Zod 跨字段校验。 |
| **大模型（BYOK）** | OpenAI 兼容客户端，DeepSeek（浏览器直连）默认 + OpenRouter 回退 + Anthropic + 自定义；SSE 流式；5 套模板含整体综合与深入追问；CORS 错误分类并提示「改用 OpenRouter」。 |
| **参考资料** | 78 张 RWS 牌 + 撰写的中文元素 / 星象 / 数字 / 象征 / 故事 + 精选中文关键词与正逆位牌义。 |
| **本地** | IndexedDB 历史（自动保存、导入导出）、持久化外观偏好、`#cfg=` 配置分享链接（密钥只在 URL 片段里，绝不发往服务器）。 |
| **形态** | 移动优先：底部 Tab 栏、沉浸式单流、底部抽屉控制、≥44px 触控目标、`svh` + 安全区；桌面端用顶部导航与更宽的牌桌。 |

## 自己跑起来

```bash
git clone https://github.com/anois/tarot.git
cd tarot
pnpm install
pnpm dev          # → http://localhost:5173（或 5174）
pnpm test         # vitest 单元测试
pnpm lint         # eslint
pnpm build        # tsc 类型检查 + 生产构建
```

本地开发可从 `.env` 预填密钥框（`VITE_DEV_LLM_*`，见 `.env.example`）—— 该值**仅**在 `pnpm dev` 时读取，并在生产构建中被死代码消除，因此密钥绝不会进入打包产物。

- **架构**（divination store 作为唯一真源、统一的 3D 牌组、共享的归一化牌阵坐标、BYOK 大模型客户端 + SSE 解析、提示词组装）→ [`CLAUDE.md`](CLAUDE.md)
- **部署**（GitHub Pages 工作流 + 阿里云 OSS 国内镜像、base 路径处理、SPA 回退）→ [`docs/deploy.md`](docs/deploy.md)

`pnpm build` 产出纯静态 `dist/`；推送 `main` 即自动部署到 **GitHub Pages**，以及阿里云 OSS 国内镜像 <https://tarotj.oss-cn-beijing.aliyuncs.com/>。

## 🤖 由 Claude Code 维护

**本仓库的每一条 commit 都由 [Claude Code](https://claude.com/claude-code) session 产出。** 3D 引擎、洗牌数学、牌阵定义、大模型客户端、UI、CSS、i18n 文案、这份 README —— 可见历史里没有一行人类写下的代码，也不打算有。这是项目实际的运作模式，不是 marketing 语。

- **不接受人类发起的 PR —— 请不要开，它不会被合并。** 本仓库唯一的提交者身份就是 Claude Code 维护流水线。
- **输入通道 = [GitHub Issue](https://github.com/anois/tarot/issues/new)。** 中文或英文都行，几句话描述你想要什么、或哪里坏了。合理的 Issue 会被捞起来，交给一次 Claude Code session 实现 + 自测 + 开 PR，（维护者本地验收之后）合并 + 自动部署。
- **可审计：** commit 历史就是审计追溯线，每条 PR 描述记录了它为什么上线。

## 许可

- **应用源码：** [MIT](LICENSE)。
- **牌面素材：** `public/deck/` 的 Rider–Waite–Smith 牌面属美国公有领域。⚠ 公开部署前请核实素材为 **1909 原版**（而非仍受版权的 1971 U.S. Games 重上色版），或替换为确认 CC0 的素材 —— `imageKey ↔ 文件名` 映射稳定，可直接替换。详见 [`public/deck/LICENSE.txt`](public/deck/LICENSE.txt)。
- **牌义数据集：** [`dariusk/corpora`](https://github.com/dariusk/corpora)（CC0）。
- **展示字体：** Cinzel —— [SIL Open Font License 1.1](https://fonts.google.com/specimen/Cinzel)。
- 「Rider-Waite」为 U.S. Games 商标；本项目**不**以该商标命名或宣传。

---

<div align="center">
<sub><a href="https://github.com/anois/tarot">github.com/anois/tarot</a> · 每一行都由 <a href="https://claude.com/claude-code">Claude Code</a> 产出</sub>
</div>
