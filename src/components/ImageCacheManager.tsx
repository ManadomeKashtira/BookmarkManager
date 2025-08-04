import React, { useState, useEffect } from 'react';
import { imageCacheService } from '../services/imageCacheService';
import { previewService } from '../services/previewService';

interface ImageCacheManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ImageCacheManager({ isOpen, onClose }: ImageCacheManagerProps) {
  const [stats, setStats] = useState({
    totalImages: 0,
    totalSize: 0,
    expiredImages: 0,
    oldestImage: null as Date | null,
    newestImage: null as Date | null
  });
  const [isClearing, setIsClearing] = useState(false);
  const [isCleaningExpired, setIsCleaningExpired] = useState(false);

  useEffect(() => {
    if (isOpen) {
      updateStats();
    }
  }, [isOpen]);

  const updateStats = () => {
    const cacheStats = imageCacheService.getCacheStats();
    setStats(cacheStats);
  };

  const handleClearAll = async () => {
    if (!confirm('Are you sure you want to clear all cached images? This will free up storage space but images will need to be downloaded again.')) {
      return;
    }

    setIsClearing(true);
    try {
      imageCacheService.clearAllImages();
      previewService.clearImageCache();
      updateStats();
    } finally {
      setIsClearing(false);
    }
  };

  const handleClearExpired = async () => {
    setIsCleaningExpired(true);
    try {
      const removedCount = imageCacheService.clearExpiredImages();
      updateStats();
      alert(`Removed ${removedCount} expired images from cache.`);
    } finally {
      setIsCleaningExpired(false);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (date: Date | null): string => {
    if (!date) return 'N/A';
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            Image Cache Manager
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Cache Statistics */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Cache Statistics</h3>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-gray-600">Total Images</div>
                <div className="text-xl font-semibold text-gray-900">
                  {stats.totalImages}
                </div>
              </div>
              
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-gray-600">Cache Size</div>
                <div className="text-xl font-semibold text-gray-900">
                  {formatBytes(stats.totalSize)}
                </div>
              </div>
              
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-gray-600">Expired Images</div>
                <div className="text-xl font-semibold text-orange-600">
                  {stats.expiredImages}
                </div>
              </div>
              
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-gray-600">Cache Usage</div>
                <div className="text-xl font-semibold text-blue-600">
                  {((stats.totalSize / (100 * 1024 * 1024)) * 100).toFixed(1)}%
                </div>
              </div>
            </div>

            {stats.oldestImage && (
              <div className="text-sm text-gray-600">
                <div>Oldest cached: {formatDate(stats.oldestImage)}</div>
                <div>Newest cached: {formatDate(stats.newestImage)}</div>
              </div>
            )}
          </div>

          {/* Cache Management Actions */}
          <div className="space-y-3">
            <h3 className="text-lg font-medium text-gray-900">Cache Management</h3>
            
            <button
              onClick={handleClearExpired}
              disabled={isCleaningExpired || stats.expiredImages === 0}
              className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {isCleaningExpired ? 'Cleaning...' : `Clear Expired Images (${stats.expiredImages})`}
            </button>
            
            <button
              onClick={handleClearAll}
              disabled={isClearing || stats.totalImages === 0}
              className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {isClearing ? 'Clearing...' : 'Clear All Cached Images'}
            </button>
          </div>

          {/* Cache Information */}
          <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
            <p className="mb-2">
              <strong>About Image Cache:</strong>
            </p>
            <ul className="space-y-1 list-disc list-inside">
              <li>Images are cached locally for faster loading</li>
              <li>Thumbnails are generated to save space</li>
              <li>Cache automatically cleans expired images</li>
              <li>Maximum cache size: 100MB</li>
              <li>Images expire after 7 days</li>
            </ul>
          </div>
        </div>

        <div className="flex justify-end p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}