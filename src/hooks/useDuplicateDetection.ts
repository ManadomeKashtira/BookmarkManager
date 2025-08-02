import { useState, useCallback, useMemo } from 'react';
import { Bookmark } from '@/types/bookmark';
import { 
  DuplicateBookmark, 
  DuplicateDetectionOptions, 
  MergeOptions,
  DuplicateDetectionResult 
} from '@/types/duplicateDetection';
import { duplicateDetectorService } from '@/services/duplicateDetectorService';

interface UseDuplicateDetectionProps {
  bookmarks: Bookmark[];
  onUpdateBookmark?: (id: string, updates: Partial<Bookmark>) => void;
  onDeleteBookmark?: (id: string) => void;
}

export const useDuplicateDetection = ({
  bookmarks,
  onUpdateBookmark,
  onDeleteBookmark
}: UseDuplicateDetectionProps) => {
  // Ensure bookmarks is always an array
  const safeBookmarks = bookmarks || [];
  const [detectionOptions, setDetectionOptions] = useState<DuplicateDetectionOptions>(
    duplicateDetectorService.getDefaultDetectionOptions()
  );
  const [isDetecting, setIsDetecting] = useState(false);
  const [lastDetectionResult, setLastDetectionResult] = useState<DuplicateDetectionResult | null>(null);

  /**
   * Check if a new bookmark would be a duplicate
   */
  const checkForDuplicates = useCallback(
    (newBookmark: Omit<Bookmark, 'id' | 'dateAdded' | 'dateModified' | 'visits'>) => {
      const tempBookmark: Bookmark = {
        ...newBookmark,
        id: 'temp',
        dateAdded: new Date(),
        dateModified: new Date(),
        visits: 0
      };

      return duplicateDetectorService.checkForDuplicate(
        tempBookmark,
        safeBookmarks,
        detectionOptions
      );
    },
    [safeBookmarks, detectionOptions]
  );

  /**
   * Check for duplicates in real-time as user types URL
   */
  const checkUrlInRealTime = useCallback(
    (url: string): DuplicateBookmark[] => {
      if (!url || url.length < 10) return []; // Don't check very short URLs
      
      const tempBookmark: Bookmark = {
        id: 'temp',
        title: 'Temp',
        url,
        category: 'Temp',
        tags: [],
        isFavorite: false,
        dateAdded: new Date(),
        dateModified: new Date(),
        visits: 0
      };

      return duplicateDetectorService.checkForDuplicate(
        tempBookmark,
        safeBookmarks,
        {
          ...detectionOptions,
          titleSimilarityMatching: false // Only check URL for real-time
        }
      );
    },
    [safeBookmarks, detectionOptions]
  );

  /**
   * Run full duplicate detection on all bookmarks
   */
  const detectAllDuplicates = useCallback(async () => {
    setIsDetecting(true);
    try {
      const result = duplicateDetectorService.findDuplicates(safeBookmarks, detectionOptions);
      setLastDetectionResult(result);
      return result;
    } finally {
      setIsDetecting(false);
    }
  }, [safeBookmarks, detectionOptions]);

  /**
   * Merge duplicate bookmarks
   */
  const mergeDuplicates = useCallback(
    (duplicateIds: string[], mergeOptions: MergeOptions) => {
      if (!onUpdateBookmark || !onDeleteBookmark) {
        throw new Error('Update and delete functions are required for merging');
      }

      const duplicateBookmarks = safeBookmarks.filter(b => duplicateIds.includes(b.id));
      if (duplicateBookmarks.length < 2) {
        throw new Error('At least 2 bookmarks are required for merging');
      }

      // Convert to DuplicateBookmark format
      const duplicatesForMerge = duplicateBookmarks.map(b => ({
        id: b.id,
        title: b.title,
        url: b.url,
        description: b.description,
        category: b.category,
        tags: b.tags,
        isFavorite: b.isFavorite,
        dateAdded: b.dateAdded,
        dateModified: b.dateModified,
        visits: b.visits,
        favicon: b.favicon
      }));

      // Merge the duplicates
      const merged = duplicateDetectorService.mergeDuplicates(duplicatesForMerge, mergeOptions);

      // Update the first bookmark with merged data
      const primaryBookmarkId = duplicateIds[0];
      onUpdateBookmark(primaryBookmarkId, {
        title: merged.title,
        url: merged.url,
        description: merged.description,
        category: merged.category,
        tags: merged.tags,
        isFavorite: merged.isFavorite,
        visits: merged.visits,
        favicon: merged.favicon,
        dateModified: new Date()
      });

      // Delete the other bookmarks
      for (let i = 1; i < duplicateIds.length; i++) {
        onDeleteBookmark(duplicateIds[i]);
      }

      return primaryBookmarkId;
    },
    [safeBookmarks, onUpdateBookmark, onDeleteBookmark]
  );

  /**
   * Merge a new bookmark with an existing duplicate
   */
  const mergeWithExisting = useCallback(
    (
      newBookmark: Omit<Bookmark, 'id' | 'dateAdded' | 'dateModified' | 'visits'>,
      existingBookmarkId: string,
      mergeOptions: MergeOptions
    ) => {
      if (!onUpdateBookmark) {
        throw new Error('Update function is required for merging');
      }

      const existingBookmark = safeBookmarks.find(b => b.id === existingBookmarkId);
      if (!existingBookmark) {
        throw new Error('Existing bookmark not found');
      }

      // Create temporary bookmark for the new one
      const tempNewBookmark: DuplicateBookmark = {
        id: 'temp',
        title: newBookmark.title,
        url: newBookmark.url,
        description: newBookmark.description,
        category: newBookmark.category,
        tags: newBookmark.tags,
        isFavorite: newBookmark.isFavorite,
        dateAdded: new Date(),
        dateModified: new Date(),
        visits: 0,
        favicon: newBookmark.favicon
      };

      // Convert existing bookmark
      const existingDuplicate: DuplicateBookmark = {
        id: existingBookmark.id,
        title: existingBookmark.title,
        url: existingBookmark.url,
        description: existingBookmark.description,
        category: existingBookmark.category,
        tags: existingBookmark.tags,
        isFavorite: existingBookmark.isFavorite,
        dateAdded: existingBookmark.dateAdded,
        dateModified: existingBookmark.dateModified,
        visits: existingBookmark.visits,
        favicon: existingBookmark.favicon
      };

      // Merge them (existing first, then new)
      const merged = duplicateDetectorService.mergeDuplicates(
        [existingDuplicate, tempNewBookmark],
        mergeOptions
      );

      // Update the existing bookmark
      onUpdateBookmark(existingBookmarkId, {
        title: merged.title,
        url: merged.url,
        description: merged.description,
        category: merged.category,
        tags: merged.tags,
        isFavorite: merged.isFavorite,
        visits: merged.visits,
        favicon: merged.favicon,
        dateModified: new Date()
      });

      return existingBookmarkId;
    },
    [safeBookmarks, onUpdateBookmark]
  );

  /**
   * Get similarity score between two bookmarks
   */
  const getSimilarityScore = useCallback(
    (bookmark1: Bookmark, bookmark2: Bookmark) => {
      const duplicate1: DuplicateBookmark = {
        id: bookmark1.id,
        title: bookmark1.title,
        url: bookmark1.url,
        description: bookmark1.description,
        category: bookmark1.category,
        tags: bookmark1.tags,
        isFavorite: bookmark1.isFavorite,
        dateAdded: bookmark1.dateAdded,
        dateModified: bookmark1.dateModified,
        visits: bookmark1.visits,
        favicon: bookmark1.favicon
      };

      const duplicate2: DuplicateBookmark = {
        id: bookmark2.id,
        title: bookmark2.title,
        url: bookmark2.url,
        description: bookmark2.description,
        category: bookmark2.category,
        tags: bookmark2.tags,
        isFavorite: bookmark2.isFavorite,
        dateAdded: bookmark2.dateAdded,
        dateModified: bookmark2.dateModified,
        visits: bookmark2.visits,
        favicon: bookmark2.favicon
      };

      // Access private method through service instance
      return (duplicateDetectorService as any).calculateSimilarity(
        duplicate1,
        duplicate2,
        detectionOptions
      );
    },
    [detectionOptions]
  );

  /**
   * Get default merge options
   */
  const getDefaultMergeOptions = useCallback(() => {
    return duplicateDetectorService.getDefaultMergeOptions();
  }, []);

  /**
   * Update detection options
   */
  const updateDetectionOptions = useCallback((options: Partial<DuplicateDetectionOptions>) => {
    setDetectionOptions(prev => ({ ...prev, ...options }));
  }, []);

  /**
   * Statistics about duplicates in the current collection
   */
  const duplicateStats = useMemo(() => {
    if (!lastDetectionResult || !lastDetectionResult.duplicateGroups) return null;

    return {
      totalGroups: lastDetectionResult.duplicateGroups.length,
      totalDuplicates: lastDetectionResult.totalDuplicates,
      exactMatches: lastDetectionResult.exactMatches,
      normalizedMatches: lastDetectionResult.normalizedMatches,
      titleSimilarMatches: lastDetectionResult.titleSimilarMatches,
      detectionTime: lastDetectionResult.detectionTime,
      percentageDuplicates: safeBookmarks.length > 0 
        ? Math.round((lastDetectionResult.totalDuplicates / safeBookmarks.length) * 100)
        : 0
    };
  }, [lastDetectionResult, safeBookmarks.length]);

  return {
    // Detection functions
    checkForDuplicates,
    checkUrlInRealTime,
    detectAllDuplicates,
    
    // Merge functions
    mergeDuplicates,
    mergeWithExisting,
    
    // Utility functions
    getSimilarityScore,
    getDefaultMergeOptions,
    updateDetectionOptions,
    
    // State
    detectionOptions,
    isDetecting,
    lastDetectionResult,
    duplicateStats
  };
};