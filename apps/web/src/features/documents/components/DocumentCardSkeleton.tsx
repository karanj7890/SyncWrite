interface SkeletonProps {
  viewMode: 'grid' | 'list'
}

export function DocumentCardSkeleton({ viewMode }: SkeletonProps) {
  if (viewMode === 'list') {
    return (
      <div className="flex items-center gap-4 p-3 border-b border-slate-100 animate-pulse">
        <div className="h-9 w-9 bg-slate-200 rounded-lg" />
        <div className="flex-1">
          <div className="h-4 bg-slate-200 rounded w-1/3" />
        </div>
        <div className="h-3 bg-slate-200 rounded w-24" />
      </div>
    )
  }

  return (
    <div className="relative bg-white rounded-xl border border-slate-200 p-5 h-[280px] flex flex-col animate-pulse overflow-hidden">
      <div className="h-3 w-full bg-slate-100 rounded-t-xl absolute top-0 left-0" />

      <div className="mt-4 mb-4">
        <div className="h-9 w-9 bg-slate-200 rounded-lg" />
      </div>

      <div className="h-6 bg-slate-200 rounded w-3/4 mb-3" />
      <div className="h-6 bg-slate-200 rounded w-1/2 mb-6" />

      <div className="space-y-2 flex-1">
        <div className="h-3 bg-slate-100 rounded w-full" />
        <div className="h-3 bg-slate-100 rounded w-5/6" />
        <div className="h-3 bg-slate-100 rounded w-4/6" />
      </div>

      <div className="pt-4 mt-auto border-t border-slate-100 flex justify-between items-center">
        <div className="h-3 bg-slate-200 rounded w-20" />
        <div className="h-6 w-6 bg-slate-200 rounded-full" />
      </div>
    </div>
  )
}
