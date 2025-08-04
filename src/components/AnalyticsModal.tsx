import React from 'react';
import { X, TrendingUp, Calendar, BarChart3, Star, Eye } from 'lucide-react';
import type { AnalyticsData } from '@/types/bookmark';

interface AnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  analytics: AnalyticsData;
}

export const AnalyticsModal: React.FC<AnalyticsModalProps> = ({
  isOpen,
  onClose,
  analytics
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              Analytics Dashboard
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-8">
          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl">
              <div className="flex items-center gap-3 mb-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-blue-900">This Week</h3>
              </div>
              <p className="text-2xl font-bold text-blue-600">{analytics.bookmarksAddedThisWeek}</p>
              <p className="text-sm text-blue-700">Bookmarks added</p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                <h3 className="font-semibold text-purple-900">This Month</h3>
              </div>
              <p className="text-2xl font-bold text-purple-600">{analytics.bookmarksAddedThisMonth}</p>
              <p className="text-sm text-purple-700">Bookmarks added</p>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-6 rounded-xl">
              <div className="flex items-center gap-3 mb-2">
                <Star className="w-5 h-5 text-amber-600" />
                <h3 className="font-semibold text-amber-900">Most Active</h3>
              </div>
              <p className="text-2xl font-bold text-amber-600">{analytics.mostActiveDay}</p>
              <p className="text-sm text-amber-700">Day of the week</p>
            </div>
          </div>

          {/* Category Distribution */}
          <div className="bg-gray-50 p-6 rounded-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Distribution</h3>
            <div className="space-y-3">
              {analytics.categoryDistribution.map((item) => (
                <div key={item.category} className="flex items-center gap-4">
                  <div className="w-24 text-sm font-medium text-gray-700">{item.category}</div>
                  <div className="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-500"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                  <div className="w-16 text-sm text-gray-600 text-right">
                    {item.count} ({item.percentage}%)
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Bookmarks */}
          <div className="bg-gray-50 p-6 rounded-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Most Visited Bookmarks</h3>
             {analytics.topBookmarks.length > 0 ? (
                <div className="space-y-3">
                {analytics.topBookmarks.map((bookmark, index) => (
                    <div key={bookmark.id} className="flex items-center gap-4 p-3 bg-white rounded-lg">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                        {index + 1}
                    </div>
                    <div className="text-2xl">{bookmark.favicon}</div>
                    <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 truncate">{bookmark.title}</h4>
                        <p className="text-sm text-gray-600 truncate">{bookmark.description}</p>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Eye className="w-4 h-4" />
                        {bookmark.visits}
                    </div>
                    </div>
                ))}
                </div>
            ) : (
                <p className="text-sm text-gray-600">No visit data yet.</p>
            )}
          </div>

          {/* Visit Trends */}
          <div className="bg-gray-50 p-6 rounded-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Visit Trends (Last 7 Days)</h3>
            {analytics.visitTrends.some(day => day.visits > 0) ? (
                <div className="flex items-end gap-2 h-32">
                {analytics.visitTrends.map((day) => (
                    <div key={day.date} className="flex-1 flex flex-col items-center gap-2">
                    <div
                        className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg transition-all duration-500 hover:from-blue-600 hover:to-blue-500"
                        style={{ 
                        height: `${Math.max((day.visits / (Math.max(...analytics.visitTrends.map(d => d.visits), 1))) * 100, 5)}%`,
                        minHeight: '8px'
                        }}
                    />
                    <div className="text-xs text-gray-600 text-center">
                        {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                    </div>
                    <div className="text-xs font-medium text-gray-800">{day.visits}</div>
                    </div>
                ))}
                </div>
            ) : (
                 <p className="text-sm text-gray-600">No visit trend data available for the last 7 days.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
