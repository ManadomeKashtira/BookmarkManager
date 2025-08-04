import React from 'react';

interface LoadingSpinnerProps {
  viewMode: 'grid' | 'list';
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ viewMode }) => {
  const skeletonCount = viewMode === 'grid' ? 12 : 8;

  if (viewMode === 'list') {
    return (
      <div className="space-y-4">
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <div
            key={i}
            className="bg-white/60 backdrop-blur-sm border border-gray-200/50 rounded-xl p-4 animate-pulse"
          >
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 bg-gray-300 rounded-lg" />
              <div className="flex-1">
                <div className="h-5 bg-gray-300 rounded-lg w-3/4 mb-2" />
                <div className="h-4 bg-gray-200 rounded-lg w-full mb-2" />
                <div className="flex gap-2">
                  <div className="h-3 bg-gray-200 rounded-full w-16" />
                  <div className="h-3 bg-gray-200 rounded-full w-20" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: skeletonCount }).map((_, i) => (
        <div
          key={i}
          className="bg-white/60 backdrop-blur-sm border border-gray-200/50 rounded-xl p-6 animate-pulse"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="w-8 h-8 bg-gray-300 rounded-lg" />
            <div className="flex gap-2">
              <div className="w-6 h-6 bg-gray-200 rounded" />
              <div className="w-6 h-6 bg-gray-200 rounded" />
            </div>
          </div>
          <div className="space-y-3 mb-4">
            <div className="h-5 bg-gray-300 rounded-lg w-3/4" />
            <div className="h-4 bg-gray-200 rounded-lg w-full" />
            <div className="h-4 bg-gray-200 rounded-lg w-2/3" />
          </div>
          <div className="flex flex-wrap gap-2 mb-4">
            <div className="h-6 bg-gray-200 rounded-full w-16" />
            <div className="h-6 bg-gray-200 rounded-full w-20" />
            <div className="h-6 bg-gray-200 rounded-full w-14" />
          </div>
          <div className="flex justify-between">
            <div className="h-4 bg-gray-200 rounded-lg w-24" />
            <div className="h-4 bg-gray-200 rounded-lg w-20" />
          </div>
        </div>
      ))}
    </div>
  );
};
