import { Bookmark } from '../types/bookmark';
import {
  DuplicateGroup,
  DuplicateBookmark,
  DuplicateDetectionResult,
  DuplicateDetectionOptions,
  MergeOptions,
  SimilarityScore,
  UrlNormalizationResult
} from '../types/duplicateDetection';

export class DuplicateDetectorService {
  private defaultOptions: DuplicateDetectionOptions = {
    exactUrlMatching: true,
    normalizedUrlMatching: true,
    titleSimilarityMatching: true,
    titleSimilarityThreshold: 0.8,
    ignoreQueryParams: true,
    ignoreProtocol: true,
    ignoreWww: true,
    ignoreTrailingSlash: true,
    caseSensitive: false
  };

  /**
   * Find all duplicate groups in a collection of bookmarks
   */
  findDuplicates(
    bookmarks: Bookmark[],
    options?: Partial<DuplicateDetectionOptions>
  ): DuplicateDetectionResult {
    const startTime = Date.now();
    const opts = { ...this.defaultOptions, ...options };
    
    const duplicateGroups: DuplicateGroup[] = [];
    const processedBookmarks = new Set<string>();
    let exactMatches = 0;
    let normalizedMatches = 0;
    let titleSimilarMatches = 0;

    // Convert bookmarks to DuplicateBookmark format
    const duplicateBookmarks: DuplicateBookmark[] = bookmarks.map(this.convertToDuplicateBookmark);

    for (let i = 0; i < duplicateBookmarks.length; i++) {
      const currentBookmark = duplicateBookmarks[i];
      
      if (processedBookmarks.has(currentBookmark.id)) {
        continue;
      }

      const duplicates: DuplicateBookmark[] = [currentBookmark];
      let groupType: DuplicateGroup['duplicateType'] = 'exact';
      let maxSimilarity = 1.0;
      let hasExactMatch = false;
      let hasNormalizedMatch = false;
      let hasTitleMatch = false;

      // Find duplicates for current bookmark
      for (let j = i + 1; j < duplicateBookmarks.length; j++) {
        const compareBookmark = duplicateBookmarks[j];
        
        if (processedBookmarks.has(compareBookmark.id)) {
          continue;
        }

        const similarity = this.calculateSimilarity(currentBookmark, compareBookmark, opts);
        
        if (similarity.exact === 1.0 && opts.exactUrlMatching) {
          duplicates.push(compareBookmark);
          processedBookmarks.add(compareBookmark.id);
          hasExactMatch = true;
        } else if (similarity.normalized >= 0.95 && opts.normalizedUrlMatching) {
          duplicates.push(compareBookmark);
          processedBookmarks.add(compareBookmark.id);
          groupType = 'normalized';
          maxSimilarity = Math.max(maxSimilarity, similarity.normalized);
          hasNormalizedMatch = true;
        } else if (similarity.title >= opts.titleSimilarityThreshold && opts.titleSimilarityMatching) {
          duplicates.push(compareBookmark);
          processedBookmarks.add(compareBookmark.id);
          groupType = 'title-similar';
          maxSimilarity = Math.max(maxSimilarity, similarity.title);
          hasTitleMatch = true;
        }
      }

      // If we found duplicates, create a group
      if (duplicates.length > 1) {
        const normalizedUrl = this.normalizeUrl(currentBookmark.url, opts);
        
        const group: DuplicateGroup = {
          id: `dup-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          url: currentBookmark.url,
          normalizedUrl: normalizedUrl.normalized,
          bookmarks: duplicates,
          similarity: maxSimilarity,
          duplicateType: groupType,
          detectedAt: new Date()
        };

        duplicateGroups.push(group);
        
        // Increment counters based on group type
        if (hasExactMatch) exactMatches++;
        if (hasNormalizedMatch) normalizedMatches++;
        if (hasTitleMatch) titleSimilarMatches++;
        
        // Mark all bookmarks in this group as processed
        duplicates.forEach(bookmark => processedBookmarks.add(bookmark.id));
      } else {
        processedBookmarks.add(currentBookmark.id);
      }
    }

    const detectionTime = Date.now() - startTime;

    return {
      duplicateGroups,
      totalDuplicates: duplicateGroups.reduce((sum, group) => sum + group.bookmarks.length, 0),
      exactMatches,
      normalizedMatches,
      titleSimilarMatches,
      scannedBookmarks: bookmarks.length,
      detectionTime
    };
  }

  /**
   * Check if a new bookmark is a duplicate of existing bookmarks
   */
  checkForDuplicate(
    newBookmark: Bookmark,
    existingBookmarks: Bookmark[],
    options?: Partial<DuplicateDetectionOptions>
  ): DuplicateBookmark[] {
    const opts = { ...this.defaultOptions, ...options };
    const newDuplicateBookmark = this.convertToDuplicateBookmark(newBookmark);
    const duplicates: DuplicateBookmark[] = [];

    for (const existing of existingBookmarks) {
      const existingDuplicate = this.convertToDuplicateBookmark(existing);
      const similarity = this.calculateSimilarity(newDuplicateBookmark, existingDuplicate, opts);

      if (similarity.exact === 1.0 && opts.exactUrlMatching) {
        duplicates.push(existingDuplicate);
      } else if (similarity.normalized >= 0.95 && opts.normalizedUrlMatching) {
        duplicates.push(existingDuplicate);
      } else if (similarity.title >= opts.titleSimilarityThreshold && opts.titleSimilarityMatching) {
        duplicates.push(existingDuplicate);
      }
    }

    return duplicates;
  }

  /**
   * Merge duplicate bookmarks into a single bookmark
   */
  mergeDuplicates(duplicates: DuplicateBookmark[], options: MergeOptions): DuplicateBookmark {
    if (duplicates.length === 0) {
      throw new Error('Cannot merge empty array of duplicates');
    }

    if (duplicates.length === 1) {
      return duplicates[0];
    }

    // Sort by date added for consistent ordering
    const sortedDuplicates = [...duplicates].sort((a, b) => 
      new Date(a.dateAdded).getTime() - new Date(b.dateAdded).getTime()
    );

    const first = sortedDuplicates[0];
    const last = sortedDuplicates[sortedDuplicates.length - 1];

    // Merge title
    let mergedTitle: string;
    switch (options.keepTitle) {
      case 'first':
        mergedTitle = first.title;
        break;
      case 'last':
        mergedTitle = last.title;
        break;
      case 'longest':
        mergedTitle = sortedDuplicates.reduce((longest, current) => 
          current.title.length > longest.title.length ? current : longest
        ).title;
        break;
      case 'custom':
        mergedTitle = options.customTitle || first.title;
        break;
      default:
        mergedTitle = first.title;
    }

    // Merge description
    let mergedDescription: string | undefined;
    switch (options.keepDescription) {
      case 'first':
        mergedDescription = first.description;
        break;
      case 'last':
        mergedDescription = last.description;
        break;
      case 'longest':
        mergedDescription = sortedDuplicates.reduce((longest, current) => {
          const currentDesc = current.description || '';
          const longestDesc = longest.description || '';
          return currentDesc.length > longestDesc.length ? current : longest;
        }).description;
        break;
      case 'custom':
        mergedDescription = options.customDescription || first.description;
        break;
      default:
        mergedDescription = first.description;
    }

    // Merge category
    let mergedCategory: string;
    switch (options.keepCategory) {
      case 'first':
        mergedCategory = first.category;
        break;
      case 'last':
        mergedCategory = last.category;
        break;
      case 'custom':
        mergedCategory = options.customCategory || first.category;
        break;
      default:
        mergedCategory = first.category;
    }

    // Merge favicon
    let mergedFavicon: string | undefined;
    switch (options.keepFavicon) {
      case 'first':
        mergedFavicon = first.favicon;
        break;
      case 'last':
        mergedFavicon = last.favicon;
        break;
      case 'custom':
        mergedFavicon = options.customFavicon || first.favicon;
        break;
      default:
        mergedFavicon = first.favicon;
    }

    // Merge tags
    let mergedTags: string[];
    if (options.combineTags) {
      const allTags = new Set<string>();
      sortedDuplicates.forEach(bookmark => {
        bookmark.tags.forEach(tag => allTags.add(tag));
      });
      mergedTags = Array.from(allTags).sort();
    } else {
      mergedTags = first.tags;
    }

    // Merge favorite status
    let mergedIsFavorite: boolean;
    switch (options.keepFavoriteStatus) {
      case 'any':
        mergedIsFavorite = sortedDuplicates.some(bookmark => bookmark.isFavorite);
        break;
      case 'all':
        mergedIsFavorite = sortedDuplicates.every(bookmark => bookmark.isFavorite);
        break;
      case 'first':
        mergedIsFavorite = first.isFavorite;
        break;
      case 'last':
        mergedIsFavorite = last.isFavorite;
        break;
      default:
        mergedIsFavorite = first.isFavorite;
    }

    // Merge visits
    let mergedVisits: number;
    switch (options.keepVisits) {
      case 'sum':
        mergedVisits = sortedDuplicates.reduce((sum, bookmark) => sum + bookmark.visits, 0);
        break;
      case 'max':
        mergedVisits = Math.max(...sortedDuplicates.map(bookmark => bookmark.visits));
        break;
      case 'first':
        mergedVisits = first.visits;
        break;
      case 'last':
        mergedVisits = last.visits;
        break;
      default:
        mergedVisits = sortedDuplicates.reduce((sum, bookmark) => sum + bookmark.visits, 0);
    }

    // Merge dates
    let mergedDateAdded: Date;
    let mergedDateModified: Date;
    
    switch (options.keepDates) {
      case 'earliest':
        mergedDateAdded = new Date(Math.min(...sortedDuplicates.map(b => new Date(b.dateAdded).getTime())));
        mergedDateModified = new Date(Math.min(...sortedDuplicates.map(b => new Date(b.dateModified).getTime())));
        break;
      case 'latest':
        mergedDateAdded = new Date(Math.max(...sortedDuplicates.map(b => new Date(b.dateAdded).getTime())));
        mergedDateModified = new Date(Math.max(...sortedDuplicates.map(b => new Date(b.dateModified).getTime())));
        break;
      case 'first':
        mergedDateAdded = first.dateAdded;
        mergedDateModified = first.dateModified;
        break;
      case 'last':
        mergedDateAdded = last.dateAdded;
        mergedDateModified = last.dateModified;
        break;
      default:
        mergedDateAdded = first.dateAdded;
        mergedDateModified = new Date(); // Update modified date to now
    }

    return {
      id: first.id, // Keep the first bookmark's ID
      title: mergedTitle,
      url: first.url, // Always keep the first URL as the canonical one
      description: mergedDescription,
      category: mergedCategory,
      tags: mergedTags,
      isFavorite: mergedIsFavorite,
      dateAdded: mergedDateAdded,
      dateModified: mergedDateModified,
      visits: mergedVisits,
      favicon: mergedFavicon
    };
  }

  /**
   * Calculate similarity between two bookmarks
   */
  private calculateSimilarity(
    bookmark1: DuplicateBookmark,
    bookmark2: DuplicateBookmark,
    options: DuplicateDetectionOptions
  ): SimilarityScore {
    // Exact URL match
    const exactMatch = bookmark1.url === bookmark2.url ? 1.0 : 0.0;

    // Normalized URL match
    const norm1 = this.normalizeUrl(bookmark1.url, options);
    const norm2 = this.normalizeUrl(bookmark2.url, options);
    const normalizedMatch = norm1.normalized === norm2.normalized ? 1.0 : 0.0;

    // Title similarity using Levenshtein distance
    const titleSimilarity = this.calculateStringSimilarity(
      options.caseSensitive ? bookmark1.title : bookmark1.title.toLowerCase(),
      options.caseSensitive ? bookmark2.title : bookmark2.title.toLowerCase()
    );

    // Overall similarity (weighted average)
    const overall = (exactMatch * 0.5) + (normalizedMatch * 0.3) + (titleSimilarity * 0.2);

    return {
      exact: exactMatch,
      normalized: normalizedMatch,
      title: titleSimilarity,
      overall
    };
  }

  /**
   * Normalize a URL for comparison
   */
  private normalizeUrl(url: string, options: DuplicateDetectionOptions): UrlNormalizationResult {
    try {
      const urlObj = new URL(url);
      
      let normalized = url;
      
      // Remove protocol if specified
      if (options.ignoreProtocol) {
        normalized = normalized.replace(/^https?:\/\//, '//');
      }
      
      // Remove www if specified
      if (options.ignoreWww) {
        normalized = normalized.replace(/\/\/(www\.)?/, '//');
      }
      
      // Remove trailing slash if specified
      if (options.ignoreTrailingSlash) {
        normalized = normalized.replace(/\/$/, '');
      }
      
      // Remove query parameters if specified
      if (options.ignoreQueryParams) {
        const baseUrl = normalized.split('?')[0];
        normalized = baseUrl;
      }
      
      // Remove fragment
      normalized = normalized.split('#')[0];
      
      // Convert to lowercase for case-insensitive comparison
      if (!options.caseSensitive) {
        normalized = normalized.toLowerCase();
      }

      return {
        original: url,
        normalized,
        domain: urlObj.hostname,
        path: urlObj.pathname,
        queryParams: Object.fromEntries(urlObj.searchParams.entries()),
        fragment: urlObj.hash
      };
    } catch (error) {
      // If URL parsing fails, return as-is
      return {
        original: url,
        normalized: url,
        domain: '',
        path: '',
        queryParams: {},
        fragment: ''
      };
    }
  }

  /**
   * Calculate string similarity using Levenshtein distance
   */
  private calculateStringSimilarity(str1: string, str2: string): number {
    if (str1 === str2) return 1.0;
    if (str1.length === 0 || str2.length === 0) return 0.0;

    const matrix: number[][] = [];
    
    // Initialize matrix
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    // Fill matrix
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }
    
    const maxLength = Math.max(str1.length, str2.length);
    const distance = matrix[str2.length][str1.length];
    
    return (maxLength - distance) / maxLength;
  }

  /**
   * Convert Bookmark to DuplicateBookmark
   */
  private convertToDuplicateBookmark(bookmark: Bookmark): DuplicateBookmark {
    return {
      id: bookmark.id,
      title: bookmark.title,
      url: bookmark.url,
      description: bookmark.description,
      category: bookmark.category,
      tags: bookmark.tags,
      isFavorite: bookmark.isFavorite,
      dateAdded: bookmark.dateAdded,
      dateModified: bookmark.dateModified,
      visits: bookmark.visits,
      favicon: bookmark.favicon
    };
  }

  /**
   * Get default merge options
   */
  getDefaultMergeOptions(): MergeOptions {
    return {
      keepTitle: 'longest',
      keepDescription: 'longest',
      keepCategory: 'first',
      keepFavicon: 'first',
      combineTags: true,
      keepFavoriteStatus: 'any',
      keepVisits: 'sum',
      keepDates: 'earliest'
    };
  }

  /**
   * Get default detection options
   */
  getDefaultDetectionOptions(): DuplicateDetectionOptions {
    return { ...this.defaultOptions };
  }
}

// Export a default instance
export const duplicateDetectorService = new DuplicateDetectorService();