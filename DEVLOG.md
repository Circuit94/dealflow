# DealFlow — Development Log

> 从零到 GTM-ready MVP 的完整开发记录。包含每个阶段的技术决策、遇到的困难、解决方案和反思。

---

## 项目概览

DealFlow 是一个 AI 驱动的投资项目发现工具，面向个人天使投资人和 Micro-fund GP。项目从 `create-next-app` 脚手架开始，经过 12 次迭代提交，演进为一个包含完整 GTM 验证基础设施的 MVP。

**开发周期**：数天（vibe coding 模式，快速迭代）
**技术栈**：Next.js 16 + React 19 + TypeScript 5 + Tailwind v4 + SQLite + DeepSeek API
**核心理念**：假设驱动开发 — 每个功能都服务于一个待验证的商业假设

---

## 阶段一：基础架构搭建

### Commit 1: Initial scaffold

使用 `create-next-app` 初始化项目，选择 App Router + TypeScript + Tailwind CSS + ESLint。

**决策点**：选择 Next.js 16 而非 14/15，因为它是最新稳定版且 Vercel 部署零配置。代价是文档较少、社区经验有限，后续确实遇到了一些 breaking changes。

### Commit 2: Complete MVP with GTM validation infrastructure

这是项目的核心提交，一次性实现了：

- **数据层**：SQLite + better-sqlite3（WAL 模式），包含 6 张表（investor_preferences, deals, deal_scores, daily_briefs, deal_feedback, events）
- **AI 引擎**：DeepSeek API 集成，结构化评分输出（score/verdict/strengths/risks/action）
- **数据源**：Product Hunt GraphQL API + GitHub Trending 抓取
- **前端**：Landing page（waitlist + 叙事）+ Dashboard（简报 + 管线 + 设置）
- **GTM 基础设施**：Waitlist 收集（含定价调研）、自建事件追踪、假设验证看板

**遇到的困难**：

1. **SQLite 路径问题**：在 Next.js API Route 中，`__dirname` 不可靠。最终使用 `path.join(process.cwd(), 'data', 'dealflow.db')` 确保开发和生产环境一致。

2. **DeepSeek 结构化输出**：LLM 偶尔返回非标准 JSON（多余逗号、注释、markdown 代码块包裹）。解决方案是多层 parsing：先尝试直接 `JSON.parse`，失败后用正则提取 JSON 块，再失败则返回默认低分。

3. **Product Hunt API 认证**：PH 的 GraphQL API 需要 OAuth token，但对于 MVP 阶段不想增加认证复杂度。解决方案是 API key 可选 + 硬编码 fallback 数据，确保无 key 也能体验。

---

## 阶段二：偏好系统与交互优化

### Commit 3: Preferences UI — tag selection + text input

投资偏好编辑器的设计经历了几次迭代：

- **V1**：纯文本输入框 → 用户不知道该写什么
- **V2**：下拉选择 → 选项太多，体验差
- **V3（最终）**：Tag pill 按钮 + 自由文本 fallback → 点击即选，也支持自定义

**技术细节**：偏好数据结构设计为 `{ sectors: string[], stage: string, geography: string, signals: string[], thesis: string }`，其中 `thesis` 是自由文本，直接注入 LLM prompt 作为评分依据。

### Commit 4: Dashboard UX overhaul

Dashboard 从单一列表进化为多 Tab 工作台：

- **Accordion 展开**：Deal 卡片默认折叠，点击展开详情（strengths/risks/action）
- **Skeleton 加载态**：避免布局跳动，提升感知性能
- **Filter Bar**：按 verdict/source 筛选 + 按 score/date 排序
- **Structured Brief**：按 `##` 标题分段渲染，支持折叠

**困难**：Accordion 动画在 React 19 strict mode 下有 double-render 问题，导致高度计算错误。解决方案是使用 CSS `max-height` transition 而非 JS 动态计算高度。

### Commit 5: Component split + UX fixes

从 800+ 行的 dashboard 单文件中提取 7 个组件：

| 组件 | 职责 | 行数 |
|------|------|------|
| DealCard | 评分圆环 + 展开详情 + 反馈按钮 | ~180 |
| BriefSection | Markdown 渲染 + Deal 名称链接 | ~80 |
| FilterBar | 筛选/排序控件 | ~100 |
| PreferencesForm | Tag 选择 + 文本输入 | ~150 |
| ApiConfigForm | API 密钥管理 | ~100 |
| OnboardingStepper | 冷启动引导 | ~80 |
| Skeleton | 加载占位符 | ~40 |

**同时修复的问题**：

- **URL 同步**：Tab 状态写入 URL query params（`?tab=deals`），支持分享链接和浏览器后退
- **Brief → Deal 跳转**：点击简报中的项目名，自动切换到 Pipeline tab 并高亮对应卡片（3 秒后消失）
- **XSS 防护**：LLM 生成的 markdown 通过 DOMPurify 清洗后再 `dangerouslySetInnerHTML`
- **移动端适配**：响应式断点、触摸友好的按钮尺寸

---

## 阶段三：反馈飞轮闭环

### Commit 6: Close feedback flywheel + GTM validation report

这是产品核心差异化的实现：

```typescript
// db.ts - getFeedbackPatterns()
// 从 deal_feedback 表提取用户偏好模式
function getFeedbackPatterns(): string {
  // 1. 赛道偏好："likes AI/ML 5/6 times, passes on Crypto 3/4 times"
  // 2. 来源偏好："PH deals get more 👍 than GitHub"
  // 3. 评分校准："user liked 3 deals scored as PASS → scoring too conservative"
  // 最少 3 条反馈后激活
}

// deepseek.ts - scoreDeal()
// 将 patterns 注入 system prompt
const systemPrompt = `You are an investment analyst...
${feedbackPatterns ? `\n\nIMPORTANT - User feedback patterns:\n${feedbackPatterns}` : ''}`;
```

**设计决策**：为什么用 prompt injection 而非 fine-tuning？

1. **成本**：Fine-tuning DeepSeek 需要大量标注数据，MVP 阶段不现实
2. **可解释性**：Prompt 中的 patterns 是人类可读的，方便调试
3. **即时生效**：每次评分都用最新 patterns，无需重新训练
4. **冷启动友好**：3 条反馈即可激活，fine-tuning 需要数百条

**同时完成**：GTM.md 验证报告，从"计划书"重写为"验证报告"格式，加入 8 个核心假设的状态看板、失败场景、Pivot 路径。

---

## 阶段四：UX 交互精细化

### Commit 7: 17-point UX interaction critique

基于一次全面的 UX 审查，修复了 17 个交互问题：

1. **Progressive Disclosure Landing Page**：从一次性展示所有信息改为渐进式展开
2. **Demo Banner**：明确告知用户当前是演示数据（琥珀色横幅）
3. **Category Filter**：动态提取 deal 的 category 作为筛选选项
4. **Thesis → Scoring 联动**：偏好中的 thesis 字段真正注入评分 prompt
5. **反馈按钮放大**：从 text-xs 改为 text-sm + padding 增加，移动端更易点击
6. **英文标签统一**：所有 UI 标签从中英混杂统一为英文（后续 i18n 再处理）
7. **Deal 链接样式**：外部链接添加 ↗ 图标 + hover 下划线

**困难**：Category filter 需要从 effectiveDeals（可能是 demo 数据）中动态提取，且要处理 `undefined`/`null` category 的情况。使用 `useMemo` + `Set` + `filter(Boolean)` 解决。

### Commit 8-9: Lockfile + Vercel deployment

**问题**：`package-lock.json` 中包含了内部 npm registry 的 URL（公司内网源），导致 Vercel 构建失败。

**解决方案**：删除 lockfile，切换到公共 npm registry，重新 `npm install` 生成干净的 lockfile。

**教训**：在公司环境开发开源项目时，务必检查 lockfile 中的 registry URL。

---

## 阶段五：国际化

### Commit 10: i18n support (zh/en)

**设计决策**：为什么不用 `next-intl` 或 `react-i18next`？

1. 只有 2 个 locale（中文 + 英文），不需要复杂的路由/文件结构
2. MVP 阶段追求最小依赖
3. 自建方案：React Context + localStorage + 浏览器语言检测

**实现**：

```typescript
// i18n.tsx
const translations = {
  zh: { appName: 'DealFlow', dailyScan: '每日扫描', ... },
  en: { appName: 'DealFlow', dailyScan: 'Daily Scan', ... },
};

// 使用
const { t, locale, setLocale } = useI18n();
t('scanStatusMsg'); // → "正在扫描..." 或 "Scanning..."
t('projectsAnalyzed', { count: 5 }); // → "分析了 5 个项目"
```

**困难**：参数化模板字符串的类型安全。最终选择简单的 `string.replace('{key}', value)` 模式，牺牲类型安全换取实现速度。

### Commit 11: 完善中文本地化

修复了 i18n 遗漏的角落：

- 历史简报的日期/元数据仍显示英文
- 错误提示信息未翻译
- Suspense fallback 文案
- SEO metadata（title/description）
- Tab 命名优化（"简报" vs "每日简报"）

---

## 阶段六：GTM UX 审计优化

### Commit 12: GTM UX audit optimizations (16 items, 5 categories)

这是最大的一次 UX 重构，基于一份 16 项的 GTM 审计报告。

#### 审计报告原文（5 大类）

**A. Landing Page 转化问题**

| # | 问题 | 解决方案 |
|---|------|---------|
| 1 | 用户必须先留邮箱才能看到产品长什么样 | 新增 Product Preview 区：3 张 mock deal 卡片展示 AI 评分效果 |
| 2 | Hero 文案是通用 SaaS 语言，不是投资人语言 | 改为 "别人发 TS 的时候 / 你才刚看到 deal" |
| 3 | 痛点描述太抽象 | 用投资人黑话重写（mark up, TS, DD, check size, founder-market fit） |
| 4 | 对比表缺少投资人最关心的维度 | 新增"发现时机"行（融资前 2-4 周）和"ROI"行 |
| 5 | "关于这个项目"太谦虚 | 改为"为什么现在加入" + 稀缺性框架（100 人限额） |

**B. Dashboard UX 缺口**

| # | 问题 | 解决方案 |
|---|------|---------|
| 6 | Demo 数据日期是固定的，看起来不真实 | `generatedAt` 使用 `new Date().toISOString()` |
| 7 | 首次进入 Dashboard 不知道该做什么 | Coach Mark 引导覆盖层（3 步，localStorage 记忆） |
| 8 | 点了 👍/👎 没有视觉反馈 | Feedback Toast："AI 已记录偏好，未来推荐将更精准" |
| 9 | Demo 模式点"每日扫描"直接跳转 API 页，体验断裂 | 改为弹出友好 Modal（继续体验 / 去配置） |

**C. 漏斗结构问题**

| # | 问题 | 解决方案 |
|---|------|---------|
| 10 | Waitlist 提交后没有下一步引导 | 引导至 `/dashboard?tab=settings` 设置偏好 |
| 11 | 表单一次性要求太多信息 | Progressive disclosure：邮箱 → 可选调研 → 跳过按钮 |

**D. ICP 语言问题**

| # | 问题 | 解决方案 |
|---|------|---------|
| 12 | 痛点用开发者语言而非投资人语言 | 重写为投资人社区真实吐槽风格 |
| 13 | 缺少 ROI 量化 | 对比表明确标注时间/金钱节省 |

**E. 技术体验问题**

| # | 问题 | 解决方案 |
|---|------|---------|
| 14 | 对比表在移动端溢出 | 添加 `overflow-x-auto` + 滚动提示 |
| 15 | Footer 链接是占位符 | 指向真实 URL（twitter.com/dealaboratory, github.com/Circuit94/dealflow） |
| 16 | Waitlist 计数不实时 | 页面加载时 fetch `/api/waitlist` 获取最新数量 |

#### 技术实现细节

**Landing Page 重写**（`src/app/page.tsx`）：

- Product Preview 区使用 3 张静态 mock 卡片，模拟真实 Dashboard 的 DealCard 样式
- 双 CTA 布局：左侧"先看 AI 评分效果"（Link to /dashboard）+ 右侧邮箱表单
- Progressive Waitlist：`showStep2` 状态控制二步表单显示
- 提交后状态引导：`<Link href="/dashboard?tab=settings">` 设置偏好

**Dashboard 增强**（`src/app/dashboard/page.tsx`）：

```typescript
// 新增状态
const [showCoachMark, setShowCoachMark] = useState(false);
const [feedbackToast, setFeedbackToast] = useState<string | null>(null);
const [showDemoScanModal, setShowDemoScanModal] = useState(false);

// Coach Mark 初始化（首次访问检测）
useEffect(() => {
  if (!localStorage.getItem('dealflow-coach-seen')) {
    setShowCoachMark(true);
  }
}, []);

// Demo 模式 Scan 行为
async function runScan() {
  if (!apiConfig?.deepseekConfigured) {
    if (isDemo) {
      setShowDemoScanModal(true); // 友好 Modal 而非错误跳转
      return;
    }
    // ...
  }
}

// 反馈 Toast
async function sendFeedback(dealId, signal) {
  setFeedbackMap(m => ({ ...m, [dealId]: signal }));
  if (signal) {
    setFeedbackToast(signal === 'interested'
      ? 'AI 已记录偏好，未来推荐将更精准'
      : '已标记跳过，同类项目将降权');
    setTimeout(() => setFeedbackToast(null), 3000);
  }
  if (isDemo) return; // Demo 模式不调 API
  // ...
}
```

#### 遇到的困难

1. **JSON 转义问题**：Landing page 中包含大量中文字符串和特殊字符（引号、反斜杠），在通过 AI 工具写入文件时多次触发 JSON parsing error。解决方案是避免在字符串中使用反斜杠转义序列，改用 Unicode 字面量或 HTML entities。

2. **Coach Mark 的 SSR 兼容**：`localStorage` 在服务端不存在。使用 `typeof window !== 'undefined'` 守卫确保只在客户端执行。

3. **Toast 动画**：使用 Tailwind 的 `animate-[slideUp_0.3s_ease-out]` 自定义动画，避免引入额外 CSS 文件。

4. **Demo 模式状态判断**：`isDemo` 依赖 `initialLoading`、`apiConfig`、`deals.length` 三个状态，需要确保在所有异步操作完成后才判断，否则会闪烁。

---

## 技术债务与已知问题

### 当前技术债务

1. **Dashboard 单文件过大**：807 行，虽然已提取 7 个子组件，但主文件仍包含大量状态逻辑和 JSX。理想情况应进一步拆分为 custom hooks（`useDashboardData`, `useFeedback`, `useScan`）。

2. **无测试覆盖**：零测试文件。对于 MVP 阶段可接受，但在验证通过后需要补充至少 API route 的集成测试。

3. **Demo 数据硬编码**：5 个 demo deals 直接写在 dashboard 组件中（中英文各一套，约 200 行）。应提取到独立文件。

4. **i18n 类型不安全**：翻译 key 是字符串，拼写错误不会在编译时报错。

5. **OnboardingStepper 组件未使用**：在 coach mark 实现后，原有的 OnboardingStepper 组件变得冗余，但未删除。

### 已知 UX 问题

1. **Brief 内容不可复制**：DOMPurify 清洗后的 HTML 在某些浏览器中选择文本困难
2. **移动端 Tab 溢出**：4 个 Tab 在窄屏幕上需要横向滚动，但无视觉提示
3. **API 配置保存无确认**：PUT 成功后只更新状态，无 toast 确认

---

## 性能考量

### 当前性能特征

- **首屏加载**：静态生成（`○` Static），无服务端数据依赖
- **Dashboard 数据**：客户端 fetch，有 skeleton 加载态
- **AI 评分延迟**：每个 deal 约 2-3 秒（DeepSeek API），批量 3 个并发
- **SQLite 读取**：< 1ms（WAL 模式，本地文件）
- **构建时间**：~2.3 秒（Turbopack）

### 潜在瓶颈

1. **批量评分**：10 个 deals × 3 秒 = 30 秒总扫描时间。用户需要等待。
2. **SQLite 并发写入**：WAL 模式支持并发读，但写入仍是串行的。单用户场景无问题。
3. **Demo 数据 useMemo**：中英文各 5 个 deal 对象在每次 locale 切换时重新创建。

---

## 部署与运维

### Vercel 部署

- **触发**：Push to `main` 自动部署
- **构建**：`next build`（Turbopack）
- **运行时**：Node.js（API routes 需要 `better-sqlite3`）
- **数据持久化**：⚠️ Vercel Serverless 函数的文件系统是临时的，SQLite 数据不会跨部署持久化。这对 MVP 验证阶段可接受（每次部署重置），但生产化需要迁移到 Turso/PlanetScale。

### 本地开发

```bash
npm run dev          # 启动开发服务器（Turbopack，热更新）
npm run build        # 生产构建（类型检查 + 优化）
npm run start        # 启动生产服务器
npm run lint         # ESLint 检查
```

---

## 关键指标定义（待验证阶段）

| 指标 | 定义 | 目标 | 当前 |
|------|------|------|------|
| Waitlist Signup Rate | 访问 Landing Page → 提交邮箱 | >5% | 未测量 |
| Step 2 Completion | 提交邮箱 → 完成调研问卷 | >30% | 未测量 |
| Demo Engagement | 访问 Dashboard → 点击至少 1 个 deal | >50% | 未测量 |
| Feedback Rate | 查看 deal → 给出 👍/👎 | >20% | 未测量 |
| D7 Retention | 首次访问 → 7 天内再次访问 | >30% | 未测量 |
| WTP (Willingness to Pay) | Concierge 用户中愿意付费的比例 | ≥2/5 | 未测量 |

---

## 总结

DealFlow 的开发过程体现了一个核心理念：**在验证假设之前，不要过度工程化**。

整个 MVP 的技术选型都围绕"最快验证"展开：SQLite 而非 Postgres（零配置）、自建 i18n 而非 next-intl（最小依赖）、自建 analytics 而非 PostHog（数据自主）、prompt injection 而非 fine-tuning（即时生效）。

最大的挑战不是技术实现，而是**写出让投资人产生共鸣的文案**。从"AI-powered deal sourcing tool"到"别人发 TS 的时候你才刚看到 deal"，这个转变花了比写代码更多的时间思考。

下一步是 Concierge MVP — 用人工方式服务 5 个真实投资人，验证核心假设。如果验证通过，再投入工程资源做多用户、多数据源、个性化排序。如果验证失败，这份 DEVLOG 就是最好的复盘材料。

---

*最后更新：2025 年 7 月 | 对应 Git commit: feat: GTM UX audit optimizations*
