interface FilterBarProps {
  verdictFilter: string;
  sourceFilter: string;
  sortBy: string;
  onVerdictChange: (v: string) => void;
  onSourceChange: (v: string) => void;
  onSortChange: (v: string) => void;
  totalCount: number;
  filteredCount: number;
  onClear: () => void;
}

export function FilterBar({
  verdictFilter,
  sourceFilter,
  sortBy,
  onVerdictChange,
  onSourceChange,
  onSortChange,
  totalCount,
  filteredCount,
  onClear,
}: FilterBarProps) {
  const hasFilters = verdictFilter !== 'all' || sourceFilter !== 'all';

  return (
    <div className="flex items-center gap-2 sm:gap-3 flex-wrap bg-white rounded-lg border border-gray-200 p-3">
      <span className="text-sm text-gray-500 font-medium hidden sm:inline">筛选：</span>
      <select
        value={verdictFilter}
        onChange={e => onVerdictChange(e.target.value)}
        className="text-sm border border-gray-300 rounded-lg px-2 sm:px-3 py-1.5 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
      >
        <option value="all">全部评级</option>
        <option value="STRONG_MATCH">强匹配</option>
        <option value="MODERATE_MATCH">中等匹配</option>
        <option value="WEAK_MATCH">弱匹配</option>
        <option value="PASS">不匹配</option>
      </select>
      <select
        value={sourceFilter}
        onChange={e => onSourceChange(e.target.value)}
        className="text-sm border border-gray-300 rounded-lg px-2 sm:px-3 py-1.5 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
      >
        <option value="all">全部来源</option>
        <option value="product_hunt">Product Hunt</option>
        <option value="github">GitHub</option>
      </select>
      <select
        value={sortBy}
        onChange={e => onSortChange(e.target.value)}
        className="text-sm border border-gray-300 rounded-lg px-2 sm:px-3 py-1.5 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
      >
        <option value="score_desc">评分 高→低</option>
        <option value="score_asc">评分 低→高</option>
        <option value="date_desc">日期 新→旧</option>
        <option value="date_asc">日期 旧→新</option>
      </select>
      <div className="flex items-center gap-2 ml-auto">
        {hasFilters && (
          <button
            onClick={onClear}
            className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
          >
            清除筛选
          </button>
        )}
        <span className="text-xs text-gray-400">
          {filteredCount} / {totalCount}
        </span>
      </div>
    </div>
  );
}
