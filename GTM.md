# DealFlow — Go-to-Market 一页纸

> 本文档是 DealFlow 的 GTM 核心逻辑，不是 PPT 装饰品。每一个数字都有来源或假设标注。

---

## 0. 假设验证状态看板

| # | 核心假设 | 状态 | 验证方式 | 备注 |
|---|---------|------|---------|------|
| H1 | Solo Angel 是 primary ICP | 🟡 待验证 | Waitlist 角色分布 + Cold DM 回复率 | 需要 50+ waitlist 数据确认 |
| H2 | 痛点是"信息过载 + 好项目发现太晚" | 🟡 待验证 | Waitlist pain_point 字段聚类分析 | 二手来源（社区帖子）支持，缺一手数据 |
| H3 | $99/月定价可接受 | 🟡 待验证 | Waitlist price_willing 字段分布 | 已在表单中加入定价意愿问题 |
| H4 | "主动推送"是 vs Crunchbase 的核心差异化 | 🟡 待验证 | 用户访谈 + 留存数据 | 逻辑成立但未经用户确认 |
| H5 | Product Hunt + GitHub 是有效早期信号源 | 🟢 部分验证 | MVP 已实现，sample data 质量可接受 | 需要真实 API 数据验证信噪比 |
| H6 | DeepSeek 评分质量足够 | 🟡 待验证 | 用户 👍/👎 反馈 + 评分准确率 | 飞轮入口已建，等待用户数据 |
| H7 | Twitter/X 是最高效获客渠道 | 🔴 未验证 | 发 thread → 看 signup 转化 | 48h 验证计划第一步 |
| H8 | 用户会持续回来看 brief（D7 >30%） | 🔴 未验证 | Event tracking 数据 | 需要上线后观察 |

**图例**：🟢 已验证 / 🟡 待验证（有间接证据） / 🔴 未验证（纯假设） / ❌ 已推翻

---

## 1. 问题定义（Why Now）

2024-2025 年全球早期投资出现结构性变化：

- **Deal volume 爆炸**：AI 降低了创业门槛，Y Combinator 2024 年收到 30,000+ 申请（同比 +50%），Product Hunt 日均上线 30+ 新产品
- **信息不对称加剧**：顶级基金有 sourcing team + 数据订阅（Pitchbook $25K/年），但 solo angel 和小型基金只能靠人肉
- **时间窗口压缩**：种子轮从接触到 close 的中位时间从 2022 年的 6 周缩短到 2024 年的 3 周（来源：Carta data）

**核心洞察**：Deal sourcing 正在从"关系驱动"转向"信号驱动"，但中小投资人缺乏工具化的信号捕获能力。

---

## 2. ICP（理想客户画像）

### Primary ICP：Solo Angel / Micro-fund GP

| 维度 | 描述 |
|------|------|
| 画像 | 个人天使投资人或管理 <$10M 基金的 GP |
| 年龄 | 30-50 岁，通常是成功创业者或大厂高管转型 |
| 投资频率 | 每年 5-15 笔，每笔 $25K-$200K |
| 当前痛点 | 没有 sourcing team，靠朋友圈 + 手动刷信息流，经常错过好项目 |
| 付费能力 | 年投资额 $200K+，$99/月的工具费用 < 一笔投资的 0.5% |
| 决策逻辑 | "如果这个工具帮我多看到 1 个好项目，就值回票价了" |
| 在哪里 | Twitter/X VC 圈、AngelList、投资人社群（如 On Deck Angels） |

### Secondary ICP：VC Associate / Analyst

| 维度 | 描述 |
|------|------|
| 画像 | Seed/A 轮基金的初级投资人，负责 sourcing pipeline |
| 痛点 | 每周要给 Partner 交 deal memo，sourcing 压力大 |
| 付费逻辑 | 基金报销，$99/月 vs 一个 intern 的成本 |

### Anti-ICP（明确不做）

- Tier-1 VC（a16z, Sequoia）：已有完整 sourcing infra + 数据团队
- 二级市场投资人：需求完全不同
- 纯 LP：不直接做 deal sourcing

---

## 3. 竞品格局与定位

### 竞品矩阵

```
                    高价格 / 企业级
                         │
         Pitchbook       │      Harmonic
         ($25K/年)       │      ($15K/年)
         全量数据库       │      AI sourcing
                         │
  ───────────────────────┼───────────────────────
                         │
         Crunchbase Pro  │      ★ DealFlow ★
         ($49/月)        │      ($99/月)
         被动搜索        │      主动推送 + AI 评分
                         │
                    低价格 / 个人级
```

### 差异化定位

| 维度 | Pitchbook/Harmonic | Crunchbase Pro | DealFlow |
|------|-------------------|----------------|----------|
| 价格 | $15K-$25K/年 | $588/年 | $1,188/年 |
| 模式 | 被动搜索 | 被动搜索 | **主动推送** |
| 个性化 | 低（通用筛选器） | 低 | **高（AI 按 thesis 评分）** |
| 信号源 | 融资数据为主 | 融资数据 | **多源融合（PH+GitHub+社交+融资）** |
| 目标用户 | 基金团队 | 所有人 | Solo angel / 小基金 |
| 核心价值 | 数据全面 | 数据可搜索 | **省时间 + 不漏项目** |

**一句话定位**：DealFlow 是"投资人的 Morning Brew"——不是给你一个数据库让你自己翻，而是每天早上告诉你"今天有什么值得看的"。

---

## 4. TAM / SAM / SOM

| 层级 | 计算逻辑 | 规模 |
|------|----------|------|
| TAM | 全球活跃天使投资人 ~300K（AngelList 数据）× $1,200/年 | ~$360M |
| SAM | 英语市场 + 中国市场活跃 angel ~80K × $1,200/年 | ~$96M |
| SOM（Year 1） | 前 1000 付费用户 × $1,200/年 | $1.2M ARR |

**验证假设**：AngelList 有 200K+ 注册投资人，On Deck Angels 社群 3000+ 人，Twitter VC 圈日活跃投资人估计 50K+。

---

## 5. 获客渠道策略（前 1000 用户怎么来）

### Phase 1：冷启动（0-100 用户，Month 1-2）

**优先级排序逻辑**：第一个 bet 是 Cold DM，因为：(1) 转化率最高（1v1 对话 vs 广播），(2) 能同时做用户访谈验证 H1/H2，(3) 即使 0 signup 也能获得定性反馈。第二个 bet 是 Twitter thread，因为 CAC 为 0 且能测试 H7。

| 优先级 | 渠道 | 动作 | 预期 | 为什么排这里 |
|--------|------|------|------|-------------|
| P0 | Cold DM | 找 50 个 Twitter 上活跃的 angel，免费给他们用 1 个月 | 20 signups | 转化率最高 + 兼做用户访谈 |
| P1 | Twitter/X | 每日发布"今日 AI 发现的 3 个项目"thread，附 DealFlow 链接 | 50 signups | CAC=0，测试内容获客可行性 |
| P2 | 投资人社群 | 在 On Deck Angels、Indie Hackers、即刻投资圈发帖 | 30 signups | 精准人群但需要社区信任 |
| P3 | Product Hunt | 自己上 PH launch（meta：用 PH sourcing 工具上 PH） | 100 signups | 爆发力强但一次性 |

### Phase 2：内容飞轮（100-1000 用户，Month 3-6）

- **Weekly "Signal Report"**：每周公开发布一份精简版 deal brief（引流到完整版）
- **SEO**：针对 "deal sourcing tools"、"AI for investors"、"find startups to invest in" 做内容
- **Referral**：付费用户邀请 1 人，双方各得 1 个月免费

### 关键指标

| 指标 | 定义 | 目标 |
|------|------|------|
| Activation | 注册后 24h 内完成首次扫描 | >60% |
| Aha Moment | 收到第一份 brief 并点击查看项目详情 | >40% |
| D7 Retention | 7 天后回来看第二份 brief | >30% |
| Free→Paid | 免费用户 30 天内升级 Pro | >8% |

---

## 6. 定价逻辑

### 价格锚定

- **上限参照**：Harmonic $1,250/月 → 我们是它的 1/12
- **下限参照**：Crunchbase Pro $49/月 → 我们比它贵 2x，但提供主动推送 + AI 评分
- **价值锚定**：一个 angel 平均每笔投资 $50K，$99/月 = 年费 $1,188 = 一笔投资的 2.4%。如果 DealFlow 帮你多发现 1 个好项目，ROI 是 40x+

### 定价实验计划

- MVP 阶段：$99/月 单一定价，观察转化率
- 如果 conversion <5%：测试 $49/月 + $199/月 双档
- 如果 conversion >15%：说明定价偏低，测试 $149/月

---

## 7. 产品 Moat（护城河规划）

**短期（0-6 月）：无护城河，靠速度。** 承认这一点。

**中期（6-18 月）：数据 + 个性化飞轮。**
- 用户的 pass/invest 反馈训练个性化模型 → 用越久推荐越准 → switching cost 上升
- 积累投资人偏好数据 → 反向卖给创业者（"哪些投资人可能对你感兴趣"）→ 双边网络效应

> **MVP 中已实现的飞轮入口**：Dashboard 每个 deal card 上有 👍/👎 按钮，反馈存入 `deal_feedback` 表。当前用于验证 H6（评分质量），后续接入 prompt 优化和个性化排序。这不是愿景——代码已经在跑了。

**长期（18 月+）：Workflow integration。**
- 嵌入基金已有工具链（Notion deal pipeline、Airtable、CRM）
- 从 sourcing 延伸到 due diligence（自动生成 deal memo）
- 成为投资人的"第二大脑"

---

## 8. 需求验证计划（48 小时内可执行）

| 步骤 | 动作 | 工具 | 时间 |
|------|------|------|------|
| 1 | 写一条 Twitter thread："我在做一个 AI deal sourcing 工具，你们平时怎么找项目的？" | Twitter | 30 min |
| 2 | 在 landing page 加 waitlist（Tally 表单），收集邮箱 + "你最大的 sourcing 痛点是什么" | Tally + Vercel | 1 hour |
| 3 | Cold DM 20 个 Twitter 上的 angel，问 3 个问题 | Twitter DM | 2 hours |
| 4 | 在 Indie Hackers / 即刻 发帖描述问题，看有没有人共鸣 | 社区 | 30 min |
| 5 | 如果 48h 内 waitlist >50 人 → 需求验证通过，继续做 | 数据 | — |

---

## 9. 风险与应对

| 风险 | 概率 | 应对 |
|------|------|------|
| LLM 评分质量不稳定 | 高 | 加入用户反馈循环，用 thumbs up/down 持续优化 prompt |
| 数据源 API 被封/收费 | 中 | 多源冗余 + 自建爬虫作为 backup |
| 大厂做类似功能（如 Crunchbase 加 AI） | 中 | 聚焦 solo angel 细分市场，大厂不会为小客户优化 |
| 用户觉得 $99 太贵 | 中 | 准备 $49 降档方案，或改为按 deal 收费 |
| 投资人不信任 AI 推荐 | 高 | 透明化评分逻辑，展示"为什么推荐"，让用户可调参数 |

---

*最后更新：2025 年 5 月 | 版本：v2（加入假设验证看板 + 渠道优先级 + 飞轮入口说明）*
*本文档随产品迭代持续更新，每次重大决策后修订。下次更新时机：Waitlist 达到 50 人后，根据数据更新假设状态。*
