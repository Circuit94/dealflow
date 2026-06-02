'use client';

import { Suspense, useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { DealCard } from '@/components/DealCard';
import { BriefSection } from '@/components/BriefSection';
import { FilterBar } from '@/components/FilterBar';
import { PreferencesForm } from '@/components/PreferencesForm';
import { ApiConfigForm } from '@/components/ApiConfigForm';
import { SkeletonCard, SkeletonBrief } from '@/components/Skeleton';
import { I18nProvider, useI18n } from '@/lib/i18n';

// Wrap in Suspense + I18nProvider
export default function DashboardPage() {
  return (
    <I18nProvider>
      <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><span className="text-gray-400">加载中...</span></div>}>
        <Dashboard />
      </Suspense>
    </I18nProvider>
  );
}

// ============ Types ============
interface Deal {
  id: string;
  name: string;
  tagline: string;
  category: string;
  source: string;
  url: string;
  metrics: string;
  score: number;
  verdict: string;
  one_liner: string;
  strengths: string[];
  risks: string[];
  suggested_action: string;
}

type FeedbackSignal = 'interested' | 'pass' | null;

interface Brief {
  id?: number;
  content: string;
  dealCount: number;
  topScore: number;
  generatedAt: string;
}

interface BriefMeta {
  id: number;
  dealCount: number;
  topScore: number;
  generatedAt: string;
}

interface Preferences {
  sectors: string[];
  stage: string;
  geography: string;
  signals: string[];
}

interface ApiConfig {
  deepseekConfigured: boolean;
  deepseekKeyPreview: string;
  deepseekBaseUrl: string;
  deepseekModel: string;
}

type TabKey = 'brief' | 'deals' | 'settings' | 'api';

// ============ Main Dashboard ============
function Dashboard() {
  const { t, locale, setLocale } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL-synced tab state
  const tabFromUrl = (searchParams.get('tab') as TabKey) || 'brief';
  const [activeTab, setActiveTabState] = useState<TabKey>(tabFromUrl);

  function setActiveTab(tab: TabKey) {
    setActiveTabState(tab);
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    router.replace(`?${params.toString()}`, { scroll: false });
  }

  // Sync from URL on popstate/back
  useEffect(() => {
    const tab = (searchParams.get('tab') as TabKey) || 'brief';
    setActiveTabState(tab);
  }, [searchParams]);

  // Core state
  const [deals, setDeals] = useState<Deal[]>([]);
  const [brief, setBrief] = useState<Brief | null>(null);
  const [briefHistory, setBriefHistory] = useState<BriefMeta[]>([]);
  const [preferences, setPreferences] = useState<Preferences | null>(null);
  const [apiConfig, setApiConfig] = useState<ApiConfig | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [scanStatus, setScanStatus] = useState<string>('');
  const [scanError, setScanError] = useState<string>('');
  const [feedbackMap, setFeedbackMap] = useState<Record<string, FeedbackSignal>>({});

  // Filtering & sorting
  const [verdictFilter, setVerdictFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('score_desc');

  // Brief → Deal linking
  const [highlightedDealId, setHighlightedDealId] = useState<string | null>(null);

  // History brief selector
  const [showHistory, setShowHistory] = useState(false);

  // Coach mark for first-time visitors
  const [showCoachMark, setShowCoachMark] = useState(false);

  // Feedback toast
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  // Demo scan modal
  const [showDemoScanModal, setShowDemoScanModal] = useState(false);

  // ============ Data Fetching (with error isolation) ============
  const fetchData = useCallback(async () => {
    const results = await Promise.allSettled([
      fetch('/api/deals').then(r => r.json()),
      fetch('/api/brief').then(r => r.json()),
      fetch('/api/preferences').then(r => r.json()),
      fetch('/api/config').then(r => r.json()),
      fetch('/api/feedback').then(r => r.json()),
      fetch('/api/brief?list=true').then(r => r.json()),
    ]);

    const [dealsRes, briefRes, prefsRes, configRes, feedbackRes, historyRes] = results;

    if (dealsRes.status === 'fulfilled' && dealsRes.value.success) {
      setDeals(dealsRes.value.deals || []);
    }
    if (briefRes.status === 'fulfilled' && briefRes.value.success) {
      setBrief(briefRes.value.brief);
    }
    if (prefsRes.status === 'fulfilled' && prefsRes.value.success) {
      setPreferences(prefsRes.value.preferences);
    }
    if (configRes.status === 'fulfilled' && configRes.value.success) {
      setApiConfig(configRes.value.config);
    }
    if (feedbackRes.status === 'fulfilled' && feedbackRes.value.success && feedbackRes.value.feedbackMap) {
      setFeedbackMap(feedbackRes.value.feedbackMap);
    }
    if (historyRes.status === 'fulfilled' && historyRes.value.success) {
      setBriefHistory(historyRes.value.briefs || []);
    }

    setInitialLoading(false);

    // Show coach mark for first-time visitors
    if (typeof window !== 'undefined' && !localStorage.getItem('dealflow-coach-seen')) {
      setShowCoachMark(true);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ============ Demo Data (when API not configured and no real data) ============
  const isDemo = !initialLoading && !apiConfig?.deepseekConfigured && deals.length === 0;

  const demoDeals: Deal[] = useMemo(() => locale === 'zh' ? [
    {
      id: 'demo-1',
      name: 'Raycast',
      tagline: '极速、可扩展的 macOS 启动器，开发者效率神器',
      category: '开发者工具',
      source: 'product_hunt',
      url: 'https://raycast.com',
      metrics: '5万+ 日活, B轮 $30M',
      score: 92,
      verdict: 'STRONG_MATCH',
      one_liner: '顶级开发者效率工具，社区增长爆发式',
      strengths: ['庞大的开发者社区', '留存指标优秀', '可扩展平台生态'],
      risks: ['仅支持 macOS，限制市场规模', '与 Spotlight/Alfred 竞争'],
      suggested_action: '通过 AngelList 请求介绍 — 本轮 2 周内关闭',
    },
    {
      id: 'demo-2',
      name: 'Unkey',
      tagline: '开源 API 密钥管理与限流工具',
      category: '开发者工具',
      source: 'github',
      url: 'https://unkey.dev',
      metrics: '3.2K GitHub Stars, 月增长 40%',
      score: 78,
      verdict: 'MODERATE_MATCH',
      one_liner: '解决 API 认证基础设施痛点，开源社区增长强劲',
      strengths: ['开源社区护城河', '清晰的商业化路径', '连续创业者'],
      risks: ['收入阶段较早', 'API 工具赛道拥挤'],
      suggested_action: '继续观察 2 周 — 关注 Star 增速',
    },
    {
      id: 'demo-3',
      name: 'Trigger.dev',
      tagline: '开源 TypeScript 后台任务框架',
      category: '开发者工具',
      source: 'github',
      url: 'https://trigger.dev',
      metrics: '5.8K Stars, YC W23, 种子轮 $3M',
      score: 85,
      verdict: 'STRONG_MATCH',
      one_liner: '后台任务是 $2B+ 市场 — 这个团队的开发体验最好',
      strengths: ['YC 背书', 'TypeScript 生态先发优势', '极致开发体验'],
      risks: ['Inngest 资金充裕是强竞争对手', '开源商业化风险'],
      suggested_action: '在 Twitter 联系创始人 — 活跃且回复快',
    },
    {
      id: 'demo-4',
      name: 'Pika',
      tagline: 'AI 视频生成平台',
      category: 'AI/ML',
      source: 'crunchbase',
      url: 'https://pika.art',
      metrics: 'B轮 $80M, 100万+ 用户',
      score: 45,
      verdict: 'PASS',
      one_liner: '产品优秀但估值过高，不适合天使投资',
      strengths: ['病毒式传播的消费产品', '顶级 AI 研究团队'],
      risks: ['$6亿估值 — 非天使阶段', 'Runway/Sora 竞争激烈'],
      suggested_action: '跳过 — 关注二级市场机会',
    },
    {
      id: 'demo-5',
      name: 'Dub.co',
      tagline: '面向现代营销团队的开源链接管理工具',
      category: 'SaaS',
      source: 'product_hunt',
      url: 'https://dub.co',
      metrics: '12K Stars, $2M ARR, 自举转融资',
      score: 71,
      verdict: 'MODERATE_MATCH',
      one_liner: '开源版 Bitly — 独立创始人执行力惊人',
      strengths: ['融资前已有收入', '开源社区分发', '独立创始人高效执行'],
      risks: ['短链接是同质化市场', 'Bitly 有企业客户锁定'],
      suggested_action: '值得聊 30 分钟 — 创始人正在融种子轮',
    },
  ] : [
    {
      id: 'demo-1',
      name: 'Raycast',
      tagline: 'A blazingly fast, totally extendable launcher for macOS',
      category: 'Developer Tools',
      source: 'product_hunt',
      url: 'https://raycast.com',
      metrics: '50K+ DAU, $30M Series B',
      score: 92,
      verdict: 'STRONG_MATCH',
      one_liner: 'Best-in-class developer productivity tool with explosive community growth',
      strengths: ['Massive developer community', 'Strong retention metrics', 'Extensible platform play'],
      risks: ['macOS only limits TAM', 'Competing with Spotlight/Alfred'],
      suggested_action: 'Request intro via AngelList — round closing in 2 weeks',
    },
    {
      id: 'demo-2',
      name: 'Unkey',
      tagline: 'Open source API key management and rate limiting',
      category: 'Developer Tools',
      source: 'github',
      url: 'https://unkey.dev',
      metrics: '3.2K GitHub stars, 40% MoM growth',
      score: 78,
      verdict: 'MODERATE_MATCH',
      one_liner: 'Solving API auth infra pain — strong open-source traction',
      strengths: ['Open-source community moat', 'Clear monetization path', 'Repeat founder'],
      risks: ['Early revenue stage', 'Crowded API tooling space'],
      suggested_action: 'Monitor for 2 more weeks — watch star velocity',
    },
    {
      id: 'demo-3',
      name: 'Trigger.dev',
      tagline: 'The open source background jobs framework for TypeScript',
      category: 'Developer Tools',
      source: 'github',
      url: 'https://trigger.dev',
      metrics: '5.8K stars, YC W23, $3M seed',
      score: 85,
      verdict: 'STRONG_MATCH',
      one_liner: 'Background jobs is a $2B+ market — this team has the best DX',
      strengths: ['YC backed', 'TypeScript-first in growing ecosystem', 'Strong DX focus'],
      risks: ['Inngest is well-funded competitor', 'Open-source monetization risk'],
      suggested_action: 'Reach out to founder on Twitter — active and responsive',
    },
    {
      id: 'demo-4',
      name: 'Pika',
      tagline: 'AI video generation platform',
      category: 'AI/ML',
      source: 'crunchbase',
      url: 'https://pika.art',
      metrics: '$80M Series B, 1M+ users',
      score: 45,
      verdict: 'PASS',
      one_liner: 'Strong product but valuation too high for angel check size',
      strengths: ['Viral consumer product', 'Top AI research team'],
      risks: ['$600M valuation — not angel-stage', 'Runway/Sora competition'],
      suggested_action: 'Pass — monitor for secondary opportunities',
    },
    {
      id: 'demo-5',
      name: 'Dub.co',
      tagline: 'Open-source link management for modern marketing teams',
      category: 'SaaS',
      source: 'product_hunt',
      url: 'https://dub.co',
      metrics: '12K stars, $2M ARR, bootstrapped → raising',
      score: 71,
      verdict: 'MODERATE_MATCH',
      one_liner: 'Bitly killer with open-source distribution — impressive solo founder execution',
      strengths: ['Revenue-generating before raise', 'Open-source community', 'Solo founder efficiency'],
      risks: ['Link shortening is commodity', 'Bitly has enterprise lock-in'],
      suggested_action: 'Worth a 30-min call — founder is raising seed now',
    },
  ], [locale]);

  const demoBrief: Brief = useMemo(() => ({
    content: locale === 'zh'
      ? `## 今日发现 — 演示数据\n\n今日扫描发现 **5 个项目**匹配你的投资偏好，覆盖开发者工具、AI/ML 和 SaaS 赛道。\n\n### 🔥 重点推荐\n\n**Raycast**（评分: 92）— 极速 macOS 启动器，5万+ 日活。可扩展平台生态构建开发者护城河，本轮即将关闭。\n\n**Trigger.dev**（评分: 85）— YC W23 后台任务框架。TypeScript 生态先发优势，$2B+ 市场中开发体验最佳。\n\n### 👀 值得关注\n\n**Unkey**（评分: 78）— 开源 API 密钥管理，增长强劲（3.2K Stars，月增 40%）。继续观察 Star 增速。\n\n**Dub.co**（评分: 71）— 自举到 $2M ARR，正在融种子轮。独立创始人执行力惊人。\n\n### ⏭️ 已跳过\n\n**Pika**（评分: 45）— 产品优秀但 $6亿估值超出天使投资范围。\n\n---\n*这是演示数据。配置 DeepSeek API 密钥后可获取真实项目数据。*`
      : `## Daily Deal Brief — Demo\n\nToday's scan found **5 projects** matching your thesis across Developer Tools, AI/ML, and SaaS.\n\n### 🔥 Top Picks\n\n**Raycast** (Score: 92) — Blazingly fast macOS launcher with 50K+ DAU. The extensible platform play creates a developer ecosystem moat. Round closing soon.\n\n**Trigger.dev** (Score: 85) — YC W23 background jobs framework. TypeScript-first positioning in a $2B+ market with best-in-class DX.\n\n### 👀 Worth Watching\n\n**Unkey** (Score: 78) — Open-source API key management gaining traction (3.2K stars, 40% MoM). Monitor star velocity.\n\n**Dub.co** (Score: 71) — Bootstrapped to $2M ARR, now raising seed. Impressive solo founder execution.\n\n### ⏭️ Passed\n\n**Pika** (Score: 45) — Great product but $600M valuation is beyond angel range.\n\n---\n*This is demo data. Configure your DeepSeek API key to get real results from live sources.*`,
    dealCount: 5,
    topScore: 92,
    generatedAt: new Date().toISOString(),
  }), [locale]);

  // Use demo data when no real data available
  const effectiveDeals = isDemo ? demoDeals : deals;
  const effectiveBrief = isDemo ? demoBrief : brief;

  // ============ Actions ============
  async function runScan() {
    if (!apiConfig?.deepseekConfigured) {
      if (isDemo) {
        setShowDemoScanModal(true);
        return;
      }
      setScanError(t('configureApiFirst'));
      setActiveTab('api');
      return;
    }

    setLoading(true);
    setScanStatus(t('scanStatusMsg'));
    setScanError('');

    try {
      const dealsRes = await fetch('/api/deals', { method: 'POST' });
      const dealsData = await dealsRes.json();
      if (!dealsData.success) throw new Error(dealsData.error || '扫描失败');

      setScanStatus(t('scanScoredMsg', { count: dealsData.total }));

      const briefRes = await fetch('/api/brief', { method: 'POST' });
      const briefData = await briefRes.json();
      if (!briefData.success) throw new Error(briefData.error || '简报生成失败');

      setScanStatus('');
      await fetchData();
      setActiveTab('brief');
      track('scan_completed', { dealCount: dealsData.total });
    } catch (e) {
      const msg = e instanceof Error ? e.message : '未知错误';
      setScanError(msg);
      setScanStatus('');
    }
    setLoading(false);
  }

  async function sendFeedback(dealId: string, signal: 'interested' | 'pass' | null) {
    const prev = feedbackMap[dealId] || null;
    // Optimistic update
    setFeedbackMap(m => ({ ...m, [dealId]: signal }));

    // Show feedback toast
    if (signal) {
      const toastMsg = signal === 'interested'
        ? (locale === 'zh' ? 'AI 已记录偏好，未来推荐将更精准' : 'Preference noted — future picks will improve')
        : (locale === 'zh' ? '已标记跳过，同类项目将降权' : 'Marked as pass — similar deals will be deprioritized');
      setFeedbackToast(toastMsg);
      setTimeout(() => setFeedbackToast(null), 3000);
    }

    if (isDemo) return; // Demo mode: no API call

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dealId, signal }),
      });
      const data = await res.json();
      if (!data.success) {
        setFeedbackMap(m => ({ ...m, [dealId]: prev }));
      }
    } catch {
      setFeedbackMap(m => ({ ...m, [dealId]: prev }));
    }
  }

  function track(eventType: string, eventData?: Record<string, unknown>) {
    fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventType, eventData, page: 'dashboard' }),
    }).catch(() => {});
  }

  // Brief → Deal jump
  function handleDealClick(dealName: string) {
    const deal = deals.find(d => d.name === dealName);
    if (deal) {
      setHighlightedDealId(deal.id);
      setActiveTab('deals');
      // Clear highlight after animation
      setTimeout(() => setHighlightedDealId(null), 3000);
    }
  }

  // Load a specific historical brief
  async function loadBrief(id: number) {
    try {
      const res = await fetch(`/api/brief?id=${id}`);
      const data = await res.json();
      if (data.success && data.brief) {
        setBrief(data.brief);
        setShowHistory(false);
      }
    } catch { /* ignore */ }
  }

  // ============ Filtered & Sorted Deals ============
  // Extract unique categories for filter dropdown
  const categories = useMemo(() => {
    const cats = [...new Set(effectiveDeals.map(d => d.category).filter(Boolean))];
    return cats.sort();
  }, [effectiveDeals]);

  const filteredDeals = useMemo(() => {
    let result = effectiveDeals.filter(deal => {
      if (verdictFilter !== 'all' && deal.verdict !== verdictFilter) return false;
      if (sourceFilter !== 'all' && deal.source !== sourceFilter) return false;
      if (categoryFilter !== 'all' && deal.category !== categoryFilter) return false;
      return true;
    });

    result.sort((a, b) => {
      switch (sortBy) {
        case 'score_asc': return (a.score || 0) - (b.score || 0);
        case 'date_desc': return 0; // already sorted by API
        case 'date_asc': return 0;
        case 'score_desc':
        default: return (b.score || 0) - (a.score || 0);
      }
    });

    return result;
  }, [effectiveDeals, verdictFilter, sourceFilter, categoryFilter, sortBy]);

  const dealNames = useMemo(() => effectiveDeals.map(d => d.name), [effectiveDeals]);

  // Dismiss coach mark
  function dismissCoachMark() {
    setShowCoachMark(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem('dealflow-coach-seen', '1');
    }
  }

  // ============ Render ============
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Demo Banner */}
      {isDemo && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 sm:px-6 py-2 text-center text-sm text-amber-800">
          📋 {locale === 'zh'
            ? <>您正在查看<strong>演示数据</strong>。请在&quot;API&quot;标签页中配置 API 密钥以获取实时数据。</>
            : <>You&apos;re viewing <strong>demo data</strong>. Configure your API key in the &quot;API&quot; tab to get live results from real sources.</>}
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">D</span>
            </div>
            <h1 className="text-lg sm:text-xl font-semibold text-gray-900">{t('appName')}</h1>
            {apiConfig?.deepseekConfigured && (
              <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full font-medium hidden sm:inline">{t('connected')}</span>
            )}
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setLocale(locale === 'en' ? 'zh' : 'en')}
              className="px-2 sm:px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              {t('langSwitch')}
            </button>
            <button
              onClick={runScan}
              disabled={loading}
              className="px-3 sm:px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? t('scanning') : t('dailyScan')}
            </button>
          </div>
        </div>
      </header>

      {/* Status Bar */}
      {(scanStatus || scanError) && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-4">
          {scanStatus && (
            <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
              <span className="animate-spin">⏳</span> {scanStatus}
            </div>
          )}
          {scanError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center justify-between">
              <span>❌ {scanError}</span>
              <button
                onClick={runScan}
                disabled={loading}
                className="ml-3 px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded-md text-xs font-medium transition-colors shrink-0"
              >
                {t('retry')}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit overflow-x-auto">
          {([
            { key: 'brief' as const, label: t('tabBrief'), labelFull: t('tabBriefFull') },
            { key: 'deals' as const, label: t('tabPipeline'), labelFull: t('tabPipelineFull') },
            { key: 'settings' as const, label: t('tabPrefs'), labelFull: t('tabPrefsFull') },
            { key: 'api' as const, label: t('tabApi'), labelFull: t('tabApiFull') },
          ]).map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap relative ${
                activeTab === tab.key
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className="sm:hidden">{tab.label}</span>
              <span className="hidden sm:inline">{tab.labelFull}</span>
              {activeTab === tab.key && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-indigo-500 rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {/* ====== 每日简报 ====== */}
        {activeTab === 'brief' && (
          <div className="space-y-6">
            {initialLoading ? (
              <SkeletonBrief />
            ) : effectiveBrief ? (
              <div className="bg-white rounded-xl border border-gray-200 p-6 sm:p-8">
                <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                  <h2 className="text-lg font-semibold text-gray-900">{t('todaysBrief')}</h2>
                  <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-500 flex-wrap">
                    <span>{t('projectsAnalyzed', { count: effectiveBrief.dealCount })}</span>
                    <span>{t('topScore', { score: effectiveBrief.topScore })}</span>
                    <span>{new Date(effectiveBrief.generatedAt).toLocaleDateString(locale === 'zh' ? 'zh-CN' : 'en-US')}</span>
                    {!isDemo && briefHistory.length > 1 && (
                      <button
                        onClick={() => setShowHistory(!showHistory)}
                        className="text-indigo-600 hover:text-indigo-700 font-medium"
                      >
                        {showHistory ? t('hideHistory') : t('pastBriefs')}
                      </button>
                    )}
                  </div>
                </div>

                {/* History selector */}
                {!isDemo && showHistory && briefHistory.length > 1 && (
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-100">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">{t('pastBriefsTitle')}</h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {briefHistory.map(b => (
                        <button
                          key={b.id}
                          onClick={() => loadBrief(b.id)}
                          className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center justify-between ${
                            effectiveBrief.id === b.id
                              ? 'bg-indigo-50 text-indigo-700 font-medium'
                              : 'hover:bg-gray-100 text-gray-700'
                          }`}
                        >
                          <span>{new Date(b.generatedAt).toLocaleDateString(locale === 'zh' ? 'zh-CN' : 'en-US', { month: 'short', day: 'numeric', weekday: 'short' })}</span>
                          <span className="text-xs text-gray-400">{b.dealCount} {t('projects')} · {t('top')} {b.topScore}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <BriefSection
                  content={effectiveBrief.content}
                  dealNames={dealNames}
                  onDealClick={handleDealClick}
                />
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <div className="text-4xl mb-4">📭</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">{t('noBriefYet')}</h3>
                <p className="text-gray-500 mb-6">{t('noBriefDesc')}</p>
                <button
                  onClick={runScan}
                  disabled={loading}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  {loading ? t('scanningEllipsis') : t('generateFirst')}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ====== 项目管线 ====== */}
        {activeTab === 'deals' && (
          <div className="space-y-4">
            {initialLoading ? (
              <>
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </>
            ) : effectiveDeals.length > 0 ? (
              <>
                <FilterBar
                  verdictFilter={verdictFilter}
                  sourceFilter={sourceFilter}
                  categoryFilter={categoryFilter}
                  sortBy={sortBy}
                  onVerdictChange={setVerdictFilter}
                  onSourceChange={setSourceFilter}
                  onCategoryChange={setCategoryFilter}
                  onSortChange={setSortBy}
                  totalCount={effectiveDeals.length}
                  filteredCount={filteredDeals.length}
                  onClear={() => { setVerdictFilter('all'); setSourceFilter('all'); setCategoryFilter('all'); }}
                  categories={categories}
                />

                {filteredDeals.length > 0 ? (
                  filteredDeals.map(deal => (
                    <DealCard
                      key={deal.id}
                      deal={deal}
                      feedback={feedbackMap[deal.id] || null}
                      highlighted={deal.id === highlightedDealId}
                      onFeedback={(signal) => {
                        sendFeedback(deal.id, signal);
                        if (signal) track(`feedback_${signal}`, { dealId: deal.id });
                      }}
                    />
                  ))
                ) : (
                  <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                    <p className="text-gray-500">{t('noMatchFilters')}</p>
                    <button
                      onClick={() => { setVerdictFilter('all'); setSourceFilter('all'); setCategoryFilter('all'); }}
                      className="mt-3 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                      {t('clearFilters')}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <div className="text-4xl mb-4">🎯</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">{t('pipelineEmpty')}</h3>
                <p className="text-gray-500">{t('pipelineEmptyDesc')}</p>
              </div>
            )}
          </div>
        )}

        {/* ====== 投资偏好 ====== */}
        {activeTab === 'settings' && (
          <PreferencesForm
            preferences={preferences}
            onSaved={setPreferences}
            onTrack={track}
          />
        )}

        {/* ====== API 配置 ====== */}
        {activeTab === 'api' && (
          <ApiConfigForm
            config={apiConfig}
            onSaved={setApiConfig}
          />
        )}
      </main>

      {/* Coach Mark Overlay */}
      {showCoachMark && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={dismissCoachMark}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-8 relative" onClick={e => e.stopPropagation()}>
            <button onClick={dismissCoachMark} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl">&times;</button>
            <div className="text-3xl mb-3">{'\uD83D\uDC4B'}</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {locale === 'zh' ? '欢迎来到 DealFlow' : 'Welcome to DealFlow'}
            </h3>
            <div className="space-y-3 text-sm text-gray-600">
              <p>{locale === 'zh'
                ? '这是你的 AI 投资助手仪表盘。以下是快速上手指南：'
                : 'This is your AI deal scout dashboard. Here is a quick guide:'}</p>
              <div className="flex items-start gap-2">
                <span className="text-indigo-500 font-bold">1.</span>
                <span>{locale === 'zh' ? '点击右上角「每日扫描」发现新项目' : 'Click "Daily Scan" to discover new deals'}</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-indigo-500 font-bold">2.</span>
                <span>{locale === 'zh' ? '在「简报」标签查看 AI 生成的投资摘要' : 'Check the "Brief" tab for AI-generated summaries'}</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-indigo-500 font-bold">3.</span>
                <span>{locale === 'zh' ? '对项目点赞/跳过，AI 会学习你的偏好' : 'Like/pass on deals — AI learns your taste'}</span>
              </div>
            </div>
            <button
              onClick={dismissCoachMark}
              className="mt-6 w-full py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
            >
              {locale === 'zh' ? '知道了，开始探索' : 'Got it, let me explore'}
            </button>
          </div>
        </div>
      )}

      {/* Feedback Toast */}
      {feedbackToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-[slideUp_0.3s_ease-out]">
          <div className="bg-gray-900 text-white px-5 py-3 rounded-xl shadow-lg text-sm flex items-center gap-2">
            <span>{'\u2728'}</span>
            <span>{feedbackToast}</span>
          </div>
        </div>
      )}

      {/* Demo Scan Modal */}
      {showDemoScanModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowDemoScanModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 sm:p-8 relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowDemoScanModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl">&times;</button>
            <div className="text-3xl mb-3">{'\uD83D\uDD12'}</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {locale === 'zh' ? '需要配置 API 密钥' : 'API Key Required'}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {locale === 'zh'
                ? '实时扫描需要 DeepSeek API 密钥。你现在看到的是演示数据，配置后即可获取真实项目。'
                : 'Live scanning requires a DeepSeek API key. You are viewing demo data — configure to get real deals.'}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDemoScanModal(false)}
                className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                {locale === 'zh' ? '继续体验' : 'Keep exploring'}
              </button>
              <button
                onClick={() => { setShowDemoScanModal(false); setActiveTab('api'); }}
                className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
              >
                {locale === 'zh' ? '去配置' : 'Configure'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
