export const SkeletonCard = () => (
  <div className="rounded-2xl p-5 bg-white/4 border border-white/8 animate-pulse">
    <div className="flex items-start justify-between mb-4">
      <div className="w-12 h-12 rounded-xl bg-white/10" />
      <div className="w-16 h-6 rounded-full bg-white/10" />
    </div>
    <div className="space-y-2">
      <div className="w-24 h-3 rounded bg-white/10" />
      <div className="w-32 h-7 rounded bg-white/10" />
    </div>
  </div>
);

export const SkeletonTable = ({ rows = 5 }: { rows?: number }) => (
  <div className="animate-pulse space-y-3">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex items-center gap-4 p-4 bg-white/4 rounded-xl">
        <div className="w-10 h-10 rounded-full bg-white/10 flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="w-3/4 h-3 bg-white/10 rounded" />
          <div className="w-1/2 h-3 bg-white/10 rounded" />
        </div>
        <div className="w-20 h-8 bg-white/10 rounded-lg" />
      </div>
    ))}
  </div>
);

export const SkeletonText = ({ lines = 3 }: { lines?: number }) => (
  <div className="animate-pulse space-y-2">
    {Array.from({ length: lines }).map((_, i) => (
      <div key={i} className={`h-3 bg-white/10 rounded ${i === lines - 1 ? 'w-2/3' : 'w-full'}`} />
    ))}
  </div>
);
