'use client';

/**
 * DealFlow Landing Page — GTM Optimized
 * Flow: Hero > Product Preview > Pain Points > How It Works > Comparison > Pricing > Transparency > CTA
 */

import { useState, useEffect } from 'react';
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

  // Fetch current waitlist count on mount
  useEffect(() => {
    fetch('/api/waitlist')
      .then(r => r.json())
      .then(data => { if (data.count) setWaitlistCount(data.count); })
      .catch(() => {});
  }, []);

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
          setShowStep2(true);
          setWaitlistCount(data.position || null);
        } else {
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
            <Link href="/dashboard" className="text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors">
              看 Demo
            </Link>
            <a href="#waitlist" className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
              抢先体验
            </a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section id="waitlist" className="pt-32 pb-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 rounded-full text-sm text-indigo-700 font-medium mb-8">
            <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
            限量内测{waitlistCount ? ` — 已有 ${waitlistCount}/100 位投资人加入` : ' — 仅限前 100 位投资人'}
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight mb-6">
            别人发 TS 的时候
            <br />
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              你才刚看到 deal
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed">
            DealFlow 在项目融资之前就帮你发现它。AI 全天候扫描 PH、GitHub、Twitter，
            按你的 thesis 打分，每天早上推送 3-5 个精选 deal — 比 Crunchbase 快 2-4 周。
          </p>

          {/* Dual CTA */}
          <div className="flex items-center justify-center gap-4 flex-wrap mb-4">
            <Link
              href="/dashboard"
              className="px-6 py-3 border-2 border-indigo-200 text-indigo-700 rounded-lg font-medium hover:bg-indigo-50 transition-colors"
            >
              先看 AI 评分效果
            </Link>
            {!submitted && !showStep2 && (
              <form onSubmit={handleEmailSubmit} className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="你的邮箱"
                  required
                  className="w-48 px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-lg shadow-indigo-200 whitespace-nowrap"
                >
                  {submitting ? '...' : '抢先体验'}
                </button>
              </form>
            )}
          </div>
          {!submitted && !showStep2 && (
            <p className="text-xs text-gray-400">免费加入，无垃圾邮件。上线后第一时间通知你。</p>
          )}
          {errorMsg && <p className="text-sm text-red-600 mt-2">{errorMsg}</p>}

          {/* Step 2: after email captured */}
          {showStep2 && !submitted && (
            <form onSubmit={handleEmailSubmit} className="max-w-md mx-auto mt-6">
              <div className="space-y-3 text-left">
                <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-700 text-center">
                  {waitlistCount ? `你是第 ${waitlistCount} 位！` : '已加入！'} 帮我们更了解你：
                </div>
                <select
                  value={role}
                  onChange={e => setRole(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                >
                  <option value="">你的身份是？（可选）</option>
                  <option value="angel">Solo Angel</option>
                  <option value="micro_fund">Micro Fund GP/LP</option>
                  <option value="vc_associate">VC Associate / Analyst</option>
                  <option value="founder">Founder（了解投资人视角）</option>
                  <option value="other">其他</option>
                </select>
                <textarea
                  value={painPoint}
                  onChange={e => setPainPoint(e.target.value)}
                  placeholder="你现在怎么找 deal？最大的痛点是什么？（可选）"
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
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                  >
                    {submitting ? '提交中...' : '提交'}
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
            </form>
          )}

          {/* Submitted state — guide to set preferences */}
          {submitted && (
            <div className="max-w-md mx-auto mt-6 bg-green-50 border border-green-200 rounded-xl p-6">
              <div className="text-2xl mb-2">🎉</div>
              <p className="text-green-800 font-medium mb-1">你已加入等候名单！</p>
              <p className="text-green-600 text-sm mb-4">
                {waitlistCount ? `你是第 ${waitlistCount} 位。` : ''}上线后第一时间通知你。
              </p>
              <Link href="/dashboard?tab=settings" className="inline-block text-sm text-indigo-600 hover:underline font-medium">
                现在设置投资偏好 → 上线首日即获精准推荐
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Product Preview — Show dont tell */}
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-center text-sm font-semibold text-indigo-600 uppercase tracking-wide mb-3">
            这就是你每天早上收到的东西
          </h2>
          <p className="text-center text-gray-500 text-sm mb-8">真实 AI 评分效果 · 非设计稿</p>

          {/* Mock Brief Preview */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden max-w-4xl mx-auto">
            {/* Mock browser chrome */}
            <div className="bg-gray-50 border-b border-gray-200 px-6 py-3 flex items-center gap-3">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
              </div>
              <span className="text-xs text-gray-400 ml-2">DealFlow — 今日发现</span>
            </div>
            {/* Mock content */}
            <div className="p-6 sm:p-8 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">今日发现</h3>
                <span className="text-xs text-gray-400">已分析 5 个项目 · 最高分 92</span>
              </div>
              {/* Mini deal cards */}
              <div className="space-y-3">
                {[
                  { name: 'Raycast', score: 92, verdict: '强匹配', color: 'green', tagline: '极速 macOS 启动器 · 5万+ DAU · B轮 $30M', action: '本轮 2 周内关闭 — 建议立即联系' },
                  { name: 'Trigger.dev', score: 85, verdict: '强匹配', color: 'green', tagline: 'TypeScript 后台任务框架 · YC W23 · $2B+ 市场', action: '创始人 Twitter 活跃 — 可直接 DM' },
                  { name: 'Unkey', score: 78, verdict: '中等', color: 'yellow', tagline: '开源 API 密钥管理 · 3.2K Stars · 月增 40%', action: '继续观察 2 周 — 关注 Star 增速' },
                ].map(deal => (
                  <div key={deal.name} className="flex items-center gap-4 p-3 rounded-lg bg-gray-50 border border-gray-100">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                      deal.color === 'green' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {deal.score}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 text-sm">{deal.name}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                          deal.color === 'green' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>{deal.verdict}</span>
                      </div>
                      <p className="text-xs text-gray-500 truncate">{deal.tagline}</p>
                      <p className="text-xs text-indigo-600 mt-0.5">🎯 {deal.action}</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <span className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-sm">👍</span>
                      <span className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-sm">👎</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-center pt-2">
                <span className="text-xs text-gray-400">👍👎 训练 AI → 越用越懂你的 thesis</span>
              </div>
            </div>
          </div>

          {/* CTA below preview */}
          <div className="text-center mt-8">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
            >
              体验完整 Demo — 含 5 个真实评分项目
            </Link>
          </div>
        </div>
      </section>

      {/* Pain Points — Investor-native language */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
            你的 deal flow 有这些问题吗？
          </h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            来自 AngelList 社区、On Deck Angels 和 Twitter/X 上真实投资人的声音。
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: '⏰',
                title: 'Deal 到你手里已经被 mark up 了',
                desc: '"等我看到一个项目，3 家基金已经发了 TS。种子轮现在 3 周就 close 了，我根本来不及做 DD。"',
                source: '— On Deck Angels',
                stat: '结构性时间差',
              },
              {
                icon: '😵',
                title: '每天 2 小时刷信息流，90% 是噪音',
                desc: '"我每天早上刷 Twitter、PH、Slack 群找 pre-seed signal。大部分时间在过滤垃圾，真正有 founder-market fit 的项目淹没在里面。"',
                source: '— AngelList 社区',
                stat: '效率黑洞',
              },
              {
                icon: '💸',
                title: 'Pitchbook $25K/年，我 check size $50K',
                desc: '"专业工具是给 AUM $100M+ 的基金设计的。我一年投 10 个项目，年费比我一笔投资还贵。而且它们只有融资后数据。"',
                source: '— Twitter/X',
                stat: '价格与需求错配',
              },
            ].map(item => (
              <div key={item.title} className="bg-white rounded-xl p-8 border border-gray-200">
                <div className="text-3xl mb-4">{item.icon}</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{item.title}</h3>
                <p className="text-gray-600 text-sm mb-2 italic">{item.desc}</p>
                <p className="text-xs text-gray-400 mb-3">{item.source}</p>
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
            3 步开始，5 分钟搞定
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: '告诉 AI 你的 thesis',
                desc: '赛道、阶段、地域、你看重的 signal（GitHub 增速、repeat founder、PLG traction...）。5 分钟设置。',
                icon: '🎯',
              },
              {
                step: '02',
                title: 'AI 24/7 扫描 + 评分',
                desc: '持续监控 Product Hunt、GitHub Trending、融资新闻、创始人动态。过滤噪音，只留下匹配你 thesis 的 deal。',
                icon: '🤖',
              },
              {
                step: '03',
                title: '每天早上收 brief',
                desc: '3-5 个精选项目，附带匹配评分、strengths/risks 分析、建议 next step。你的反馈让 AI 越来越准。',
                icon: '📬',
              },
            ].map(item => (
              <div key={item.step} className="text-center">
                <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4">
                  {item.icon}
                </div>
                <div className="text-xs font-bold text-indigo-600 mb-2">STEP {item.step}</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm">{item.desc}</p>
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
            Crunchbase 让你搜索已融资的公司。<strong>DealFlow 在它们融资之前就告诉你。</strong>
          </p>
          <div className="overflow-x-auto">
            <table className="w-full bg-white rounded-xl border border-gray-200 overflow-hidden">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 sm:px-6 py-4 text-left text-sm font-medium text-gray-500"></th>
                  <th className="px-4 sm:px-6 py-4 text-center text-sm font-medium text-gray-500">Pitchbook</th>
                  <th className="px-4 sm:px-6 py-4 text-center text-sm font-medium text-gray-500">Crunchbase Pro</th>
                  <th className="px-4 sm:px-6 py-4 text-center text-sm font-medium text-indigo-700 bg-indigo-50 border-x-2 border-indigo-200 relative">
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap">推荐</span>
                    DealFlow
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="px-4 sm:px-6 py-4 text-sm text-gray-700 font-medium">年费</td>
                  <td className="px-4 sm:px-6 py-4 text-center text-sm text-gray-600">$25,000+</td>
                  <td className="px-4 sm:px-6 py-4 text-center text-sm text-gray-600">$588</td>
                  <td className="px-4 sm:px-6 py-4 text-center text-sm font-semibold text-indigo-700 bg-indigo-50/50 border-x-2 border-indigo-100">$1,188</td>
                </tr>
                <tr>
                  <td className="px-4 sm:px-6 py-4 text-sm text-gray-700 font-medium">发现时机</td>
                  <td className="px-4 sm:px-6 py-4 text-center text-sm text-gray-600">融资后</td>
                  <td className="px-4 sm:px-6 py-4 text-center text-sm text-gray-600">融资后</td>
                  <td className="px-4 sm:px-6 py-4 text-center text-sm font-semibold text-indigo-700 bg-indigo-50/50 border-x-2 border-indigo-100">融资前 2-4 周</td>
                </tr>
                <tr>
                  <td className="px-4 sm:px-6 py-4 text-sm text-gray-700 font-medium">使用方式</td>
                  <td className="px-4 sm:px-6 py-4 text-center text-sm text-gray-600">你主动搜索</td>
                  <td className="px-4 sm:px-6 py-4 text-center text-sm text-gray-600">你主动搜索</td>
                  <td className="px-4 sm:px-6 py-4 text-center text-sm font-semibold text-indigo-700 bg-indigo-50/50 border-x-2 border-indigo-100">AI 主动推送</td>
                </tr>
                <tr>
                  <td className="px-4 sm:px-6 py-4 text-sm text-gray-700 font-medium">个性化</td>
                  <td className="px-4 sm:px-6 py-4 text-center text-sm text-gray-600">通用筛选</td>
                  <td className="px-4 sm:px-6 py-4 text-center text-sm text-gray-600">通用筛选</td>
                  <td className="px-4 sm:px-6 py-4 text-center text-sm font-semibold text-indigo-700 bg-indigo-50/50 border-x-2 border-indigo-100">按你的 thesis 打分</td>
                </tr>
                <tr>
                  <td className="px-4 sm:px-6 py-4 text-sm text-gray-700 font-medium">信号来源</td>
                  <td className="px-4 sm:px-6 py-4 text-center text-sm text-gray-600">融资数据库</td>
                  <td className="px-4 sm:px-6 py-4 text-center text-sm text-gray-600">融资数据库</td>
                  <td className="px-4 sm:px-6 py-4 text-center text-sm font-semibold text-indigo-700 bg-indigo-50/50 border-x-2 border-indigo-100">PH + GitHub + 社交 + 融资</td>
                </tr>
                <tr>
                  <td className="px-4 sm:px-6 py-4 text-sm text-gray-700 font-medium">每日时间成本</td>
                  <td className="px-4 sm:px-6 py-4 text-center text-sm text-gray-600">1-2 小时</td>
                  <td className="px-4 sm:px-6 py-4 text-center text-sm text-gray-600">30-60 分钟</td>
                  <td className="px-4 sm:px-6 py-4 text-center text-sm font-semibold text-indigo-700 bg-indigo-50/50 border-x-2 border-indigo-100">5 分钟</td>
                </tr>
                <tr className="bg-indigo-50/30">
                  <td className="px-4 sm:px-6 py-4 text-sm text-indigo-700 font-semibold">ROI</td>
                  <td className="px-4 sm:px-6 py-4 text-center text-sm text-gray-500">适合 AUM $100M+</td>
                  <td className="px-4 sm:px-6 py-4 text-center text-sm text-gray-500">数据库，非发现工具</td>
                  <td className="px-4 sm:px-6 py-4 text-center text-sm font-semibold text-indigo-700 bg-indigo-50/50 border-x-2 border-indigo-100">多发现 1 个好 deal = 40x</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-center text-xs text-gray-400 mt-3 sm:hidden">← 左右滑动查看完整对比 →</p>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">定价</h2>
          <p className="text-center text-gray-600 mb-4">天使投资平均 check size $50K。DealFlow 年费 = 一笔投资的 2.4%。多发现一个好项目，回报就是 40 倍。</p>
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
                <li className="flex items-center gap-2"><span className="text-yellow-300">✓</span> 每日简报（每天早上推送）</li>
                <li className="flex items-center gap-2"><span className="text-yellow-300">✓</span> 全部来源 + 融资 + 社交</li>
                <li className="flex items-center gap-2"><span className="text-yellow-300">✓</span> 自定义 thesis & 信号权重</li>
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

      {/* Transparency — reframed as exclusivity */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">为什么现在加入</h2>
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-left space-y-4 text-gray-700">
            <p>
              <strong>Early Access 特权：</strong>前 100 位用户将直接塑造产品方向。你的每一条反馈都是产品决策的输入 — 从评分算法权重到信号源优先级，你说了算。
            </p>
            <p>
              <strong>当前状态：</strong>核心功能已可用 — AI 评分引擎、每日简报生成、反馈飞轮学习。我们选择在产品能跑通完整闭环时就开放，而不是等到"完美"。
            </p>
            <p>
              <strong>技术选型：</strong>Next.js + DeepSeek API + SQLite。选择 DeepSeek 是因为它在投资分析场景下的性价比是 GPT-4 的 10 倍。选择 SQLite 是因为 MVP 阶段的数据规模不需要分布式数据库 — 我们把精力花在算法而非基础设施上。
            </p>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-20 px-6 bg-gradient-to-br from-indigo-600 to-purple-700">
        <div className="max-w-3xl mx-auto text-center text-white">
          <h2 className="text-3xl font-bold mb-4">别等 deal 到你手里已经被 mark up 两轮</h2>
          <p className="text-indigo-100 text-lg mb-8">
            每天早上 5 分钟。在别人还在刷 Twitter 的时候，你已经看完了今天值得关注的项目。
            <br />加入等候名单或直接体验 AI 评分 — 无需注册。
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <a href="#waitlist" className="px-8 py-4 bg-white text-indigo-600 rounded-xl text-lg font-medium hover:bg-indigo-50 transition-colors shadow-lg">
              抢先体验
            </a>
            <Link href="/dashboard" className="px-8 py-4 border-2 border-white/50 text-white rounded-xl text-lg font-medium hover:bg-white/10 transition-colors">
              看看 AI 评分效果 →
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
            <a href="https://twitter.com/dealaboratory" target="_blank" rel="noopener noreferrer" className="hover:text-gray-900 transition-colors">Twitter/X</a>
            <a href="https://github.com/Circuit94/dealflow" target="_blank" rel="noopener noreferrer" className="hover:text-gray-900 transition-colors">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
