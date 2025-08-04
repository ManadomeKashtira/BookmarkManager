import React, { useState } from 'react';
import { useMultipleLinkPreviews } from '../hooks/useLinkPreview';
import { previewService } from '../services/previewService';
import { Bookmark } from '../types/bookmark';
import { LinkPreview } from '../types/linkPreview';
import { Play, Pause, RefreshCw, CheckCircle, AlertTriangle, Clock } from 'lucide-react';

interface BulkPreviewGeneratorProps {
  bookmarks: Bookmark[];
  isOpen: boolean;
  onClose: () => void;
  onComplete?: (results: { success: number; failed: number }) => void;
}

export function BulkPreviewGenerator({ 
  bookmarks, 
  isOpen, 
  onClose, 
  onComplete 
}: BulkPreviewGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState({ completed: 0, total: 0 });
  const [results, setResults] = useState<{ success: number; failed: number }>({ success: 0, failed: 0 });
  const [currentUrl, setCurrentUrl] = useState<string>('');
  const [generatedPreviews, setGeneratedPreviews] = useState<Record<string, LinkPreview | null>>({});

  const urls = bookmarks.map(bookmark => bookmark.url);

  const startGeneration = async () => {
    setIsGenerating(true);
    setIsPaused(false);
    setProgress({ completed: 0, total: urls.length });
    setResults({ success: 0, failed: 0 });
    setGeneratedPreviews({});

    let completed = 0;
    let success = 0;
    let failed = 0;

    for (const url of urls) {
      if (isPaused) {
        break;
      }

      setCurrentUrl(url);

      try {
        const result = await previewService.generatePreview(url);
        if (result.preview && result.preview.status === 'success') {
          success++;
          setGeneratedPreviews(prev => ({ ...prev, [url]: result.preview }));
        } else {
          failed++;
          setGeneratedPreviews(prev => ({ ...prev, [url]: null }));
        }
      } catch (error) {
        failed++;
        setGeneratedPreviews(prev => ({ ...prev, [url]: null }));
      }

      completed++;
      setProgress({ completed, total: urls.length });
      setResults({ success, failed });

      // Small delay to prevent overwhelming servers
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    setIsGenerating(false);
    setCurrentUrl('');
    onComplete?.({ success, failed });
  };

  const pauseGeneration = () => {
    setIsPaused(true);
    setIsGenerating(false);
  };

  const resumeGeneration = () => {
    setIsPaused(false);
    startGeneration();
  };

  const resetGeneration = () => {
    setIsGenerating(false);
    setIsPaused(false);
    setProgress({ completed: 0, total: 0 });
    setResults({ success: 0, failed: 0 });
    setCurrentUrl('');
    setGeneratedPreviews({});
  };

  const getProgressPercentage = () => {
    if (progress.total === 0) return 0;
    return Math.round((progress.completed / progress.total) * 100);
  };

  const getStatusIcon = (url: string) => {
    if (isGenerating && currentUrl === url) {
      return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
    }
    
    if (generatedPreviews.hasOwnProperty(url)) {
      return generatedPreviews[url] ? 
        <CheckCircle className="w-4 h-4 text-green-500" /> :
        <AlertTriangle className="w-4 h-4 text-red-500" />;
    }
    
    return <Clock className="w-4 h-4 text-gray-400" />;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            Bulk Preview Generation
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
          {/* Progress Overview */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">
                Progress ({progress.completed}/{progress.total})
              </h3>
              <span className="text-2xl font-bold text-blue-600">
                {getProgressPercentage()}%
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${getProgressPercentage()}%` }}
              />
            </div>

            {/* Results Summary */}
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                <div className="text-green-600 font-medium">Successful</div>
                <div className="text-2xl font-bold text-green-900">
                  {results.success}
                </div>
              </div>
              
              <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                <div className="text-red-600 font-medium">Failed</div>
                <div className="text-2xl font-bold text-red-900">
                  {results.failed}
                </div>
              </div>
              
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                <div className="text-gray-600 font-medium">Remaining</div>
                <div className="text-2xl font-bold text-gray-900">
                  {progress.total - progress.completed}
                </div>
              </div>
            </div>

            {/* Current URL */}
            {currentUrl && (
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <div className="text-blue-600 text-sm font-medium mb-1">Currently processing:</div>
                <div className="text-blue-900 text-sm truncate">{currentUrl}</div>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3">
            {!isGenerating && !isPaused && (
              <button
                onClick={startGeneration}
                disabled={urls.length === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                <Play className="w-4 h-4" />
                Start Generation
              </button>
            )}

            {isGenerating && (
              <button
                onClick={pauseGeneration}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2"
              >
                <Pause className="w-4 h-4" />
                Pause
              </button>
            )}

            {isPaused && (
              <button
                onClick={resumeGeneration}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <Play className="w-4 h-4" />
                Resume
              </button>
            )}

            <button
              onClick={resetGeneration}
              disabled={isGenerating}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Reset
            </button>
          </div>

          {/* Bookmark List */}
          <div className="space-y-2">
            <h4 className="font-medium text-gray-900">Bookmarks ({bookmarks.length})</h4>
            <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
              {bookmarks.map((bookmark) => (
                <div
                  key={bookmark.id}
                  className={`flex items-center gap-3 p-3 border-b border-gray-100 last:border-b-0 ${
                    currentUrl === bookmark.url ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex-shrink-0">
                    {getStatusIcon(bookmark.url)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">
                      {bookmark.title}
                    </div>
                    <div className="text-sm text-gray-500 truncate">
                      {bookmark.url}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Information */}
          <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
            <p className="mb-2">
              <strong>About Bulk Generation:</strong>
            </p>
            <ul className="space-y-1 list-disc list-inside">
              <li>Previews are generated with a small delay to avoid overwhelming servers</li>
              <li>Failed previews can be retried individually later</li>
              <li>Generated previews are automatically cached for future use</li>
              <li>You can pause and resume the process at any time</li>
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