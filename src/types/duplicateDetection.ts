export interface DuplicateGroup {
  id: string;
  url: string;
  normalizedUrl: string;
  bookmarks: DuplicateBookmark[];
  similarity: number;
  duplicateType: 'exact' | 'normalized' | 'title-similar';
  detectedAt: Date;
}

export interface DuplicateBookmark {
  id: string;
  title: string;
  url: string;
  description?: string;
  category: string;
  tags: string[];
  isFavorite: boolean;
  dateAdded: Date;
  dateModified: Date;
  visits: number;
  favicon?: string;
}

export interface DuplicateDetectionResult {
  duplicateGroups: DuplicateGroup[];
  totalDuplicates: number;
  exactMatches: number;
  normalizedMatches: number;
  titleSimilarMatches: number;
  scannedBookmarks: number;
  detectionTime: number;
}

export interface DuplicateDetectionOptions {
  exactUrlMatching: boolean;
  normalizedUrlMatching: boolean;
  titleSimilarityMatching: boolean;
  titleSimilarityThreshold: number; // 0-1, higher means more strict
  ignoreQueryParams: boolean;
  ignoreProtocol: boolean;
  ignoreWww: boolean;
  ignoreTrailingSlash: boolean;
  caseSensitive: boolean;
}

export interface MergeOptions {
  keepTitle: 'first' | 'last' | 'longest' | 'custom';
  keepDescription: 'first' | 'last' | 'longest' | 'custom';
  keepCategory: 'first' | 'last' | 'custom';
  keepFavicon: 'first' | 'last' | 'custom';
  combineTags: boolean;
  keepFavoriteStatus: 'any' | 'all' | 'first' | 'last';
  keepVisits: 'sum' | 'max' | 'first' | 'last';
  keepDates: 'earliest' | 'latest' | 'first' | 'last';
  customTitle?: string;
  customDescription?: string;
  customCategory?: string;
  customFavicon?: string;
}

export interface SimilarityScore {
  exact: number;
  normalized: number;
  title: number;
  overall: number;
}

export interface UrlNormalizationResult {
  original: string;
  normalized: string;
  domain: string;
  path: string;
  queryParams: Record<string, string>;
  fragment: string;
}