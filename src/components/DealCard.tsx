'use client';

import { useState, useRef, useEffect } from 'react';

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
    case 'product_hunt': return '🚀 PH';
    case 'github': return '⭐ GH';
    case 'crunchbase': return '💰 CB';
    case 'twitter': return '🐦 X';
    default: return '📄';
  }
}

export function DealCard({
  deal,
  feedback,
  onFeedback,
  highlighted,
}: {
  deal: Deal;
  feedback: FeedbackSignal;
  onFeedback: (signal: 'interested' | 'pass' | null) => void;
  highlighted?: boolean;
}) {
  const [expanded, setExpanded] = useState(highlighted || false);
  const [showScoreTooltip, setShowScoreTooltip] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // Auto-expand and scroll when highlighted
  useEffect(() => {
    if (highlighted) {
      setExpanded(true);
      cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [highlighted]);

  const hasDetails = (deal.strengths?.length > 0 || deal.risks?.length > 0 || deal.suggested_action);

  return (
    <div
      ref={cardRef}
      className={`bg-white rounded-xl border transition-all duration-300 ${
        highlighted
          ? 'border-indigo-400 ring-2 ring-indigo-200 shadow-lg'
          : 'border-gray-200 hover:shadow-md'
      }`}
    >
      {/* Main row */}
      <div className="p-4 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 sm:gap-3 mb-2 flex-wrap">
              <span className="text-xs sm:text-sm text-gray-400">{getSourceLabel(deal.source)}</span>
              <a href={deal.url} target="_blank" rel="noopener noreferrer" className="text-base sm:text-lg font-semibold text-gray-900 hover:text-indigo-600 transition-colors truncate">
                {deal.name}
              </a>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium border shrink-0 ${getVerdictColor(deal.verdict)}`}>
                {getVerdictLabel(deal.verdict)}
              </span>
            </div>
            <p className="text-sm sm:text-base text-gray-600 mb-2 line-clamp-2">{deal.tagline}</p>
            {deal.one_liner && (
              <p className="text-xs sm:text-sm text-indigo-700 bg-indigo-50 px-3 py-2 rounded-lg mb-3">
                💡 {deal.one_liner}
              </p>
            )}
            <div className="flex items-center gap-3 sm:gap-4 text-xs text-gray-400 flex-wrap">
              <span className="bg-gray-100 px-2 py-1 rounded">{deal.category}</span>
              {deal.metrics && <span>{deal.metrics}</span>}
              {hasDetails && (
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="text-indigo-500 hover:text-indigo-700 font-medium transition-colors"
                >
                  {expanded ? '收起详情 ▲' : '展开详情 ▼'}
                </button>
              )}
            </div>
          </div>
          <div className="flex flex-col items-center gap-2 shrink-0">
            {/* Score with tooltip */}
            <div className="relative">
              <div
                className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center text-base sm:text-lg font-bold cursor-help ${
                  deal.score >= 80 ? 'bg-green-100 text-green-700' :
                  deal.score >= 60 ? 'bg-yellow-100 text-yellow-700' :
                  'bg-gray-100 text-gray-500'
                }`}
                onMouseEnter={() => setShowScoreTooltip(true)}
                onMouseLeave={() => setShowScoreTooltip(false)}
                onClick={() => setShowScoreTooltip(!showScoreTooltip)}
              >
                {deal.score || '—'}
              </div>
              {showScoreTooltip && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-gray-900 text-white text-xs rounded-lg p-3 z-20 shadow-lg">
                  <div className="space-y-1">
                    <div className="flex justify-between"><span className="text-green-300">80+</span><span>Strong Match</span></div>
                    <div className="flex justify-between"><span className="text-yellow-300">60-79</span><span>Moderate Match</span></div>
                    <div className="flex justify-between"><span className="text-gray-400">40-59</span><span>Weak Match</span></div>
                    <div className="flex justify-between"><span className="text-red-300">&lt;40</span><span>Pass</span></div>
                  </div>
                  <div className="absolute -top-1 right-4 w-2 h-2 bg-gray-900 rotate-45" />
                </div>
              )}
            </div>
            <span className="text-xs text-gray-400">评分</span>
            {/* Feedback buttons — prominent, click again to cancel */}
            <div className="flex gap-1.5 mt-2">
              <button
                onClick={() => onFeedback(feedback === 'interested' ? null : 'interested')}
                className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-all ${
                  feedback === 'interested'
                    ? 'bg-green-100 text-green-600 ring-2 ring-green-300 scale-110'
                    : 'bg-gray-100 text-gray-400 hover:bg-green-50 hover:text-green-600 hover:scale-105'
                }`}
                title={feedback === 'interested' ? 'Click to undo' : 'Interested'}
              >
                👍
              </button>
              <button
                onClick={() => onFeedback(feedback === 'pass' ? null : 'pass')}
                className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-all ${
                  feedback === 'pass'
                    ? 'bg-red-100 text-red-600 ring-2 ring-red-300 scale-110'
                    : 'bg-gray-100 text-gray-400 hover:bg-red-50 hover:text-red-600 hover:scale-105'
                }`}
                title={feedback === 'pass' ? 'Click to undo' : 'Pass'}
              >
                👎
              </button>
            </div>
            {!feedback && (
              <span className="text-xs text-gray-400 mt-1">Rate this</span>
            )}
          </div>
        </div>
      </div>

      {/* Accordion with animation */}
      <div
        ref={contentRef}
        className={`grid transition-all duration-300 ease-in-out ${
          expanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          <div className="border-t border-gray-100 px-4 sm:px-6 py-4 bg-gray-50/50 rounded-b-xl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {deal.strengths?.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-2">✅ 优势</h4>
                  <ul className="space-y-1">
                    {deal.strengths.map((s, i) => (
                      <li key={i} className="text-sm text-gray-700 flex items-start gap-1.5">
                        <span className="text-green-500 mt-0.5 shrink-0">•</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {deal.risks?.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-red-700 uppercase tracking-wide mb-2">⚠️ 风险</h4>
                  <ul className="space-y-1">
                    {deal.risks.map((r, i) => (
                      <li key={i} className="text-sm text-gray-700 flex items-start gap-1.5">
                        <span className="text-red-500 mt-0.5 shrink-0">•</span>
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {deal.suggested_action && (
                <div>
                  <h4 className="text-xs font-semibold text-indigo-700 uppercase tracking-wide mb-2">🎯 建议动作</h4>
                  <p className="text-sm text-gray-700">{deal.suggested_action}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
