import React, { useState, useEffect } from 'react';
import { previewService } from '../services/previewService';
import { imageCacheService } from '../services/imageCacheService';
import { RefreshCw, Image, Settings, Trash2, BarChart3 } from 'lucide-react';

interface PreviewSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PreviewStats {
  totalPreviews: number;
  expiredPreviews: number;
  cacheSize: string;
  imageStats: {
    totalImages: number;
    totalSize: number;
    expiredImages: number;
    size: string;
  };
}

export function PreviewSettings({ isOpen, onClose }: PreviewSettingsProps) {
  const [stats, setStats] = useState<PreviewStats>({
    totalPreviews: 0,
    expiredPreviews: 0,
    cacheSize: '0 B',
    imageStats: {
      totalImages: 0,
      totalSize: 0,
      expiredImages: 0,
      size: '0 B'
    }
  });
  const [isClearing, setIsClearing] = useState(false);
  const [isClearingImages, setIsClearingImages] = useState(false);
  const [isCleaningExpired, setIsCleaningExpired] = useState(false);

  useEffect(() => {
    if (isOpen) {
      updateStats();
    }
  }, [isOpen]);

  const updateStats = () => {
    const previewStats = previewService.getCacheStats();
    const imageStats = imageCacheService.getCacheStats();
    
    setStats({
      totalPreviews: previewStats.total,
      expiredPreviews: previewStats.expired,
      cacheSize: previewStats.size,
      imageStats: {
        totalImages: imageStats.totalImages,
        totalSize: imageStats.totalSize,
        expiredImages: imageStats.expiredImages,
        size: formatBytes(imageStats.totalSize)
      }
    });
  };

  const handleClearAllPreviews = async () => {
    if (!confirm('Are you sure you want to clear all cached previews? This will remove all preview data and images.')) {
      return;
    }

    setIsClearing(true);
    try {
      previewService.clearCache();
      previewService.clearImageCache();
      updateStats();
    } finally {
      setIsClearing(false);
    }
  };

  const handleClearImages = async () => {
    if (!confirm('Are you sure you want to clear all cached images? Preview thumbnails will need to be downloaded again.')) {
      return;
    }

    setIsClearingImages(true);
    try {
      imageCacheService.clearAllImages();
      updateStats();
    } finally {
      setIsClearingImages(false);
    }
  };

  const handleCleanExpired = async () => {
    setIsCleaningExpired(true);
    try {
      previewService.clearExpiredPreviews();
      const removedImages = imageCacheService.clearExpiredImages();
      updateStats();
      alert(`Cleaned up expired previews and ${removedImages} expired images.`);
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-gray-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              Preview Settings
            </h2>
          </div>
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
          {/* Preview Statistics */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-medium text-gray-900">Cache Statistics</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="text-blue-600 font-medium">Link Previews</div>
                <div className="text-2xl font-bold text-blue-900 mt-1">
                  {stats.totalPreviews}
                </div>
                <div className="text-blue-600 text-xs mt-1">
                  {stats.expiredPreviews} expired
                </div>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="text-green-600 font-medium">Cached Images</div>
                <div className="text-2xl font-bold text-green-900 mt-1">
                  {stats.imageStats.totalImages}
                </div>
                <div className="text-green-600 text-xs mt-1">
                  {stats.imageStats.expiredImages} expired
                </div>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <div className="text-purple-600 font-medium">Preview Cache</div>
                <div className="text-2xl font-bold text-purple-900 mt-1">
                  {stats.cacheSize}
                </div>
                <div className="text-purple-600 text-xs mt-1">
                  Metadata only
                </div>
              </div>
              
              <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                <div className="text-orange-600 font-medium">Image Cache</div>
                <div className="text-2xl font-bold text-orange-900 mt-1">
                  {stats.imageStats.size}
                </div>
                <div className="text-orange-600 text-xs mt-1">
                  {((stats.imageStats.totalSize / (100 * 1024 * 1024)) * 100).toFixed(1)}% of 100MB
                </div>
              </div>
            </div>
          </div>

          {/* Cache Management */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-red-600" />
              <h3 className="text-lg font-medium text-gray-900">Cache Management</h3>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={handleCleanExpired}
                disabled={isCleaningExpired || (stats.expiredPreviews === 0 && stats.imageStats.expiredImages === 0)}
                className="w-full px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${isCleaningExpired ? 'animate-spin' : ''}`} />
                {isCleaningExpired ? 'Cleaning...' : 'Clean Expired Items'}
              </button>
              
              <button
                onClick={handleClearImages}
                disabled={isClearingImages || stats.imageStats.totalImages === 0}
                className="w-full px-4 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                <Image className="w-4 h-4" />
                {isClearingImages ? 'Clearing...' : 'Clear All Images'}
              </button>
              
              <button
                onClick={handleClearAllPreviews}
                disabled={isClearing || stats.totalPreviews === 0}
                className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                {isClearing ? 'Clearing...' : 'Clear All Previews'}
              </button>
            </div>
          </div>

          {/* Information */}
          <div className="text-xs text-gray-500 bg-gray-50 p-4 rounded-lg">
            <p className="font-medium mb-2">About Link Previews:</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>Previews are automatically generated when bookmarks are displayed</li>
              <li>Images are cached locally and compressed to save space</li>
              <li>Preview data expires after 24 hours</li>
              <li>Images expire after 7 days</li>
              <li>Maximum image cache size is 100MB</li>
              <li>Expired items are automatically cleaned up periodically</li>
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