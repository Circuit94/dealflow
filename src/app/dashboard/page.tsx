'use client';

import { Suspense, useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { DealCard } from '@/components/DealCard';
import { BriefSection } from '@/components/BriefSection';
import { FilterBar } from '@/components/FilterBar';
import { OnboardingStepper } from '@/components/OnboardingStepper';
import { PreferencesForm } from '@/components/PreferencesForm';
import { ApiConfigForm } from '@/components/ApiConfigForm';
import { SkeletonCard, SkeletonBrief } from '@/components/Skeleton';

// Wrap in Suspense for useSearchParams
export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><span className="text-gray-400">加载中...</span></div>}>
      <Dashboard />
    </Suspense>
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
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ============ Actions ============
  const showOnboarding = !initialLoading && (!apiConfig?.deepseekConfigured || deals.length === 0);

  async function runScan() {
    if (!apiConfig?.deepseekConfigured) {
      setScanError('请先在「API 配置」中设置 DeepSeek API Key');
      setActiveTab('api');
      return;
    }

    setLoading(true);
    setScanStatus('正在从 Product Hunt、GitHub 抓取项目...');
    setScanError('');

    try {
      const dealsRes = await fetch('/api/deals', { method: 'POST' });
      const dealsData = await dealsRes.json();
      if (!dealsData.success) throw new Error(dealsData.error || '抓取失败');

      setScanStatus(`已评分 ${dealsData.total} 个项目，正在生成 Brief...`);

      const briefRes = await fetch('/api/brief', { method: 'POST' });
      const briefData = await briefRes.json();
      if (!briefData.success) throw new Error(briefData.error || 'Brief 生成失败');

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
    const cats = [...new Set(deals.map(d => d.category).filter(Boolean))];
    return cats.sort();
  }, [deals]);

  const filteredDeals = useMemo(() => {
    let result = deals.filter(deal => {
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
  }, [deals, verdictFilter, sourceFilter, categoryFilter, sortBy]);

  const dealNames = useMemo(() => deals.map(d => d.name), [deals]);

  // ============ Render ============
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Demo Banner */}
      {!apiConfig?.deepseekConfigured && deals.length > 0 && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 sm:px-6 py-2 text-center text-sm text-amber-800">
          📋 You&apos;re viewing <strong>demo data</strong>. Configure your API key in the API tab to get live results from real sources.
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">D</span>
            </div>
            <h1 className="text-lg sm:text-xl font-semibold text-gray-900">DealFlow</h1>
            {apiConfig?.deepseekConfigured && (
              <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full font-medium hidden sm:inline">Connected</span>
            )}
          </div>
          <button
            onClick={runScan}
            disabled={loading}
            className="px-3 sm:px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? '⏳ Scanning...' : '🔍 Daily Scan'}
          </button>
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
              <span>❌ 扫描失败：{scanError}</span>
              <button
                onClick={runScan}
                disabled={loading}
                className="ml-3 px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded-md text-xs font-medium transition-colors shrink-0"
              >
                重试
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit overflow-x-auto">
          {([
            { key: 'brief' as const, label: '📋 简报', labelFull: '📋 每日简报' },
            { key: 'deals' as const, label: '🎯 管线', labelFull: '🎯 项目管线' },
            { key: 'settings' as const, label: '⚙️ 偏好', labelFull: '⚙️ 投资偏好' },
            { key: 'api' as const, label: '🔑 API', labelFull: '🔑 API 配置' },
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
            ) : showOnboarding && !brief ? (
              <OnboardingStepper
                apiConfigured={!!apiConfig?.deepseekConfigured}
                hasPreferences={!!preferences}
                hasDeals={deals.length > 0}
                onGoToApi={() => setActiveTab('api')}
                onGoToPrefs={() => setActiveTab('settings')}
                onRunScan={runScan}
                loading={loading}
              />
            ) : brief ? (
              <div className="bg-white rounded-xl border border-gray-200 p-6 sm:p-8">
                <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                  <h2 className="text-lg font-semibold text-gray-900">今日投资简报</h2>
                  <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-500 flex-wrap">
                    <span>分析了 {brief.dealCount} 个项目</span>
                    <span>最高分：{brief.topScore}</span>
                    <span>{new Date(brief.generatedAt).toLocaleDateString('zh-CN')}</span>
                    {briefHistory.length > 1 && (
                      <button
                        onClick={() => setShowHistory(!showHistory)}
                        className="text-indigo-600 hover:text-indigo-700 font-medium"
                      >
                        {showHistory ? '收起历史' : '往期简报 ▾'}
                      </button>
                    )}
                  </div>
                </div>

                {/* History selector */}
                {showHistory && briefHistory.length > 1 && (
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-100">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">历史简报</h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {briefHistory.map(b => (
                        <button
                          key={b.id}
                          onClick={() => loadBrief(b.id)}
                          className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center justify-between ${
                            brief.id === b.id
                              ? 'bg-indigo-50 text-indigo-700 font-medium'
                              : 'hover:bg-gray-100 text-gray-700'
                          }`}
                        >
                          <span>{new Date(b.generatedAt).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', weekday: 'short' })}</span>
                          <span className="text-xs text-gray-400">{b.dealCount} 项目 · 最高 {b.topScore} 分</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <BriefSection
                  content={brief.content}
                  dealNames={dealNames}
                  onDealClick={handleDealClick}
                />
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <div className="text-4xl mb-4">📭</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">暂无简报</h3>
                <p className="text-gray-500 mb-6">点击「每日扫描」生成你的第一份投资简报。</p>
                <button
                  onClick={runScan}
                  disabled={loading}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  {loading ? '扫描中...' : '生成第一份简报'}
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
            ) : deals.length > 0 ? (
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
                  totalCount={deals.length}
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
                    <p className="text-gray-500">没有符合筛选条件的项目</p>
                    <button
                      onClick={() => { setVerdictFilter('all'); setSourceFilter('all'); }}
                      className="mt-3 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                      清除筛选
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <div className="text-4xl mb-4">🎯</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">管线为空</h3>
                <p className="text-gray-500">执行扫描后，这里会展示从 Product Hunt、GitHub 等来源发现并评分的项目。</p>
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
    </div>
  );
}
