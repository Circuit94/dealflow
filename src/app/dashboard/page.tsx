'use client';

import { useState, useEffect, useCallback } from 'react';

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
  content: string;
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

export default function Dashboard() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [brief, setBrief] = useState<Brief | null>(null);
  const [preferences, setPreferences] = useState<Preferences | null>(null);
  const [apiConfig, setApiConfig] = useState<ApiConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [scanStatus, setScanStatus] = useState<string>('');
  const [scanError, setScanError] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'brief' | 'deals' | 'settings' | 'api'>('brief');
  const [feedbackMap, setFeedbackMap] = useState<Record<string, FeedbackSignal>>({});

  // 偏好编辑表单
  const [editSectors, setEditSectors] = useState('');
  const [editStage, setEditStage] = useState('');
  const [editGeo, setEditGeo] = useState('');
  const [editSignals, setEditSignals] = useState('');
  const [prefsSaving, setPrefsSaving] = useState(false);
  const [prefsMsg, setPrefsMsg] = useState('');

  // API 配置表单
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [baseUrlInput, setBaseUrlInput] = useState('https://api.deepseek.com');
  const [modelInput, setModelInput] = useState('deepseek-chat');
  const [configSaving, setConfigSaving] = useState(false);
  const [configMsg, setConfigMsg] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const [dealsRes, briefRes, prefsRes, configRes] = await Promise.all([
        fetch('/api/deals').then(r => r.json()),
        fetch('/api/brief').then(r => r.json()),
        fetch('/api/preferences').then(r => r.json()),
        fetch('/api/config').then(r => r.json()),
      ]);
      if (dealsRes.success) setDeals(dealsRes.deals || []);
      if (briefRes.success) setBrief(briefRes.brief);
      if (prefsRes.success) {
        setPreferences(prefsRes.preferences);
        const p = prefsRes.preferences;
        setEditSectors(p.sectors?.join(', ') || '');
        setEditStage(p.stage || '');
        setEditGeo(p.geography || '');
        setEditSignals(p.signals?.join(', ') || '');
      }
      if (configRes.success) {
        setApiConfig(configRes.config);
        setBaseUrlInput(configRes.config.deepseekBaseUrl);
        setModelInput(configRes.config.deepseekModel);
      }
    } catch (e) {
      console.error('数据加载失败:', e);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function runScan() {
    if (!apiConfig?.deepseekConfigured) {
      setScanError('请先在「API 配置」中设置 DeepSeek API Key');
      setActiveTab('api');
      return;
    }

    setLoading(true);
    setScanStatus('正在抓取数据源...');
    setScanError('');

    try {
      setScanStatus('正在从 Product Hunt、GitHub 抓取项目...');
      const dealsRes = await fetch('/api/deals', { method: 'POST' });
      const dealsData = await dealsRes.json();

      if (!dealsData.success) {
        throw new Error(dealsData.error || '抓取失败');
      }

      setScanStatus(`已评分 ${dealsData.total} 个项目，正在生成 Brief...`);

      const briefRes = await fetch('/api/brief', { method: 'POST' });
      const briefData = await briefRes.json();

      if (!briefData.success) {
        throw new Error(briefData.error || 'Brief 生成失败');
      }

      setScanStatus('');
      await fetchData();
      setActiveTab('brief');
      track('scan_completed', { dealCount: dealsData.total });
    } catch (e) {
      const msg = e instanceof Error ? e.message : '未知错误';
      setScanError(`扫描失败：${msg}`);
      setScanStatus('');
    }
    setLoading(false);
  }

  async function saveApiConfig() {
    setConfigSaving(true);
    setConfigMsg('');
    try {
      const res = await fetch('/api/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deepseekApiKey: apiKeyInput || undefined,
          deepseekBaseUrl: baseUrlInput || undefined,
          deepseekModel: modelInput || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setApiConfig(data.config);
        setConfigMsg('配置保存成功！');
        setApiKeyInput('');
      } else {
        setConfigMsg(`保存失败：${data.error}`);
      }
    } catch {
      setConfigMsg('保存失败，请检查网络');
    }
    setConfigSaving(false);
  }

  // 保存投资偏好
  async function savePreferences() {
    setPrefsSaving(true);
    setPrefsMsg('');
    try {
      const payload = {
        sectors: editSectors.split(',').map(s => s.trim()).filter(Boolean),
        stage: editStage.trim(),
        geography: editGeo.trim(),
        signals: editSignals.split(',').map(s => s.trim()).filter(Boolean),
      };
      const res = await fetch('/api/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setPreferences(data.preferences);
        setPrefsMsg('偏好已保存！下次扫描将使用新设置。');
        track('preferences_updated', payload);
      } else {
        setPrefsMsg(`保存失败：${data.error}`);
      }
    } catch {
      setPrefsMsg('保存失败，请检查网络');
    }
    setPrefsSaving(false);
  }

  // 发送反馈（飞轮入口）
  async function sendFeedback(dealId: string, signal: 'interested' | 'pass') {
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dealId, signal }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedbackMap(prev => ({ ...prev, [dealId]: signal }));
      }
    } catch (e) {
      console.error('反馈提交失败:', e);
    }
  }

  // 极简事件追踪
  function track(eventType: string, eventData?: Record<string, unknown>) {
    fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventType, eventData, page: 'dashboard' }),
    }).catch(() => {});
  }

  // 简易 Markdown → HTML 渲染（处理 brief 中的 ** 和 --- 等）
  function renderMarkdown(text: string): string {
    return text
      // 加粗 **text**
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      // 斜体 *text*
      .replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>')
      // 分割线 ---
      .replace(/^---$/gm, '<hr class="my-4 border-gray-200" />')
      // 标题行（简单处理 ## 开头）
      .replace(/^## (.+)$/gm, '<h3 class="text-base font-semibold text-gray-900 mt-4 mb-2">$1</h3>')
      // 编号列表项加粗标题部分
      .replace(/^(\d+)\. (.+)$/gm, '<div class="mt-3"><span class="font-medium text-gray-900">$1. $2</span></div>')
      // 普通换行
      .replace(/\n/g, '<br />');
  }

  function getVerdictLabel(verdict: string) {
    switch (verdict) {
      case 'STRONG_MATCH': return '强匹配';
      case 'MODERATE_MATCH': return '中等匹配';
      case 'WEAK_MATCH': return '弱匹配';
      case 'PASS': return '不匹配';
      default: return verdict;
    }
  }

  function getVerdictColor(verdict: string) {
    switch (verdict) {
      case 'STRONG_MATCH': return 'bg-green-100 text-green-800 border-green-200';
      case 'MODERATE_MATCH': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'WEAK_MATCH': return 'bg-gray-100 text-gray-600 border-gray-200';
      default: return 'bg-red-50 text-red-600 border-red-200';
    }
  }

  function getSourceLabel(source: string) {
    switch (source) {
      case 'product_hunt': return '🚀 Product Hunt';
      case 'github': return '⭐ GitHub';
      case 'crunchbase': return '💰 Crunchbase';
      case 'twitter': return '🐦 Twitter';
      default: return '📄 其他';
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">D</span>
            </div>
            <h1 className="text-xl font-semibold text-gray-900">DealFlow</h1>
            {apiConfig?.deepseekConfigured && (
              <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full font-medium">已连接</span>
            )}
            {apiConfig && !apiConfig.deepseekConfigured && (
              <span className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full font-medium">未配置</span>
            )}
          </div>
          <button
            onClick={runScan}
            disabled={loading}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? '⏳ 扫描中...' : '🔍 执行每日扫描'}
          </button>
        </div>
      </header>

      {/* Status Bar */}
      {(scanStatus || scanError) && (
        <div className="max-w-6xl mx-auto px-6 pt-4">
          {scanStatus && (
            <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
              <span className="animate-spin">⏳</span> {scanStatus}
            </div>
          )}
          {scanError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              ❌ {scanError}
            </div>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="max-w-6xl mx-auto px-6 pt-6">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
          {([
            { key: 'brief' as const, label: '📋 每日简报' },
            { key: 'deals' as const, label: '🎯 项目管线' },
            { key: 'settings' as const, label: '⚙️ 投资偏好' },
            { key: 'api' as const, label: '🔑 API 配置' },
          ]).map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-6 py-6">
        {/* 每日简报 */}
        {activeTab === 'brief' && (
          <div className="space-y-6">
            {brief ? (
              <div className="bg-white rounded-xl border border-gray-200 p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">今日投资简报</h2>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>分析了 {brief.dealCount} 个项目</span>
                    <span>最高分：{brief.topScore}</span>
                    <span>{new Date(brief.generatedAt).toLocaleDateString('zh-CN')}</span>
                  </div>
                </div>
                <div
                  className="prose prose-sm max-w-none text-gray-700 [&_strong]:font-semibold [&_strong]:text-gray-900 [&_hr]:my-4 [&_hr]:border-gray-200"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(brief.content) }}
                />
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <div className="text-4xl mb-4">📭</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">暂无简报</h3>
                <p className="text-gray-500 mb-6">
                  {apiConfig?.deepseekConfigured
                    ? '点击「执行每日扫描」抓取项目并生成你的第一份投资简报。'
                    : '请先前往「API 配置」设置 DeepSeek API Key，然后执行扫描。'}
                </p>
                <button
                  onClick={() => apiConfig?.deepseekConfigured ? runScan() : setActiveTab('api')}
                  disabled={loading}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  {apiConfig?.deepseekConfigured
                    ? (loading ? '扫描中...' : '生成第一份简报')
                    : '前往配置 API'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* 项目管线 */}
        {activeTab === 'deals' && (
          <div className="space-y-4">
            {deals.length > 0 ? (
              deals.map(deal => (
                <div key={deal.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-sm text-gray-400">{getSourceLabel(deal.source)}</span>
                        <a href={deal.url} target="_blank" rel="noopener noreferrer" className="text-lg font-semibold text-gray-900 hover:text-indigo-600 transition-colors">
                          {deal.name}
                        </a>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getVerdictColor(deal.verdict)}`}>
                          {getVerdictLabel(deal.verdict)}
                        </span>
                      </div>
                      <p className="text-gray-600 mb-3">{deal.tagline}</p>
                      {deal.one_liner && (
                        <p className="text-sm text-indigo-700 bg-indigo-50 px-3 py-2 rounded-lg mb-3">
                          💡 {deal.one_liner}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-gray-400">
                        <span className="bg-gray-100 px-2 py-1 rounded">{deal.category}</span>
                        {deal.metrics && <span>{deal.metrics}</span>}
                      </div>
                    </div>
                    <div className="ml-6 flex flex-col items-center gap-2">
                      <div className={`w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold ${
                        deal.score >= 80 ? 'bg-green-100 text-green-700' :
                        deal.score >= 60 ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-500'
                      }`}>
                        {deal.score || '—'}
                      </div>
                      <span className="text-xs text-gray-400 block">评分</span>
                      {/* 👍/👎 反馈按钮 — 飞轮入口 */}
                      <div className="flex gap-1 mt-1">
                        <button
                          onClick={() => { sendFeedback(deal.id, 'interested'); track('feedback_interested', { dealId: deal.id }); }}
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all ${
                            feedbackMap[deal.id] === 'interested'
                              ? 'bg-green-100 text-green-600 ring-2 ring-green-300'
                              : 'bg-gray-50 text-gray-400 hover:bg-green-50 hover:text-green-600'
                          }`}
                          title="感兴趣"
                        >
                          👍
                        </button>
                        <button
                          onClick={() => { sendFeedback(deal.id, 'pass'); track('feedback_pass', { dealId: deal.id }); }}
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all ${
                            feedbackMap[deal.id] === 'pass'
                              ? 'bg-red-100 text-red-600 ring-2 ring-red-300'
                              : 'bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-600'
                          }`}
                          title="跳过"
                        >
                          👎
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <div className="text-4xl mb-4">🎯</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">管线为空</h3>
                <p className="text-gray-500">执行扫描后，这里会展示从 Product Hunt、GitHub 等来源发现并评分的项目。</p>
              </div>
            )}
          </div>
        )}

        {/* 投资偏好 */}
        {activeTab === 'settings' && (
          <div className="bg-white rounded-xl border border-gray-200 p-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">投资偏好设置</h2>
            <p className="text-sm text-gray-500 mb-6">点击选项快速选择，也可以在输入框中自定义补充。修改后点击保存即可生效。</p>

            <div className="space-y-6">
              {/* 关注赛道 — 选项 + 自定义 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">关注赛道</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {['AI/ML', 'Developer Tools', 'SaaS', 'Fintech', 'Health Tech', 'EdTech', 'Web3/Crypto', 'E-commerce', 'Climate Tech', 'Consumer', 'Enterprise', 'Marketplace'].map(tag => {
                    const selected = editSectors.split(',').map(s => s.trim()).includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          const current = editSectors.split(',').map(s => s.trim()).filter(Boolean);
                          if (selected) {
                            setEditSectors(current.filter(s => s !== tag).join(', '));
                          } else {
                            setEditSectors([...current, tag].join(', '));
                          }
                        }}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                          selected
                            ? 'bg-indigo-100 text-indigo-700 border-indigo-300'
                            : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-indigo-300 hover:text-indigo-600'
                        }`}
                      >
                        {selected ? '✓ ' : ''}{tag}
                      </button>
                    );
                  })}
                </div>
                <input
                  type="text"
                  value={editSectors}
                  onChange={e => setEditSectors(e.target.value)}
                  placeholder="也可以直接输入，用逗号分隔"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />
              </div>

              {/* 投资阶段 — 单选 + 自定义 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">投资阶段</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {['Pre-Seed', 'Seed', 'Series A', 'Series B', 'Growth'].map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setEditStage(tag)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                        editStage === tag
                          ? 'bg-indigo-100 text-indigo-700 border-indigo-300'
                          : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-indigo-300 hover:text-indigo-600'
                      }`}
                    >
                      {editStage === tag ? '✓ ' : ''}{tag}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={editStage}
                  onChange={e => setEditStage(e.target.value)}
                  placeholder="或自定义，如 Pre-Seed / Seed"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />
              </div>

              {/* 地域偏好 — 选项 + 自定义 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">地域偏好</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {['Global', 'North America', 'Europe', 'Asia', 'China', 'Southeast Asia', 'India', 'LATAM'].map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setEditGeo(tag)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                        editGeo === tag
                          ? 'bg-indigo-100 text-indigo-700 border-indigo-300'
                          : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-indigo-300 hover:text-indigo-600'
                      }`}
                    >
                      {editGeo === tag ? '✓ ' : ''}{tag}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={editGeo}
                  onChange={e => setEditGeo(e.target.value)}
                  placeholder="或自定义地域"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />
              </div>

              {/* 关注信号 — 多选 + 自定义 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">关注信号</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {['Strong GitHub traction', 'Product Hunt #1', 'Repeat founders', 'Growing waitlist', 'Revenue generating', 'Top accelerator alumni', 'Viral growth', 'Strong technical team'].map(tag => {
                    const selected = editSignals.split(',').map(s => s.trim()).includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          const current = editSignals.split(',').map(s => s.trim()).filter(Boolean);
                          if (selected) {
                            setEditSignals(current.filter(s => s !== tag).join(', '));
                          } else {
                            setEditSignals([...current, tag].join(', '));
                          }
                        }}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                          selected
                            ? 'bg-green-100 text-green-700 border-green-300'
                            : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-green-300 hover:text-green-600'
                        }`}
                      >
                        {selected ? '✓ ' : ''}{tag}
                      </button>
                    );
                  })}
                </div>
                <input
                  type="text"
                  value={editSignals}
                  onChange={e => setEditSignals(e.target.value)}
                  placeholder="也可以直接输入，用逗号分隔"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />
              </div>

              {prefsMsg && (
                <div className={`text-sm px-3 py-2 rounded-lg ${prefsMsg.includes('已保存') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  {prefsMsg}
                </div>
              )}

              <button
                onClick={savePreferences}
                disabled={prefsSaving}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {prefsSaving ? '保存中...' : '保存偏好'}
              </button>
            </div>
          </div>
        )}

        {/* API 配置 */}
        {activeTab === 'api' && (
          <div className="bg-white rounded-xl border border-gray-200 p-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">API 配置</h2>
            <p className="text-sm text-gray-500 mb-6">
              配置 DeepSeek API 以启用 AI 评分和简报生成功能。
              <a href="https://platform.deepseek.com/api_keys" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline ml-1">
                获取 API Key →
              </a>
            </p>

            {/* 当前状态 */}
            <div className={`p-4 rounded-lg mb-6 ${apiConfig?.deepseekConfigured ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
              <div className="flex items-center gap-2">
                <span>{apiConfig?.deepseekConfigured ? '✅' : '⚠️'}</span>
                <span className={`text-sm font-medium ${apiConfig?.deepseekConfigured ? 'text-green-700' : 'text-yellow-700'}`}>
                  {apiConfig?.deepseekConfigured
                    ? `已配置 (${apiConfig.deepseekKeyPreview})`
                    : '未配置 — 请填写 API Key 后保存'}
                </span>
              </div>
            </div>

            {/* 配置表单 */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">DeepSeek API Key</label>
                <input
                  type="password"
                  value={apiKeyInput}
                  onChange={e => setApiKeyInput(e.target.value)}
                  placeholder={apiConfig?.deepseekConfigured ? '已配置，留空则不修改' : '请输入 sk-...'}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">API 地址</label>
                <input
                  type="text"
                  value={baseUrlInput}
                  onChange={e => setBaseUrlInput(e.target.value)}
                  placeholder="https://api.deepseek.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />
                <p className="text-xs text-gray-400 mt-1">支持兼容 OpenAI 格式的第三方 API 地址</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">模型名称</label>
                <input
                  type="text"
                  value={modelInput}
                  onChange={e => setModelInput(e.target.value)}
                  placeholder="deepseek-chat"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />
                <p className="text-xs text-gray-400 mt-1">可选：deepseek-chat、deepseek-reasoner 等</p>
              </div>

              {configMsg && (
                <div className={`text-sm px-3 py-2 rounded-lg ${configMsg.includes('成功') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  {configMsg}
                </div>
              )}

              <button
                onClick={saveApiConfig}
                disabled={configSaving}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {configSaving ? '保存中...' : '保存配置'}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
