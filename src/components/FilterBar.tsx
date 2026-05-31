'use client';

import { useI18n } from '@/lib/i18n';

interface FilterBarProps {
  verdictFilter: string;
  sourceFilter: string;
  categoryFilter?: string;
  sortBy: string;
  onVerdictChange: (v: string) => void;
  onSourceChange: (v: string) => void;
  onCategoryChange?: (v: string) => void;
  onSortChange: (v: string) => void;
  totalCount: number;
  filteredCount: number;
  onClear: () => void;
  categories?: string[];
}

export function FilterBar({
  verdictFilter,
  sourceFilter,
  categoryFilter = 'all',
  sortBy,
  onVerdictChange,
  onSourceChange,
  onCategoryChange,
  onSortChange,
  totalCount,
  filteredCount,
  onClear,
  categories = [],
}: FilterBarProps) {
  const { t } = useI18n();
  const hasFilters = verdictFilter !== 'all' || sourceFilter !== 'all' || categoryFilter !== 'all';

  return (
    <div className="flex items-center gap-2 sm:gap-3 flex-wrap bg-white rounded-lg border border-gray-200 p-3">
      <span className="text-sm text-gray-500 font-medium hidden sm:inline">{t('filter')}</span>
      <select
        value={verdictFilter}
        onChange={e => onVerdictChange(e.target.value)}
        className="text-sm border border-gray-300 rounded-lg px-2 sm:px-3 py-1.5 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
      >
        <option value="all">{t('allVerdicts')}</option>
        <option value="STRONG_MATCH">{t('strongMatch')}</option>
        <option value="MODERATE_MATCH">{t('moderateMatch')}</option>
        <option value="WEAK_MATCH">{t('weakMatch')}</option>
        <option value="PASS">{t('verdictPass')}</option>
      </select>
      <select
        value={sourceFilter}
        onChange={e => onSourceChange(e.target.value)}
        className="text-sm border border-gray-300 rounded-lg px-2 sm:px-3 py-1.5 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
      >
        <option value="all">{t('allSources')}</option>
        <option value="product_hunt">{t('productHunt')}</option>
        <option value="github">{t('github')}</option>
      </select>
      {categories.length > 0 && onCategoryChange && (
        <select
          value={categoryFilter}
          onChange={e => onCategoryChange(e.target.value)}
          className="text-sm border border-gray-300 rounded-lg px-2 sm:px-3 py-1.5 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
        >
          <option value="all">{t('allCategories')}</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      )}
      <select
        value={sortBy}
        onChange={e => onSortChange(e.target.value)}
        className="text-sm border border-gray-300 rounded-lg px-2 sm:px-3 py-1.5 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
      >
        <option value="score_desc">{t('scoreDesc')}</option>
        <option value="score_asc">{t('scoreAsc')}</option>
        <option value="date_desc">{t('newestFirst')}</option>
        <option value="date_asc">{t('oldestFirst')}</option>
      </select>
      <div className="flex items-center gap-2 ml-auto">
        {hasFilters && (
          <button
            onClick={onClear}
            className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
          >
            {t('clear')}
          </button>
        )}
        <span className="text-xs text-gray-400">
          {filteredCount} / {totalCount}
        </span>
      </div>
    </div>
  );
}
