export function EditorSkeleton() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header skeleton */}
      <div className="fixed top-0 left-0 right-0 h-14 bg-white border-b border-slate-100 flex items-center px-4 gap-4 animate-pulse">
        <div className="h-8 w-20 bg-slate-200 rounded-lg" />
        <div className="h-4 w-40 bg-slate-200 rounded" />
      </div>

      {/* Content skeleton */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-8 py-40 animate-pulse">
        <div className="h-12 bg-slate-200 rounded-lg w-2/3 mb-8" />
        <div className="h-px bg-slate-100 mb-8" />
        <div className="space-y-4">
          <div className="h-4 bg-slate-100 rounded w-full" />
          <div className="h-4 bg-slate-100 rounded w-5/6" />
          <div className="h-4 bg-slate-100 rounded w-4/6" />
          <div className="h-4 bg-slate-100 rounded w-full" />
          <div className="h-4 bg-slate-100 rounded w-3/4" />
        </div>
      </main>
    </div>
  )
}
