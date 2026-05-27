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
        setErrorMsg(data.error || 'Submission failed');
      }
    } catch {
      setErrorMsg('Network error, please try again');
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
              Compare
            </a>
            <a href="#pricing" className="text-sm text-gray-600 hover:text-gray-900 transition-colors hidden sm:inline">
              Pricing
            </a>
            <Link href="/dashboard" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
              Demo
            </Link>
            <a href="#waitlist" className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
              Get Early Access
            </a>
          </div>
        </div>
      </nav>

      {/* Hero + Waitlist */}
      <section id="waitlist" className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 rounded-full text-sm text-indigo-700 font-medium mb-8">
            <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
            Early Access — Limited to first 100 investors
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight mb-6">
            Your AI
            <br />
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Deal Sourcing Agent
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed">
            Stop manually scrolling Product Hunt and Twitter. DealFlow scans the internet 24/7,
            scores every project against your investment thesis, and delivers a curated daily brief
            — so you never miss the next breakout company.
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
                    placeholder="Your email"
                    required
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-lg shadow-indigo-200 whitespace-nowrap"
                  >
                    {submitting ? '...' : 'Get Early Access →'}
                  </button>
                </div>
              ) : (
                /* Step 2: Optional details (after email captured) */
                <div className="space-y-3 text-left">
                  <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-700 text-center">
                    ✓ You&apos;re in! {waitlistCount ? `#${waitlistCount} on the list.` : ''} Help us build the right product:
                  </div>
                  <select
                    value={role}
                    onChange={e => setRole(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  >
                    <option value="">What best describes you? (optional)</option>
                    <option value="angel">Solo Angel Investor</option>
                    <option value="micro_fund">Micro-fund GP/LP</option>
                    <option value="vc_associate">VC Associate/Analyst</option>
                    <option value="founder">Founder (curious about investor POV)</option>
                    <option value="other">Other</option>
                  </select>
                  <textarea
                    value={painPoint}
                    onChange={e => setPainPoint(e.target.value)}
                    placeholder="What's your biggest pain point in finding deals? (optional)"
                    rows={2}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none"
                  />
                  <select
                    value={priceWilling}
                    onChange={e => setPriceWilling(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  >
                    <option value="">What would you pay monthly? (optional)</option>
                    <option value="0">$0 — Free only</option>
                    <option value="29">$29/mo — If it saves me time</option>
                    <option value="49">$49/mo — If it&apos;s genuinely useful</option>
                    <option value="99">$99/mo — If it saves me 10+ hrs/week</option>
                    <option value="149+">$149+/mo — If the ROI is clear</option>
                  </select>
                  {errorMsg && <p className="text-sm text-red-600">{errorMsg}</p>}
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                    >
                      {submitting ? 'Saving...' : 'Submit & Done'}
                    </button>
                    <button
                      type="button"
                      onClick={skipStep2}
                      className="px-4 py-3 text-gray-500 hover:text-gray-700 text-sm font-medium transition-colors"
                    >
                      Skip
                    </button>
                  </div>
                </div>
              )}
              {!showStep2 && (
                <p className="text-xs text-gray-400 mt-3">Free to join. No spam. First access when we launch.</p>
              )}
              {!showStep2 && errorMsg && <p className="text-sm text-red-600 mt-2">{errorMsg}</p>}
            </form>
          ) : (
            <div className="max-w-md mx-auto bg-green-50 border border-green-200 rounded-xl p-6">
              <div className="text-2xl mb-2">🎉</div>
              <p className="text-green-800 font-medium mb-1">You&apos;re on the list!</p>
              <p className="text-green-600 text-sm">
                {waitlistCount ? `You're #${waitlistCount}. ` : ''}We&apos;ll notify you as soon as we launch.
              </p>
              <Link href="/dashboard" className="inline-block mt-4 text-sm text-indigo-600 hover:underline">
                Try the demo now →
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Pain Points */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
            The Deal Sourcing Problem
          </h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            Based on AngelList community discussions, On Deck Angels public shares, and investor conversations on Twitter/X.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: '⏰',
                title: '10+ hours/week scanning manually',
                desc: '"I spend 1-2 hours every morning scanning Twitter, PH, and Slack groups. 90% is noise." — AngelList community',
                stat: 'High-frequency pain',
              },
              {
                icon: '😵',
                title: 'Best deals found too late',
                desc: '"By the time I see a deal, 3 funds already have term sheets out. Seed rounds close in 3 weeks now." — On Deck Angels',
                stat: 'Structural problem',
              },
              {
                icon: '💸',
                title: 'Pro tools are too expensive',
                desc: '"Pitchbook is $25K/yr, Harmonic is $15K/yr. I do 10 deals a year — can\'t justify that." — Twitter/X',
                stat: 'Price gap',
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
            How DealFlow Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Set your thesis',
                desc: 'Tell us your sectors, stage, geography, and what signals matter to you. Takes 5 minutes.',
                icon: '🎯',
              },
              {
                step: '02',
                title: 'AI scans 24/7',
                desc: 'Our agent monitors Product Hunt, GitHub Trending, funding news, and founder activity — filtering out the noise.',
                icon: '🤖',
              },
              {
                step: '03',
                title: 'Daily deal brief',
                desc: 'Every morning, get 3-5 curated projects with match scores, highlights, and suggested next actions.',
                icon: '📬',
              },
            ].map(item => (
              <div key={item.step} className="text-center">
                <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4">
                  {item.icon}
                </div>
                <div className="text-xs font-bold text-indigo-600 mb-2">STEP {item.step}</div>
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
            Why DealFlow
          </h2>
          <p className="text-center text-gray-600 mb-12">
            There&apos;s no shortage of databases. What&apos;s missing is an agent that reads everything and tells you what matters.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full bg-white rounded-xl border border-gray-200 overflow-hidden">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500"></th>
                  <th className="px-6 py-4 text-center text-sm font-medium text-gray-500">Pitchbook</th>
                  <th className="px-6 py-4 text-center text-sm font-medium text-gray-500">Crunchbase Pro</th>
                  <th className="px-6 py-4 text-center text-sm font-medium text-indigo-700 bg-indigo-50 border-x-2 border-indigo-200 relative">
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs px-2 py-0.5 rounded-full font-medium">Recommended</span>
                    DealFlow
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="px-6 py-4 text-sm text-gray-700 font-medium">Annual cost</td>
                  <td className="px-6 py-4 text-center text-sm text-gray-600">$25,000+</td>
                  <td className="px-6 py-4 text-center text-sm text-gray-600">$588</td>
                  <td className="px-6 py-4 text-center text-sm font-semibold text-indigo-700 bg-indigo-50/50 border-x-2 border-indigo-100">$1,188</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm text-gray-700 font-medium">Mode</td>
                  <td className="px-6 py-4 text-center text-sm text-gray-600">You search</td>
                  <td className="px-6 py-4 text-center text-sm text-gray-600">You search</td>
                  <td className="px-6 py-4 text-center text-sm font-semibold text-indigo-700 bg-indigo-50/50 border-x-2 border-indigo-100">Pushed to you</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm text-gray-700 font-medium">Personalization</td>
                  <td className="px-6 py-4 text-center text-sm text-gray-600">Generic filters</td>
                  <td className="px-6 py-4 text-center text-sm text-gray-600">Generic filters</td>
                  <td className="px-6 py-4 text-center text-sm font-semibold text-indigo-700 bg-indigo-50/50 border-x-2 border-indigo-100">Scored by your thesis</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm text-gray-700 font-medium">Signal sources</td>
                  <td className="px-6 py-4 text-center text-sm text-gray-600">Funding data</td>
                  <td className="px-6 py-4 text-center text-sm text-gray-600">Funding data</td>
                  <td className="px-6 py-4 text-center text-sm font-semibold text-indigo-700 bg-indigo-50/50 border-x-2 border-indigo-100">PH + GitHub + Social + Funding</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm text-gray-700 font-medium">Target user</td>
                  <td className="px-6 py-4 text-center text-sm text-gray-600">Fund teams</td>
                  <td className="px-6 py-4 text-center text-sm text-gray-600">Everyone</td>
                  <td className="px-6 py-4 text-center text-sm font-semibold text-indigo-700 bg-indigo-50/50 border-x-2 border-indigo-100">Solo angels & micro-funds</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm text-gray-700 font-medium">Daily time cost</td>
                  <td className="px-6 py-4 text-center text-sm text-gray-600">1-2 hours</td>
                  <td className="px-6 py-4 text-center text-sm text-gray-600">30-60 min</td>
                  <td className="px-6 py-4 text-center text-sm font-semibold text-indigo-700 bg-indigo-50/50 border-x-2 border-indigo-100">5 min (read brief)</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-center text-sm text-gray-500 mt-6">
            DealFlow is &quot;Morning Brew for investors&quot; — instead of giving you a database to search, it tells you every morning what&apos;s worth looking at.
          </p>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">Pricing</h2>
          <p className="text-center text-gray-600 mb-4">Average angel deal is $50K. DealFlow annual = 2.4% of one investment. Find one extra good deal and it pays for itself 40x.</p>
          <p className="text-center text-xs text-gray-400 mb-12">Pricing anchored between Crunchbase Pro ($49/mo) and Harmonic ($1,250/mo).</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {/* Free */}
            <div className="bg-white rounded-xl border border-gray-200 p-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Explorer</h3>
              <div className="text-3xl font-bold text-gray-900 mb-6">$0<span className="text-base font-normal text-gray-500">/mo</span></div>
              <ul className="space-y-3 text-gray-600 mb-8">
                <li className="flex items-center gap-2"><span className="text-green-500">✓</span> 3 scored deals per day</li>
                <li className="flex items-center gap-2"><span className="text-green-500">✓</span> Weekly brief (Monday only)</li>
                <li className="flex items-center gap-2"><span className="text-green-500">✓</span> Product Hunt + GitHub sources</li>
                <li className="flex items-center gap-2"><span className="text-gray-300">✗</span> <span className="text-gray-400">Custom thesis tuning</span></li>
                <li className="flex items-center gap-2"><span className="text-gray-300">✗</span> <span className="text-gray-400">Funding news + social signals</span></li>
              </ul>
              <a href="#waitlist" className="block w-full text-center px-6 py-3 border border-gray-200 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors">
                Join Waitlist
              </a>
            </div>
            {/* Pro */}
            <div className="bg-indigo-600 rounded-xl p-8 text-white relative overflow-hidden">
              <div className="absolute top-4 right-4 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full">
                Early Bird
              </div>
              <h3 className="text-lg font-semibold mb-2">Pro</h3>
              <div className="text-3xl font-bold mb-1">$99<span className="text-base font-normal text-indigo-200">/mo</span></div>
              <p className="text-indigo-200 text-xs mb-6">Locked for first 100 users. May increase later.</p>
              <ul className="space-y-3 text-indigo-100 mb-8">
                <li className="flex items-center gap-2"><span className="text-yellow-300">✓</span> Unlimited scored deals</li>
                <li className="flex items-center gap-2"><span className="text-yellow-300">✓</span> Daily brief (every morning)</li>
                <li className="flex items-center gap-2"><span className="text-yellow-300">✓</span> All sources + funding + social</li>
                <li className="flex items-center gap-2"><span className="text-yellow-300">✓</span> Custom thesis & signal weights</li>
                <li className="flex items-center gap-2"><span className="text-yellow-300">✓</span> Slack / Email / Lark delivery</li>
                <li className="flex items-center gap-2"><span className="text-yellow-300">✓</span> Export deal pipeline CSV</li>
              </ul>
              <a href="#waitlist" className="block w-full text-center px-6 py-3 bg-white text-indigo-600 rounded-lg font-medium hover:bg-indigo-50 transition-colors">
                Get Early Access · Lock Price
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Transparency */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">About This Project</h2>
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-left space-y-4 text-gray-700">
            <p>
              <strong>Honest disclosure:</strong> DealFlow is in MVP stage. We don&apos;t have fake testimonials because we believe the first step in GTM is validating real demand, not manufacturing social proof.
            </p>
            <p>
              <strong>Current status:</strong> Core features work (AI scoring + daily brief + feedback flywheel). We&apos;re looking for our first 100 early users to shape the product together. Your feedback directly influences what we build next.
            </p>
            <p>
              <strong>Tech:</strong> Next.js + DeepSeek API + SQLite. DeepSeek because it&apos;s 10x cheaper than GPT-4 at comparable quality. SQLite because MVP doesn&apos;t need distributed databases.
            </p>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-20 px-6 bg-gradient-to-br from-indigo-600 to-purple-700">
        <div className="max-w-3xl mx-auto text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Never miss the next breakout company</h2>
          <p className="text-indigo-100 text-lg mb-8">
            5 minutes every morning. Curated deals scored against your thesis.
            <br />Join the waitlist or try the demo — no signup required.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <a href="#waitlist" className="px-8 py-4 bg-white text-indigo-600 rounded-xl text-lg font-medium hover:bg-indigo-50 transition-colors shadow-lg">
              Get Early Access
            </a>
            <Link href="/dashboard" className="px-8 py-4 border-2 border-white/50 text-white rounded-xl text-lg font-medium hover:bg-white/10 transition-colors">
              Try Demo →
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
