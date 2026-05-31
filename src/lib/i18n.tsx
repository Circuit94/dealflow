'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export type Locale = 'en' | 'zh';

const translations = {
  en: {
    // General
    loading: 'Loading...',
    connected: 'Connected',
    retry: 'Retry',

    // Demo banner
    demoBanner: 'You\'re viewing **demo data**. Configure your API key in the "API" tab to get live results from real sources.',

    // Header
    appName: 'DealFlow',
    scanning: '⏳ Scanning...',
    dailyScan: '🔍 Daily Scan',

    // Tabs
    tabBrief: '📋 Brief',
    tabBriefFull: '📋 Daily Brief',
    tabPipeline: '🎯 Pipeline',
    tabPipelineFull: '🎯 Deal Pipeline',
    tabPrefs: '⚙️ Prefs',
    tabPrefsFull: '⚙️ Preferences',
    tabApi: '🔑 API',
    tabApiFull: '🔑 API Config',

    // Brief tab
    todaysBrief: "Today's Deal Brief",
    projectsAnalyzed: '{count} projects analyzed',
    topScore: 'Top score: {score}',
    hideHistory: 'Hide history',
    pastBriefs: 'Past briefs ▾',
    pastBriefsTitle: 'Past Briefs',
    projects: 'projects',
    top: 'Top',
    noBriefYet: 'No brief yet',
    noBriefDesc: 'Click "Daily Scan" to generate your first investment brief.',
    generateFirst: 'Generate first brief',
    scanningEllipsis: 'Scanning...',

    // Pipeline tab
    noMatchFilters: 'No projects match current filters',
    clearFilters: 'Clear filters',
    pipelineEmpty: 'Pipeline empty',
    pipelineEmptyDesc: 'Run a scan to discover and score projects from Product Hunt, GitHub, and other sources.',

    // Scan status
    scanStatusMsg: 'Scanning Product Hunt, GitHub for new projects...',
    scanScoredMsg: 'Scored {count} projects, generating brief...',
    scanFailed: '❌ Scan failed: {error}',
    configureApiFirst: 'Please configure your DeepSeek API Key in the API tab first',

    // DealCard
    verdictStrong: 'Strong Match',
    verdictModerate: 'Moderate',
    verdictWeak: 'Weak',
    verdictPass: 'Pass',
    hideDetails: 'Hide details ▲',
    showDetails: 'Show details ▼',
    score: 'Score',
    scoreStrong: 'Strong Match',
    scoreModerate: 'Moderate Match',
    scoreWeak: 'Weak Match',
    scorePass: 'Pass',
    clickToUndo: 'Click to undo',
    interested: 'Interested',
    pass: 'Pass',
    rateThis: 'Rate this',
    strengths: '✅ Strengths',
    risks: '⚠️ Risks',
    nextStep: '🎯 Next Step',

    // FilterBar
    filter: 'Filter:',
    allVerdicts: 'All verdicts',
    strongMatch: 'Strong Match',
    moderateMatch: 'Moderate Match',
    weakMatch: 'Weak Match',
    allSources: 'All sources',
    productHunt: 'Product Hunt',
    github: 'GitHub',
    allCategories: 'All categories',
    scoreDesc: 'Score ↓',
    scoreAsc: 'Score ↑',
    newestFirst: 'Newest first',
    oldestFirst: 'Oldest first',
    clear: 'Clear',

    // Language
    langSwitch: '中文',
  },
  zh: {
    // General
    loading: '加载中...',
    connected: '已连接',
    retry: '重试',

    // Demo banner
    demoBanner: '您正在查看**演示数据**。请在"API"标签页中配置 API 密钥以获取实时数据。',

    // Header
    appName: 'DealFlow',
    scanning: '⏳ 扫描中...',
    dailyScan: '🔍 每日扫描',

    // Tabs
    tabBrief: '📋 简报',
    tabBriefFull: '📋 每日简报',
    tabPipeline: '🎯 管线',
    tabPipelineFull: '🎯 项目管线',
    tabPrefs: '⚙️ 偏好',
    tabPrefsFull: '⚙️ 投资偏好',
    tabApi: '🔑 API',
    tabApiFull: '🔑 API 配置',

    // Brief tab
    todaysBrief: '今日投资简报',
    projectsAnalyzed: '已分析 {count} 个项目',
    topScore: '最高分: {score}',
    hideHistory: '隐藏历史',
    pastBriefs: '历史简报 ▾',
    pastBriefsTitle: '历史简报',
    projects: '个项目',
    top: '最高',
    noBriefYet: '暂无简报',
    noBriefDesc: '点击"每日扫描"生成您的第一份投资简报。',
    generateFirst: '生成首份简报',
    scanningEllipsis: '扫描中...',

    // Pipeline tab
    noMatchFilters: '没有项目匹配当前筛选条件',
    clearFilters: '清除筛选',
    pipelineEmpty: '管线为空',
    pipelineEmptyDesc: '运行扫描以从 Product Hunt、GitHub 等来源发现并评分项目。',

    // Scan status
    scanStatusMsg: '正在扫描 Product Hunt、GitHub 的新项目...',
    scanScoredMsg: '已评分 {count} 个项目，正在生成简报...',
    scanFailed: '❌ 扫描失败: {error}',
    configureApiFirst: '请先在 API 标签页中配置 DeepSeek API 密钥',

    // DealCard
    verdictStrong: '强匹配',
    verdictModerate: '中等',
    verdictWeak: '弱匹配',
    verdictPass: '不匹配',
    hideDetails: '收起详情 ▲',
    showDetails: '展开详情 ▼',
    score: '评分',
    scoreStrong: '强匹配',
    scoreModerate: '中等匹配',
    scoreWeak: '弱匹配',
    scorePass: '不匹配',
    clickToUndo: '点击撤销',
    interested: '感兴趣',
    pass: '跳过',
    rateThis: '评价',
    strengths: '✅ 优势',
    risks: '⚠️ 风险',
    nextStep: '🎯 建议动作',

    // FilterBar
    filter: '筛选:',
    allVerdicts: '所有评级',
    strongMatch: '强匹配',
    moderateMatch: '中等匹配',
    weakMatch: '弱匹配',
    allSources: '所有来源',
    productHunt: 'Product Hunt',
    github: 'GitHub',
    allCategories: '所有分类',
    scoreDesc: '评分 ↓',
    scoreAsc: '评分 ↑',
    newestFirst: '最新优先',
    oldestFirst: '最早优先',
    clear: '清除',

    // Language
    langSwitch: 'EN',
  },
} as const;

export type TranslationKey = keyof typeof translations.en;

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dealflow-locale');
      if (saved === 'zh' || saved === 'en') return saved;
      // Auto-detect from browser
      return navigator.language.startsWith('zh') ? 'zh' : 'en';
    }
    return 'en';
  });

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    if (typeof window !== 'undefined') {
      localStorage.setItem('dealflow-locale', newLocale);
    }
  }, []);

  const t = useCallback((key: TranslationKey, params?: Record<string, string | number>): string => {
    let text: string = translations[locale][key] || translations.en[key] || key;
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        text = text.replace(`{${k}}`, String(v));
      });
    }
    return text;
  }, [locale]);

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
