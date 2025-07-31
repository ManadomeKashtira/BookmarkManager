export interface Bookmark {
  id: string;
  title: string;
  url: string;
  description?: string;
  favicon?: string; // Could be an emoji or a URL to an image
  category: string;
  tags: string[];
  isFavorite: boolean;
  dateAdded: Date;
  dateModified: Date;
  visits: number;
}

export interface Category {
  id: string;
  name: string;
  color: string; // Hex color string e.g., "#FF5733"
  count: number;
  parentId?: string; // For hierarchical structure
  level?: number; // Depth level (0 = root, 1 = first level, etc.)
  isExpanded?: boolean; // For collapsible tree view
  children?: Category[]; // Child categories
  fullPath?: string; // Full path like "Work/Projects/Web"
}

export interface BookmarkStats {
  total: number;
  favorites: number;
  categories: number;
  recentlyAdded: number;
  totalVisits: number;
  averageVisitsPerBookmark: number;
  mostVisitedCategory: string; // Name of the category
  topTags: { tag: string; count: number }[];
}

export interface ThemeSettings {
  primaryColor: string;    // Hex e.g. #3B82F6
  secondaryColor: string;  // Hex
  accentColor: string;     // Hex
  backgroundColor: string; // Hex
  cardStyle: 'glass' | 'solid' | 'minimal';
  borderRadius: 'small' | 'medium' | 'large'; // Maps to CSS --radius values or direct px
  animation: 'none' | 'subtle' | 'smooth' | 'bouncy';
  density: 'compact' | 'comfortable' | 'spacious';
}

export type SortOption =
  | 'dateAdded-desc'    // Newest first
  | 'dateAdded-asc'     // Oldest first
  | 'title-asc'         // A-Z
  | 'title-desc'        // Z-A
  | 'visits-desc'       // Most visited first
  | 'visits-asc'        // Least visited first
  | 'dateModified-desc' // Recently modified first
  | 'dateModified-asc'  // Oldest modified first
  | 'favorites-first'   // Favorites first, then by date
  | 'favorites-last';   // Non-favorites first, then by date

export interface AppSettings {
  theme: ThemeSettings;
  defaultView: 'grid' | 'list';
  defaultSort: SortOption;
  itemsPerPage: number; // For future pagination features
  showDescriptions: boolean;
  showVisitCount: boolean;
  autoBackup: boolean; // Placeholder for future feature
  confirmDelete: boolean;
}

export interface BackupMetadata {
  version: string;
  formatVersion: string;
  exportDate: string;
  exportTimestamp: number;
  appVersion: string;
  totalBookmarks: number;
  totalCategories: number;
  checksum: string;
  description?: string;
  hierarchicalStructure?: {
    totalFolders: number;
    rootFolders: number;
    nestedFolders: number;
    maxDepth: number;
    hasHierarchy: boolean;
  };
}

export interface CompleteBackupData {
  metadata: BackupMetadata;
  bookmarks: Bookmark[];
  categories: Category[];
  settings: AppSettings;
  userPreferences: {
    selectedCategory: string;
    searchQuery: string;
    viewMode: 'grid' | 'list';
    sortBy: SortOption;
  };
  statistics: {
    totalVisits: number;
    favoriteCount: number;
    lastBackupDate: string;
    hierarchicalInfo?: {
      totalFolders: number;
      rootFolders: number;
      nestedFolders: number;
      maxDepth: number;
    };
  };
}

export interface AnalyticsData {
  bookmarksAddedThisWeek: number;
  bookmarksAddedThisMonth: number;
  mostActiveDay: string; // e.g., "Monday"
  categoryDistribution: { category: string; count: number; percentage: number }[];
  visitTrends: { date: string; visits: number }[]; // date as YYYY-MM-DD
  topBookmarks: Bookmark[]; // Top 5 most visited
}

// For tailwindcss-animate plugin (if not already globally typed)
declare module 'tailwindcss/plugin' {
  interface TailwindPlugin {
    (options: any): void;
    handler: (options: any) => void;
    config?: any;
  }
}
