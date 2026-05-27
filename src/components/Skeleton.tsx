export function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-4 w-20 bg-gray-200 rounded" />
            <div className="h-5 w-40 bg-gray-200 rounded" />
            <div className="h-5 w-16 bg-gray-200 rounded-full" />
          </div>
          <div className="h-4 w-3/4 bg-gray-200 rounded" />
          <div className="h-8 w-full bg-gray-100 rounded-lg" />
          <div className="flex gap-2">
            <div className="h-5 w-16 bg-gray-100 rounded" />
            <div className="h-5 w-24 bg-gray-100 rounded" />
          </div>
        </div>
        <div className="ml-6 flex flex-col items-center gap-2">
          <div className="w-14 h-14 bg-gray-200 rounded-full" />
          <div className="h-3 w-8 bg-gray-100 rounded" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonBrief() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-8 animate-pulse">
      <div className="flex items-center justify-between mb-6">
        <div className="h-6 w-32 bg-gray-200 rounded" />
        <div className="flex gap-4">
          <div className="h-4 w-24 bg-gray-100 rounded" />
          <div className="h-4 w-20 bg-gray-100 rounded" />
        </div>
      </div>
      <div className="space-y-3">
        <div className="h-4 w-full bg-gray-100 rounded" />
        <div className="h-4 w-5/6 bg-gray-100 rounded" />
        <div className="h-4 w-4/6 bg-gray-100 rounded" />
        <div className="h-4 w-full bg-gray-100 rounded" />
        <div className="h-4 w-3/4 bg-gray-100 rounded" />
      </div>
    </div>
  );
}
