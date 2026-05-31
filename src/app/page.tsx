'use client';

/**
 * DealFlow Landing Page
 * GTM: Problem → Solution → Differentiation → Waitlist CTA
 * Progressive disclosure: email first → optional details after submit
 */

import { useState } from 'react';
import Link from 'next/link';

export default function LandingPage() {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [painPoint, setPainPoint] = useState('');
  const [priceWilling, setPriceWilling] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [showStep2, setShowStep2] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [waitlistCount, setWaitlistCount] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Step 1: just email
  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role, painPoint, priceWilling, source: 'landing_hero' }),
      });
      const data = await res.json();
      if (data.success) {
        if (!showStep2) {
          // First submit (email only) → show step 2
          setShowStep2(true);
          setWaitlistCount(data.position || null);
        } else {
          // Step 2 submitted → done
          setSubmitted(true);
          setWaitlistCount(data.position || null);
        }
      } else {
        setErrorMsg(data.error || '提交失败');
      }
    } catch {
      setErrorMsg('网络错误，请重试');
    }
    setSubmitting(false);
  }

  // Skip step 2
  function skipStep2() {
    setSubmitted(true);
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-gray-100 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">D</span>
            </div>
            <span className="font-semibold text-gray-900">DealFlow</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="#compare" className="text-sm text-gray-600 hover:text-gray-900 transition-colors hidden sm:inline">
              对比
            </a>
            <a href="#pricing" className="text-sm text-gray-600 hover:text-gray-900 transition-colors hidden sm:inline">
              定价
            </a>
            <Link href="/dashboard" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
              演示
            </Link>
            <a href="#waitlist" className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
              抢先体验
            </a>
          </div>
        </div>
      </nav>

      {/* Hero + Waitlist */}
      <section id="waitlist" className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 rounded-full text-sm text-indigo-700 font-medium mb-8">
            <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
            限量内测 — 仅限前 100 位投资人
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight mb-6">
            你的 AI
            <br />
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              项目发现助手
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed">
            不再手动刷 Product Hunt 和 Twitter。DealFlow 全天候扫描互联网，
            根据你的投资偏好为每个项目打分，每天早上推送精选简报
            — 让你不再错过下一个明星项目。
          </p>

          {/* Waitlist Form — Progressive Disclosure */}
          {!submitted ? (
            <form onSubmit={handleEmailSubmit} className="max-w-md mx-auto">
              {!showStep2 ? (
                /* Step 1: Just email */
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="你的邮箱"
                    required
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-lg shadow-indigo-200 whitespace-nowrap"
                  >
                    {submitting ? '...' : '抢先体验 →'}
                  </button>
                </div>
              ) : (
                /* Step 2: Optional details (after email captured) */
                <div className="space-y-3 text-left">
                  <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-700 text-center">
                    ✓ 已加入！{waitlistCount ? `你是第 ${waitlistCount} 位。` : ''} 帮助我们打造更好的产品：
                  </div>
                  <select
                    value={role}
                    onChange={e => setRole(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  >
                    <option value="">你的身份是？（可选）</option>
                    <option value="angel">个人天使投资人</option>
                    <option value="micro_fund">微型基金 GP/LP</option>
                    <option value="vc_associate">VC 投资经理/分析师</option>
                    <option value="founder">创始人（了解投资人视角）</option>
                    <option value="other">其他</option>
                  </select>
                  <textarea
                    value={painPoint}
                    onChange={e => setPainPoint(e.target.value)}
                    placeholder="你在发现项目时最大的痛点是什么？（可选）"
                    rows={2}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none"
                  />
                  <select
                    value={priceWilling}
                    onChange={e => setPriceWilling(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  >
                    <option value="">你愿意每月付多少？（可选）</option>
                    <option value="0">$0 — 只用免费版</option>
                    <option value="29">$29/月 — 如果能节省时间</option>
                    <option value="49">$49/月 — 如果确实有用</option>
                    <option value="99">$99/月 — 如果每周省 10+ 小时</option>
                    <option value="149+">$149+/月 — 如果 ROI 明确</option>
                  </select>
                  {errorMsg && <p className="text-sm text-red-600">{errorMsg}</p>}
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                    >
                      {submitting ? '提交中...' : '提交完成'}
                    </button>
                    <button
                      type="button"
                      onClick={skipStep2}
                      className="px-4 py-3 text-gray-500 hover:text-gray-700 text-sm font-medium transition-colors"
                    >
                      跳过
                    </button>
                  </div>
                </div>
              )}
              {!showStep2 && (
                <p className="text-xs text-gray-400 mt-3">免费加入，无垃圾邮件，上线后第一时间通知你。</p>
              )}
              {!showStep2 && errorMsg && <p className="text-sm text-red-600 mt-2">{errorMsg}</p>}
            </form>
          ) : (
            <div className="max-w-md mx-auto bg-green-50 border border-green-200 rounded-xl p-6">
              <div className="text-2xl mb-2">🎉</div>
              <p className="text-green-800 font-medium mb-1">你已加入等候名单！</p>
              <p className="text-green-600 text-sm">
                {waitlistCount ? `你是第 ${waitlistCount} 位。` : ''}上线后我们会第一时间通知你。
              </p>
              <Link href="/dashboard" className="inline-block mt-4 text-sm text-indigo-600 hover:underline">
                立即体验演示 →
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Pain Points */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
            项目发现的痛点
          </h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            基于 AngelList 社区讨论、On Deck Angels 公开分享，以及 Twitter/X 上的投资人对话。
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: '⏰',
                title: '每周 10+ 小时手动搜索',
                desc: '"我每天早上花 1-2 小时刷 Twitter、PH 和 Slack 群。90% 都是噪音。" — AngelList 社区',
                stat: '高频痛点',
              },
              {
                icon: '😵',
                title: '好项目发现太晚',
                desc: '"等我看到一个项目时，3 家基金已经发了 TS。现在种子轮 3 周就关了。" — On Deck Angels',
                stat: '结构性问题',
              },
              {
                icon: '💸',
                title: '专业工具太贵',
                desc: '"Pitchbook 年费 $25K，Harmonic $15K。我一年投 10 个项目，用不起。" — Twitter/X',
                stat: '价格鸿沟',
              },
            ].map(item => (
              <div key={item.title} className="bg-white rounded-xl p-8 border border-gray-200">
                <div className="text-3xl mb-4">{item.icon}</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600 mb-3">{item.desc}</p>
                <span className="text-xs text-indigo-600 font-medium bg-indigo-50 px-2 py-1 rounded-full">
                  {item.stat}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            DealFlow 如何工作
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: '设定投资偏好',
                desc: '告诉我们你关注的赛道、阶段、地域和信号。只需 5 分钟。',
                icon: '🎯',
              },
              {
                step: '02',
                title: 'AI 全天候扫描',
                desc: '我们的 AI 持续监控 Product Hunt、GitHub Trending、融资新闻和创始人动态 — 过滤噪音。',
                icon: '🤖',
              },
              {
                step: '03',
                title: '每日精选简报',
                desc: '每天早上收到 3-5 个精选项目，附带匹配评分、亮点分析和建议动作。',
                icon: '📬',
              },
            ].map(item => (
              <div key={item.step} className="text-center">
                <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4">
                  {item.icon}
                </div>
                <div className="text-xs font-bold text-indigo-600 mb-2">步骤 {item.step}</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Competitive Comparison */}
      <section id="compare" className="py-20 px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
            为什么选择 DealFlow
          </h2>
          <p className="text-center text-gray-600 mb-12">
            市面上不缺数据库。缺的是一个能帮你读完所有信息、告诉你什么值得关注的 AI 助手。
          </p>
          <div className="overflow-x-auto">
            <table className="w-full bg-white rounded-xl border border-gray-200 overflow-hidden">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500"></th>
                  <th className="px-6 py-4 text-center text-sm font-medium text-gray-500">Pitchbook</th>
                  <th className="px-6 py-4 text-center text-sm font-medium text-gray-500">Crunchbase Pro</th>
                  <th className="px-6 py-4 text-center text-sm font-medium text-indigo-700 bg-indigo-50 border-x-2 border-indigo-200 relative">
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs px-2 py-0.5 rounded-full font-medium">推荐</span>
                    DealFlow
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="px-6 py-4 text-sm text-gray-700 font-medium">年费</td>
                  <td className="px-6 py-4 text-center text-sm text-gray-600">$25,000+</td>
                  <td className="px-6 py-4 text-center text-sm text-gray-600">$588</td>
                  <td className="px-6 py-4 text-center text-sm font-semibold text-indigo-700 bg-indigo-50/50 border-x-2 border-indigo-100">$1,188</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm text-gray-700 font-medium">使用方式</td>
                  <td className="px-6 py-4 text-center text-sm text-gray-600">你主动搜索</td>
                  <td className="px-6 py-4 text-center text-sm text-gray-600">你主动搜索</td>
                  <td className="px-6 py-4 text-center text-sm font-semibold text-indigo-700 bg-indigo-50/50 border-x-2 border-indigo-100">主动推送给你</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm text-gray-700 font-medium">个性化</td>
                  <td className="px-6 py-4 text-center text-sm text-gray-600">通用筛选</td>
                  <td className="px-6 py-4 text-center text-sm text-gray-600">通用筛选</td>
                  <td className="px-6 py-4 text-center text-sm font-semibold text-indigo-700 bg-indigo-50/50 border-x-2 border-indigo-100">按你的投资偏好打分</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm text-gray-700 font-medium">信号来源</td>
                  <td className="px-6 py-4 text-center text-sm text-gray-600">融资数据</td>
                  <td className="px-6 py-4 text-center text-sm text-gray-600">融资数据</td>
                  <td className="px-6 py-4 text-center text-sm font-semibold text-indigo-700 bg-indigo-50/50 border-x-2 border-indigo-100">PH + GitHub + 社交 + 融资</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm text-gray-700 font-medium">目标用户</td>
                  <td className="px-6 py-4 text-center text-sm text-gray-600">基金团队</td>
                  <td className="px-6 py-4 text-center text-sm text-gray-600">所有人</td>
                  <td className="px-6 py-4 text-center text-sm font-semibold text-indigo-700 bg-indigo-50/50 border-x-2 border-indigo-100">个人天使 & 微型基金</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm text-gray-700 font-medium">每日时间成本</td>
                  <td className="px-6 py-4 text-center text-sm text-gray-600">1-2 小时</td>
                  <td className="px-6 py-4 text-center text-sm text-gray-600">30-60 分钟</td>
                  <td className="px-6 py-4 text-center text-sm font-semibold text-indigo-700 bg-indigo-50/50 border-x-2 border-indigo-100">5 分钟（读简报）</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-center text-sm text-gray-500 mt-6">
            DealFlow 是"投资人的 Morning Brew" — 不是给你一个数据库让你搜索，而是每天早上告诉你什么值得关注。
          </p>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">定价</h2>
          <p className="text-center text-gray-600 mb-4">天使投资平均单笔 $50K。DealFlow 年费 = 一笔投资的 2.4%。多发现一个好项目，回报就是 40 倍。</p>
          <p className="text-center text-xs text-gray-400 mb-12">定价锚定在 Crunchbase Pro ($49/月) 和 Harmonic ($1,250/月) 之间。</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {/* Free */}
            <div className="bg-white rounded-xl border border-gray-200 p-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">探索版</h3>
              <div className="text-3xl font-bold text-gray-900 mb-6">$0<span className="text-base font-normal text-gray-500">/月</span></div>
              <ul className="space-y-3 text-gray-600 mb-8">
                <li className="flex items-center gap-2"><span className="text-green-500">✓</span> 每天 3 个评分项目</li>
                <li className="flex items-center gap-2"><span className="text-green-500">✓</span> 每周简报（仅周一）</li>
                <li className="flex items-center gap-2"><span className="text-green-500">✓</span> Product Hunt + GitHub 来源</li>
                <li className="flex items-center gap-2"><span className="text-gray-300">✗</span> <span className="text-gray-400">自定义投资偏好调优</span></li>
                <li className="flex items-center gap-2"><span className="text-gray-300">✗</span> <span className="text-gray-400">融资新闻 + 社交信号</span></li>
              </ul>
              <a href="#waitlist" className="block w-full text-center px-6 py-3 border border-gray-200 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors">
                加入等候名单
              </a>
            </div>
            {/* Pro */}
            <div className="bg-indigo-600 rounded-xl p-8 text-white relative overflow-hidden">
              <div className="absolute top-4 right-4 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full">
                早鸟价
              </div>
              <h3 className="text-lg font-semibold mb-2">专业版</h3>
              <div className="text-3xl font-bold mb-1">$99<span className="text-base font-normal text-indigo-200">/月</span></div>
              <p className="text-indigo-200 text-xs mb-6">前 100 位用户锁定此价格，后续可能上调。</p>
              <ul className="space-y-3 text-indigo-100 mb-8">
                <li className="flex items-center gap-2"><span className="text-yellow-300">✓</span> 无限评分项目</li>
                <li className="flex items-center gap-2"><span className="text-yellow-300">✓</span> 每日简报（每天早上）</li>
                <li className="flex items-center gap-2"><span className="text-yellow-300">✓</span> 全部来源 + 融资 + 社交</li>
                <li className="flex items-center gap-2"><span className="text-yellow-300">✓</span> 自定义投资偏好 & 信号权重</li>
                <li className="flex items-center gap-2"><span className="text-yellow-300">✓</span> Slack / 邮件 / 飞书推送</li>
                <li className="flex items-center gap-2"><span className="text-yellow-300">✓</span> 导出项目管线 CSV</li>
              </ul>
              <a href="#waitlist" className="block w-full text-center px-6 py-3 bg-white text-indigo-600 rounded-lg font-medium hover:bg-indigo-50 transition-colors">
                抢先体验 · 锁定价格
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Transparency */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">关于这个项目</h2>
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-left space-y-4 text-gray-700">
            <p>
              <strong>坦诚说明：</strong>DealFlow 目前处于 MVP 阶段。我们没有虚假用户评价，因为我们相信 GTM 的第一步是验证真实需求，而不是制造社会证明。
            </p>
            <p>
              <strong>当前状态：</strong>核心功能已可用（AI 评分 + 每日简报 + 反馈飞轮）。我们正在寻找前 100 位早期用户一起打磨产品。你的反馈直接影响我们下一步做什么。
            </p>
            <p>
              <strong>技术栈：</strong>Next.js + DeepSeek API + SQLite。选择 DeepSeek 是因为它比 GPT-4 便宜 10 倍且质量相当。选择 SQLite 是因为 MVP 不需要分布式数据库。
            </p>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-20 px-6 bg-gradient-to-br from-indigo-600 to-purple-700">
        <div className="max-w-3xl mx-auto text-center text-white">
          <h2 className="text-3xl font-bold mb-4">不再错过下一个明星项目</h2>
          <p className="text-indigo-100 text-lg mb-8">
            每天早上 5 分钟。根据你的投资偏好精选评分项目。
            <br />加入等候名单或直接体验演示 — 无需注册。
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <a href="#waitlist" className="px-8 py-4 bg-white text-indigo-600 rounded-xl text-lg font-medium hover:bg-indigo-50 transition-colors shadow-lg">
              抢先体验
            </a>
            <Link href="/dashboard" className="px-8 py-4 border-2 border-white/50 text-white rounded-xl text-lg font-medium hover:bg-white/10 transition-colors">
              体验演示 →
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-gray-100">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-indigo-500 to-purple-600 rounded flex items-center justify-center">
              <span className="text-white text-xs font-bold">D</span>
            </div>
            <span>DealFlow © 2025</span>
          </div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-gray-900 transition-colors">Twitter</a>
            <a href="#" className="hover:text-gray-900 transition-colors">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
