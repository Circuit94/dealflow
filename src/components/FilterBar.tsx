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
  const hasFilters = verdictFilter !== 'all' || sourceFilter !== 'all' || categoryFilter !== 'all';

  return (
    <div className="flex items-center gap-2 sm:gap-3 flex-wrap bg-white rounded-lg border border-gray-200 p-3">
      <span className="text-sm text-gray-500 font-medium hidden sm:inline">Filter:</span>
      <select
        value={verdictFilter}
        onChange={e => onVerdictChange(e.target.value)}
        className="text-sm border border-gray-300 rounded-lg px-2 sm:px-3 py-1.5 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
      >
        <option value="all">All verdicts</option>
        <option value="STRONG_MATCH">Strong Match</option>
        <option value="MODERATE_MATCH">Moderate Match</option>
        <option value="WEAK_MATCH">Weak Match</option>
        <option value="PASS">Pass</option>
      </select>
      <select
        value={sourceFilter}
        onChange={e => onSourceChange(e.target.value)}
        className="text-sm border border-gray-300 rounded-lg px-2 sm:px-3 py-1.5 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
      >
        <option value="all">All sources</option>
        <option value="product_hunt">Product Hunt</option>
        <option value="github">GitHub</option>
      </select>
      {categories.length > 0 && onCategoryChange && (
        <select
          value={categoryFilter}
          onChange={e => onCategoryChange(e.target.value)}
          className="text-sm border border-gray-300 rounded-lg px-2 sm:px-3 py-1.5 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
        >
          <option value="all">All categories</option>
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
        <option value="score_desc">Score ↓</option>
        <option value="score_asc">Score ↑</option>
        <option value="date_desc">Newest first</option>
        <option value="date_asc">Oldest first</option>
      </select>
      <div className="flex items-center gap-2 ml-auto">
        {hasFilters && (
          <button
            onClick={onClear}
            className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Clear
          </button>
        )}
        <span className="text-xs text-gray-400">
          {filteredCount} / {totalCount}
        </span>
      </div>
    </div>
  );
}
