import { useMemo } from 'react';
import type { Bookmark, AnalyticsData } from '@/types/bookmark';

export const useAnalytics = (bookmarks: Bookmark[]): AnalyticsData => {
  return useMemo(() => {
    if (!bookmarks || bookmarks.length === 0) {
      return {
        bookmarksAddedThisWeek: 0,
        bookmarksAddedThisMonth: 0,
        mostActiveDay: 'N/A',
        categoryDistribution: [],
        visitTrends: Array(7).fill(null).map((_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - i);
          return { date: d.toISOString().split('T')[0], visits: 0 };
        }).reverse(),
        topBookmarks: []
      };
    }

    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const bookmarksAddedThisWeek = bookmarks.filter(b => new Date(b.dateAdded) >= oneWeekAgo).length;
    const bookmarksAddedThisMonth = bookmarks.filter(b => new Date(b.dateAdded) >= oneMonthAgo).length;

    const dayCount = bookmarks.reduce((acc, bookmark) => {
      const day = new Date(bookmark.dateAdded).toLocaleDateString('en-US', { weekday: 'long' });
      acc[day] = (acc[day] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const mostActiveDay = Object.keys(dayCount).length > 0 
        ? Object.entries(dayCount).reduce((a, b) => (a[1] > b[1] ? a : b))[0]
        : 'N/A';


    const categoryCount = bookmarks.reduce((acc, bookmark) => {
      acc[bookmark.category] = (acc[bookmark.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const totalBookmarks = bookmarks.length;
    const categoryDistribution = Object.entries(categoryCount).map(([category, count]) => ({
      category,
      count,
      percentage: totalBookmarks > 0 ? Math.round((count / totalBookmarks) * 100) : 0
    })).sort((a, b) => b.count - a.count);

    const visitTrends = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      // This simulation logic is simplistic, real visit tracking would be different
      const visitsOnDate = bookmarks.reduce((sum, bookmark) => {
        const bookmarkDateStr = new Date(bookmark.dateAdded).toISOString().split('T')[0];
        // Crude simulation: 1/10th of total visits if added on this trend day, or 1 if matches.
        // This is very arbitrary and needs a proper visit tracking mechanism for real data.
        if (bookmarkDateStr === dateStr) {
           return sum + Math.max(1, Math.floor(bookmark.visits / 10));
        }
        return sum;
      }, 0);
      return { date: dateStr, visits: visitsOnDate };
    }).reverse();

    const topBookmarks = [...bookmarks]
      .sort((a, b) => b.visits - a.visits)
      .slice(0, 5);

    return {
      bookmarksAddedThisWeek,
      bookmarksAddedThisMonth,
      mostActiveDay,
      categoryDistribution,
      visitTrends,
      topBookmarks
    };
  }, [bookmarks]);
};
