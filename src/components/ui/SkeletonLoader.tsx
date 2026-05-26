import React from 'react';

interface SkeletonLoaderProps {
  count?: number;
  className?: string;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ count = 1, className = '' }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`animate-shimmer bg-white/5 rounded-xl ${className}`} />
      ))}
    </>
  );
};

export const CardSkeleton: React.FC = () => (
  <div className="glass border border-white/10 rounded-2xl p-5 space-y-3">
    <SkeletonLoader className="h-6 w-3/4" />
    <SkeletonLoader className="h-10 w-1/2" />
    <SkeletonLoader className="h-4 w-full" />
  </div>
);

export default SkeletonLoader;
