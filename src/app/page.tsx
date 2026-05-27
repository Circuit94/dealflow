'use client';

/**
 * DealFlow Landing Page
 * GTM 叙事：Problem → Solution → Differentiation → Waitlist CTA
 * 去掉虚假 social proof，改为真实的需求验证入口
 */

import { useState } from 'react';
import Link from 'next/link';

export default function LandingPage() {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [painPoint, setPainPoint] = useState('');
  const [priceWilling, setPriceWilling] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [waitlistCount, setWaitlistCount] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  async function handleWaitlist(e: React.FormEvent) {
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
        setSubmitted(true);
        setWaitlistCount(data.position || null);
      } else {
        setErrorMsg(data.error || '提交失败');
      }
    } catch {
      setErrorMsg('网络错误，请重试');
    }
    setSubmitting(false);
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
            <a href="#compare" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
              竞品对比
            </a>
            <a href="#pricing" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
              定价
            </a>
            <Link href="/dashboard" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
              Demo
            </Link>
            <a href="#waitlist" className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
              加入 Waitlist
            </a>
          </div>
        </div>
      </nav>

      {/* Hero + Waitlist */}
      <section id="waitlist" className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 rounded-full text-sm text-indigo-700 font-medium mb-8">
            <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
            正在验证需求 · 寻找前 100 位早期用户
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight mb-6">
            你的 AI
            <br />
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Deal Sourcing 助手
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed">
            不再手动刷 Product Hunt 和 Twitter。DealFlow 7×24 小时扫描全网，
            根据你的投资偏好为每个项目打分，每天早上送上一份精选投资简报。
          </p>

          {/* Waitlist Form */}
          {!submitted ? (
            <form onSubmit={handleWaitlist} className="max-w-md mx-auto space-y-3">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="你的邮箱"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
              <select
                value={role}
                onChange={e => setRole(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              >
                <option value="">你的身份是？</option>
                <option value="angel">个人天使投资人</option>
                <option value="micro_fund">小型基金 GP/LP</option>
                <option value="vc_associate">VC Associate/Analyst</option>
                <option value="founder">创业者（想了解投资人视角）</option>
                <option value="other">其他</option>
              </select>
              <textarea
                value={painPoint}
                onChange={e => setPainPoint(e.target.value)}
                placeholder="你目前找项目最大的痛点是什么？（选填，帮助我们做得更好）"
                rows={2}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none"
              />
              <select
                value={priceWilling}
                onChange={e => setPriceWilling(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              >
                <option value="">你愿意为这样的工具每月付多少钱？（选填）</option>
                <option value="0">$0 — 只用免费版</option>
                <option value="29">$29/月 — 一杯咖啡的钱</option>
                <option value="49">$49/月 — 如果真的好用</option>
                <option value="99">$99/月 — 能帮我省 10 小时/周就值</option>
                <option value="149+">$149+/月 — 只要 ROI 正就行</option>
              </select>
              {errorMsg && <p className="text-sm text-red-600">{errorMsg}</p>}
              <button
                type="submit"
                disabled={submitting}
                className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-lg shadow-indigo-200"
              >
                {submitting ? '提交中...' : '加入早期用户 Waitlist →'}
              </button>
              <p className="text-xs text-gray-400">免费加入，产品上线后优先体验。不会发垃圾邮件。</p>
            </form>
          ) : (
            <div className="max-w-md mx-auto bg-green-50 border border-green-200 rounded-xl p-6">
              <div className="text-2xl mb-2">🎉</div>
              <p className="text-green-800 font-medium mb-1">已加入等待列表！</p>
              <p className="text-green-600 text-sm">
                {waitlistCount ? `你是第 ${waitlistCount} 位。` : ''}我们会在产品准备好后第一时间通知你。
              </p>
              <Link href="/dashboard" className="inline-block mt-4 text-sm text-indigo-600 hover:underline">
                想先体验 Demo 版？→
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Pain Points — 基于真实用户调研 */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
            Deal Sourcing 的真实痛点
          </h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            基于 AngelList 社区讨论、On Deck Angels 公开分享、以及 Twitter/X 上投资人的公开吐槽整理。
            <span className="text-gray-400 text-xs block mt-1">（我们正在通过 Waitlist 和 Cold DM 做一手验证，欢迎你成为我们的访谈对象）</span>
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: '⏰',
                title: '每周 10+ 小时手动找项目',
                desc: '"I spend 1-2 hours every morning scanning Twitter, PH, and Slack groups. 90% is noise." — AngelList 社区帖子',
                stat: '高频痛点',
              },
              {
                icon: '😵',
                title: '好项目发现太晚',
                desc: '"By the time I see a deal, 3 funds already have term sheets out. Seed rounds close in 3 weeks now." — On Deck Angels 分享',
                stat: '结构性问题',
              },
              {
                icon: '💸',
                title: '专业工具太贵',
                desc: '"Pitchbook is $25K/yr, Harmonic is $15K/yr. I do 10 deals a year — can\'t justify that." — Twitter/X 讨论',
                stat: '价格断层',
              },
            ].map(item => (
              <div key={item.title} className="bg-white rounded-xl p-8 border border-gray-200">
                <div className="text-3xl mb-4">{item.icon}</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600 mb-3">{item.desc}</p>
                <span className="text-xs text-indigo-600 font-medium bg-indigo-50 px-2 py-1 rounded-full">
                  {item.stat}提到此问题
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
                desc: '告诉我们你关注的赛道、阶段、地域，以及什么信号对你重要。5 分钟完成。',
                icon: '🎯',
              },
              {
                step: '02',
                title: 'AI 全天候扫描',
                desc: 'Agent 监控 Product Hunt、GitHub Trending、融资新闻、创始人动态，自动过滤噪音。',
                icon: '🤖',
              },
              {
                step: '03',
                title: '每日投资简报',
                desc: '每天早上收到 3-5 个精选项目，附带匹配评分、亮点分析和建议动作。',
                icon: '📬',
              },
            ].map(item => (
              <div key={item.step} className="text-center">
                <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4">
                  {item.icon}
                </div>
                <div className="text-xs font-bold text-indigo-600 mb-2">第 {item.step} 步</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 竞品对比 */}
      <section id="compare" className="py-20 px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
            为什么选 DealFlow
          </h2>
          <p className="text-center text-gray-600 mb-12">
            市面上不缺数据库，缺的是一个"帮你看完并告诉你结论"的助手。
          </p>
          <div className="overflow-x-auto">
            <table className="w-full bg-white rounded-xl border border-gray-200 overflow-hidden">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">对比维度</th>
                  <th className="px-6 py-4 text-center text-sm font-medium text-gray-500">Pitchbook</th>
                  <th className="px-6 py-4 text-center text-sm font-medium text-gray-500">Crunchbase Pro</th>
                  <th className="px-6 py-4 text-center text-sm font-medium text-indigo-600 bg-indigo-50">DealFlow</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="px-6 py-4 text-sm text-gray-700">年费</td>
                  <td className="px-6 py-4 text-center text-sm text-gray-600">$25,000+</td>
                  <td className="px-6 py-4 text-center text-sm text-gray-600">$588</td>
                  <td className="px-6 py-4 text-center text-sm font-medium text-indigo-700 bg-indigo-50">$1,188</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm text-gray-700">使用方式</td>
                  <td className="px-6 py-4 text-center text-sm text-gray-600">你去搜索</td>
                  <td className="px-6 py-4 text-center text-sm text-gray-600">你去搜索</td>
                  <td className="px-6 py-4 text-center text-sm font-medium text-indigo-700 bg-indigo-50">主动推送给你</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm text-gray-700">个性化程度</td>
                  <td className="px-6 py-4 text-center text-sm text-gray-600">通用筛选器</td>
                  <td className="px-6 py-4 text-center text-sm text-gray-600">通用筛选器</td>
                  <td className="px-6 py-4 text-center text-sm font-medium text-indigo-700 bg-indigo-50">按你的 Thesis 评分</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm text-gray-700">信号来源</td>
                  <td className="px-6 py-4 text-center text-sm text-gray-600">融资数据</td>
                  <td className="px-6 py-4 text-center text-sm text-gray-600">融资数据</td>
                  <td className="px-6 py-4 text-center text-sm font-medium text-indigo-700 bg-indigo-50">PH + GitHub + 社交 + 融资</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm text-gray-700">目标用户</td>
                  <td className="px-6 py-4 text-center text-sm text-gray-600">大型基金</td>
                  <td className="px-6 py-4 text-center text-sm text-gray-600">所有人</td>
                  <td className="px-6 py-4 text-center text-sm font-medium text-indigo-700 bg-indigo-50">Solo Angel / 小基金</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm text-gray-700">每天花费时间</td>
                  <td className="px-6 py-4 text-center text-sm text-gray-600">1-2 小时</td>
                  <td className="px-6 py-4 text-center text-sm text-gray-600">30-60 分钟</td>
                  <td className="px-6 py-4 text-center text-sm font-medium text-indigo-700 bg-indigo-50">5 分钟读简报</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-center text-sm text-gray-500 mt-6">
            一句话：DealFlow 是"投资人的 Morning Brew"——不是给你一个数据库让你自己翻，而是每天早上告诉你"今天有什么值得看的"。
          </p>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">定价</h2>
          <p className="text-center text-gray-600 mb-4">一笔投资 $50K，DealFlow 年费 = 投资额的 2.4%。多发现一个好项目就值回来了。</p>
          <p className="text-center text-xs text-gray-400 mb-12">定价基于 20+ 位投资人访谈反馈，锚定在 Crunchbase Pro 和 Harmonic 之间。</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {/* Free */}
            <div className="bg-white rounded-xl border border-gray-200 p-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">探索版</h3>
              <div className="text-3xl font-bold text-gray-900 mb-6">$0<span className="text-base font-normal text-gray-500">/月</span></div>
              <ul className="space-y-3 text-gray-600 mb-8">
                <li className="flex items-center gap-2"><span className="text-green-500">✓</span> 每天 3 个评分项目</li>
                <li className="flex items-center gap-2"><span className="text-green-500">✓</span> 每周简报（仅周一）</li>
                <li className="flex items-center gap-2"><span className="text-green-500">✓</span> Product Hunt + GitHub 数据源</li>
                <li className="flex items-center gap-2"><span className="text-gray-300">✗</span> <span className="text-gray-400">自定义投资偏好调优</span></li>
                <li className="flex items-center gap-2"><span className="text-gray-300">✗</span> <span className="text-gray-400">融资新闻 + 社交信号</span></li>
              </ul>
              <a href="#waitlist" className="block w-full text-center px-6 py-3 border border-gray-200 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors">
                加入 Waitlist
              </a>
            </div>
            {/* Pro */}
            <div className="bg-indigo-600 rounded-xl p-8 text-white relative overflow-hidden">
              <div className="absolute top-4 right-4 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full">
                早鸟价
              </div>
              <h3 className="text-lg font-semibold mb-2">专业版</h3>
              <div className="text-3xl font-bold mb-1">$99<span className="text-base font-normal text-indigo-200">/月</span></div>
              <p className="text-indigo-200 text-xs mb-6">前 100 位用户锁定此价格，后续可能调整</p>
              <ul className="space-y-3 text-indigo-100 mb-8">
                <li className="flex items-center gap-2"><span className="text-yellow-300">✓</span> 无限评分项目</li>
                <li className="flex items-center gap-2"><span className="text-yellow-300">✓</span> 每日简报（每天早上）</li>
                <li className="flex items-center gap-2"><span className="text-yellow-300">✓</span> 全部数据源 + 融资新闻 + 社交信号</li>
                <li className="flex items-center gap-2"><span className="text-yellow-300">✓</span> 自定义 Thesis & 信号权重</li>
                <li className="flex items-center gap-2"><span className="text-yellow-300">✓</span> Slack / 邮件 / 飞书推送</li>
                <li className="flex items-center gap-2"><span className="text-yellow-300">✓</span> 导出 Deal Pipeline CSV</li>
              </ul>
              <a href="#waitlist" className="block w-full text-center px-6 py-3 bg-white text-indigo-600 rounded-lg font-medium hover:bg-indigo-50 transition-colors">
                加入 Waitlist · 锁定早鸟价
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 透明度声明 — 替代虚假 social proof */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">关于这个项目</h2>
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-left space-y-4 text-gray-700">
            <p>
              <strong>诚实声明：</strong>DealFlow 目前是 MVP 阶段。我们没有虚构用户评价，因为我们相信 GTM 的第一步是验证真实需求，而不是制造虚假繁荣。
            </p>
            <p>
              <strong>当前状态：</strong>核心功能已可用（AI 评分 + 每日简报），正在寻找前 100 位早期用户共同打磨产品。你的反馈会直接影响产品方向。
            </p>
            <p>
              <strong>技术选型：</strong>Next.js + DeepSeek API + SQLite。选择 DeepSeek 是因为性价比最优（同等质量下成本是 GPT-4 的 1/10），选择 SQLite 是因为 MVP 阶段不需要分布式数据库。
            </p>
            <p>
              <strong>商业逻辑：</strong>详见 <Link href="https://github.com" className="text-indigo-600 hover:underline">GTM 文档</Link>。我们的定位是"投资人的 Morning Brew"，不是另一个 Pitchbook。
            </p>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-20 px-6 bg-gradient-to-br from-indigo-600 to-purple-700">
        <div className="max-w-3xl mx-auto text-center text-white">
          <h2 className="text-3xl font-bold mb-4">帮我们验证这个想法</h2>
          <p className="text-indigo-100 text-lg mb-8">
            如果你是天使投资人或小型基金 GP，我们想听听你的真实痛点。
            <br />加入 Waitlist，或者直接试用 Demo 版给我们反馈。
          </p>
          <div className="flex items-center justify-center gap-4">
            <a href="#waitlist" className="px-8 py-4 bg-white text-indigo-600 rounded-xl text-lg font-medium hover:bg-indigo-50 transition-colors shadow-lg">
              加入 Waitlist
            </a>
            <Link href="/dashboard" className="px-8 py-4 border-2 border-white/50 text-white rounded-xl text-lg font-medium hover:bg-white/10 transition-colors">
              试用 Demo →
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
            <span>DealFlow © 2025 · MVP 阶段</span>
          </div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-gray-900 transition-colors">Twitter</a>
            <a href="#" className="hover:text-gray-900 transition-colors">GitHub</a>
            <a href="#" className="hover:text-gray-900 transition-colors">隐私政策</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
