import React, { useState, useEffect } from 'react';
import { X, Play, Pause, RotateCcw, AlertTriangle, CheckCircle, Clock, ExternalLink } from 'lucide-react';
import { Bookmark } from '../types/bookmark';
import { BulkHealthCheckProgress, HealthCheckResult, LinkHealthStatus } from '../types/healthCheck';
import { healthCheckService } from '../services/healthCheckService';

interface HealthCheckModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookmarks: Bookmark[];
  onUpdateBookmark?: (id: string, updates: Partial<Bookmark>) => void;
  onDeleteBookmark?: (id: string) => void;
}

export const HealthCheckModal: React.FC<HealthCheckModalProps> = ({
  isOpen,
  onClose,
  bookmarks,
  onUpdateBookmark,
  onDeleteBookmark
}) => {
  const [isChecking, setIsChecking] = useState(false);
  const [progress, setProgress] = useState<BulkHealthCheckProgress | null>(null);
  const [results, setResults] = useState<HealthCheckResult[]>([]);
  const [filter, setFilter] = useState<'all' | 'healthy' | 'broken' | 'warning'>('all');
  const [sortBy, setSortBy] = useState<'status' | 'url' | 'responseTime'>('status');

  useEffect(() => {
    if (isOpen) {
      // Load existing health statuses when modal opens
      loadExistingHealthStatuses();
    }
  }, [isOpen, bookmarks]);

  const loadExistingHealthStatuses = () => {
    const existingStatuses = healthCheckService.getAllHealthStatuses();
    const existingResults: HealthCheckResult[] = bookmarks.map(bookmark => ({
      bookmarkId: bookmark.id,
      url: bookmark.url,
      status: existingStatuses[bookmark.id] || {
        status: 'unknown',
        lastChecked: new Date(0)
      },
      checkedAt: existingStatuses[bookmark.id]?.lastChecked || new Date(0)
    }));
    setResults(existingResults);
  };

  const startHealthCheck = async () => {
    alert('🔍 Starting health check...\n\nChecking the status of all your bookmarked links. This may take a few minutes depending on the number of bookmarks and network conditions.');
    
    setIsChecking(true);
    setProgress({
      total: bookmarks.length,
      completed: 0,
      failed: 0,
      inProgress: true,
      startTime: new Date()
    });

    try {
      const checkResults = await healthCheckService.checkAllLinks(bookmarks, (progressUpdate) => {
        setProgress(progressUpdate);
      });

      // Store results in localStorage
      checkResults.forEach(result => {
        healthCheckService.storeHealthStatus(result.bookmarkId, result.status);
      });

      setResults(checkResults);
      
      // Count results by status
      const healthyCount = checkResults.filter(r => r.status.status === 'healthy').length;
      const brokenCount = checkResults.filter(r => r.status.status === 'broken').length;
      const warningCount = checkResults.filter(r => r.status.status === 'warning').length;
      
      alert(`✅ Health check complete!\n\nResults:\n• Healthy: ${healthyCount}\n• Broken: ${brokenCount}\n• Warning: ${warningCount}\n\nTotal checked: ${checkResults.length} bookmarks`);
    } catch (error) {
      console.error('Health check failed:', error);
      alert('❌ Health check failed!\n\nAn error occurred during the health check process. Please try again.');
    } finally {
      setIsChecking(false);
      setProgress(null);
    }
  };

  const cancelHealthCheck = () => {
    if (confirm('⚠️ Cancel health check?\n\nThis will stop the current health check process. Progress will be lost.')) {
      healthCheckService.cancelBulkCheck();
      setIsChecking(false);
      setProgress(null);
      alert('❌ Health check cancelled.');
    }
  };

  const retryBookmark = async (bookmarkId: string, url: string) => {
    try {
      const status = await healthCheckService.checkSingleLink(url);
      healthCheckService.storeHealthStatus(bookmarkId, status);
      
      // Update results
      setResults(prev => prev.map(result => 
        result.bookmarkId === bookmarkId 
          ? { ...result, status, checkedAt: new Date() }
          : result
      ));
    } catch (error) {
      console.error('Retry failed:', error);
    }
  };

  const getStatusIcon = (status: LinkHealthStatus['status']) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'broken':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'checking':
        return <Clock className="w-4 h-4 text-blue-500 animate-spin" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusText = (status: LinkHealthStatus['status']) => {
    switch (status) {
      case 'healthy': return 'Healthy';
      case 'broken': return 'Broken';
      case 'warning': return 'Warning';
      case 'checking': return 'Checking...';
      default: return 'Unknown';
    }
  };

  const getStatusColor = (status: LinkHealthStatus['status']) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-50';
      case 'broken': return 'text-red-600 bg-red-50';
      case 'warning': return 'text-yellow-600 bg-yellow-50';
      case 'checking': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const filteredResults = results.filter(result => {
    if (filter === 'all') return true;
    return result.status.status === filter;
  });

  const sortedResults = [...filteredResults].sort((a, b) => {
    switch (sortBy) {
      case 'status':
        return a.status.status.localeCompare(b.status.status);
      case 'url':
        return a.url.localeCompare(b.url);
      case 'responseTime':
        return (b.status.responseTime || 0) - (a.status.responseTime || 0);
      default:
        return 0;
    }
  });

  const getBookmarkTitle = (bookmarkId: string) => {
    const bookmark = bookmarks.find(b => b.id === bookmarkId);
    return bookmark?.title || 'Unknown Bookmark';
  };

  const formatResponseTime = (time?: number) => {
    if (!time) return 'N/A';
    return `${time}ms`;
  };

  const formatLastChecked = (date: Date) => {
    if (date.getTime() === 0) return 'Never';
    return new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(
      Math.floor((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
      'day'
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Link Health Check</h2>
            <p className="text-gray-600 mt-1">
              Check the health status of your bookmarked links
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Controls */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              {!isChecking ? (
                <button
                  onClick={startHealthCheck}
                  className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <Play className="w-4 h-4" />
                  Start Health Check
                </button>
              ) : (
                <button
                  onClick={cancelHealthCheck}
                  className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
                >
                  <Pause className="w-4 h-4" />
                  Cancel Check
                </button>
              )}
            </div>

            <div className="flex items-center gap-4">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Results</option>
                <option value="healthy">Healthy</option>
                <option value="broken">Broken</option>
                <option value="warning">Warning</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="status">Sort by Status</option>
                <option value="url">Sort by URL</option>
                <option value="responseTime">Sort by Response Time</option>
              </select>
            </div>
          </div>

          {/* Progress Bar */}
          {progress && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">
                  Checking {progress.completed} of {progress.total} bookmarks
                  {progress.currentUrl && (
                    <span className="block text-xs text-gray-500 truncate max-w-md">
                      Current: {progress.currentUrl}
                    </span>
                  )}
                </span>
                <span className="text-sm text-gray-600">
                  {Math.round((progress.completed / progress.total) * 100)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(progress.completed / progress.total) * 100}%` }}
                />
              </div>
              {progress.estimatedTimeRemaining && (
                <p className="text-xs text-gray-500 mt-1">
                  Estimated time remaining: {Math.round(progress.estimatedTimeRemaining)}s
                </p>
              )}
            </div>
          )}
        </div>

        {/* Results */}
        <div className="flex-1 overflow-auto max-h-96">
          {sortedResults.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No health check results yet. Click "Start Health Check" to begin.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {sortedResults.map((result) => (
                <div key={result.bookmarkId} className="p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        {getStatusIcon(result.status.status)}
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(result.status.status)}`}>
                          {getStatusText(result.status.status)}
                        </span>
                        {result.status.statusCode && (
                          <span className="text-xs text-gray-500">
                            HTTP {result.status.statusCode}
                          </span>
                        )}
                        {result.status.responseTime && (
                          <span className="text-xs text-gray-500">
                            {formatResponseTime(result.status.responseTime)}
                          </span>
                        )}
                      </div>
                      
                      <h4 className="font-medium text-gray-900 truncate">
                        {getBookmarkTitle(result.bookmarkId)}
                      </h4>
                      
                      <p className="text-sm text-gray-600 truncate">
                        {result.url}
                      </p>
                      
                      {result.status.errorMessage && (
                        <p className="text-sm text-red-600 mt-1">
                          {result.status.errorMessage}
                        </p>
                      )}
                      
                      <p className="text-xs text-gray-500 mt-1">
                        Last checked: {formatLastChecked(result.status.lastChecked)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => retryBookmark(result.bookmarkId, result.url)}
                        className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Retry check"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => window.open(result.url, '_blank')}
                        className="p-2 text-gray-400 hover:text-green-500 hover:bg-green-50 rounded-lg transition-colors"
                        title="Open link"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>

                      {result.status.status === 'broken' && onDeleteBookmark && (
                        <button
                          onClick={() => {
                            if (window.confirm('Delete this broken bookmark?')) {
                              onDeleteBookmark(result.bookmarkId);
                              setResults(prev => prev.filter(r => r.bookmarkId !== result.bookmarkId));
                            }
                          }}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete bookmark"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div>
              Total: {results.length} bookmarks
              {results.length > 0 && (
                <>
                  {' • '}
                  Healthy: {results.filter(r => r.status.status === 'healthy').length}
                  {' • '}
                  Broken: {results.filter(r => r.status.status === 'broken').length}
                  {' • '}
                  Warning: {results.filter(r => r.status.status === 'warning').length}
                </>
              )}
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};