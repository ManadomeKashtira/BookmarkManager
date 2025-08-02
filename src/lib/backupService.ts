import type { Bookmark, Category, AppSettings, CompleteBackupData, BackupMetadata, SortOption, Memo } from '@/types/bookmark';

const BACKUP_FORMAT_VERSION = '1.0.0';
const APP_VERSION = '1.0.0';

/**
 * Generate a simple checksum for data integrity verification
 */
function generateChecksum(data: string): string {
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16);
}

/**
 * Create a complete backup of all application data
 */
export function createCompleteBackup(
  bookmarks: Bookmark[],
  categories: Category[],
  settings: AppSettings,
  userPreferences: {
    selectedCategory: string;
    searchQuery: string;
    viewMode: 'grid' | 'list';
    sortBy: SortOption;
  },
  memos?: Memo[]
): CompleteBackupData {
  const exportDate = new Date().toISOString();
  const exportTimestamp = Date.now();
  
  // Calculate statistics
  const totalVisits = bookmarks.reduce((sum, bookmark) => sum + (bookmark.visits || 0), 0);
  const favoriteCount = bookmarks.filter(bookmark => bookmark.isFavorite).length;
  const memoCount = memos?.length || 0;
  const favoriteMemos = memos?.filter(memo => memo.isFavorite).length || 0;

  // Calculate hierarchical folder statistics
  const hierarchicalCategories = categories.filter(cat => cat.fullPath && cat.fullPath.includes('/'));
  const rootCategories = categories.filter(cat => !cat.parentId && (!cat.fullPath || !cat.fullPath.includes('/')));
  const maxDepth = Math.max(0, ...categories.map(cat => cat.level || 0));
  
  // Prepare data for checksum (excluding metadata)
  const dataForChecksum = JSON.stringify({
    bookmarks,
    categories,
    settings,
    userPreferences,
    memos
  });
  
  const metadata: BackupMetadata = {
    version: BACKUP_FORMAT_VERSION,
    formatVersion: BACKUP_FORMAT_VERSION,
    exportDate,
    exportTimestamp,
    appVersion: APP_VERSION,
    totalBookmarks: bookmarks.length,
    totalCategories: categories.length,
    totalMemos: memoCount,
    checksum: generateChecksum(dataForChecksum),
    description: `Complete backup with hierarchical folders and memos created on ${new Date(exportDate).toLocaleString()}`,
    hierarchicalStructure: {
      totalFolders: categories.length,
      rootFolders: rootCategories.length,
      nestedFolders: hierarchicalCategories.length,
      maxDepth: maxDepth,
      hasHierarchy: hierarchicalCategories.length > 0
    }
  };

  const backupData: CompleteBackupData = {
    metadata,
    bookmarks: bookmarks.map(bookmark => ({
      ...bookmark,
      dateAdded: bookmark.dateAdded instanceof Date ? bookmark.dateAdded.toISOString() : bookmark.dateAdded,
      dateModified: bookmark.dateModified instanceof Date ? bookmark.dateModified.toISOString() : bookmark.dateModified,
    })) as any,
    categories: categories.map(category => ({
      ...category,
      // Ensure all hierarchical properties are preserved
      parentId: category.parentId || undefined,
      level: category.level || 0,
      isExpanded: category.isExpanded !== undefined ? category.isExpanded : true,
      children: category.children || [],
      fullPath: category.fullPath || category.name
    })),
    memos: memos?.map(memo => ({
      ...memo,
      createdAt: memo.createdAt instanceof Date ? memo.createdAt.toISOString() : memo.createdAt,
      updatedAt: memo.updatedAt instanceof Date ? memo.updatedAt.toISOString() : memo.updatedAt,
    })) as any || [],
    settings,
    userPreferences,
    statistics: {
      totalVisits,
      favoriteCount,
      favoriteMemos,
      lastBackupDate: exportDate,
      hierarchicalInfo: {
        totalFolders: categories.length,
        rootFolders: rootCategories.length,
        nestedFolders: hierarchicalCategories.length,
        maxDepth: maxDepth
      }
    }
  };

  return backupData;
}

/**
 * Export backup data as .bk file
 */
export function exportBackupFile(backupData: CompleteBackupData, filename?: string): void {
  const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  const time = new Date().toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-MM-SS format
  const defaultFilename = `BookmarkManager_Backup_${timestamp}_${time}.bk`;
  const finalFilename = filename || defaultFilename;

  // Add final validation before export
  if (!backupData.bookmarks || !Array.isArray(backupData.bookmarks)) {
    throw new Error('Invalid bookmarks data for backup');
  }

  if (!backupData.categories || !Array.isArray(backupData.categories)) {
    throw new Error('Invalid categories data for backup');
  }

  const jsonContent = JSON.stringify(backupData, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json' });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = finalFilename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  console.log(`Backup exported: ${finalFilename} (${backupData.bookmarks.length} bookmarks, ${backupData.categories.length} categories)`);
}

/**
 * Validate backup file format and integrity
 */
export function validateBackupFile(backupData: any): { isValid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check if it's a valid backup file structure
  if (!backupData || typeof backupData !== 'object') {
    errors.push('Invalid backup file format');
    return { isValid: false, errors, warnings };
  }

  // Check required fields
  if (!backupData.metadata) {
    errors.push('Missing backup metadata');
  } else {
    if (!backupData.metadata.version) {
      errors.push('Missing backup version information');
    }
    if (!backupData.metadata.checksum) {
      warnings.push('No integrity checksum found');
    }
  }

  if (!Array.isArray(backupData.bookmarks)) {
    errors.push('Invalid bookmarks data');
  }

  if (!Array.isArray(backupData.categories)) {
    errors.push('Invalid categories data');
  }

  if (!backupData.settings || typeof backupData.settings !== 'object') {
    errors.push('Invalid settings data');
  }

  // Verify checksum if present
  if (backupData.metadata?.checksum) {
    const dataForChecksum = JSON.stringify({
      bookmarks: backupData.bookmarks,
      categories: backupData.categories,
      settings: backupData.settings,
      userPreferences: backupData.userPreferences
    });
    const calculatedChecksum = generateChecksum(dataForChecksum);
    
    if (calculatedChecksum !== backupData.metadata.checksum) {
      warnings.push('Backup file integrity check failed - data may be corrupted');
    }
  }

  // Version compatibility check
  if (backupData.metadata?.formatVersion) {
    const backupVersion = backupData.metadata.formatVersion;
    if (backupVersion !== BACKUP_FORMAT_VERSION) {
      warnings.push(`Backup was created with format version ${backupVersion}, current version is ${BACKUP_FORMAT_VERSION}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Parse and restore backup data
 */
export function parseBackupFile(fileContent: string): {
  success: boolean;
  data?: CompleteBackupData;
  errors: string[];
  warnings: string[];
} {
  try {
    const backupData = JSON.parse(fileContent);
    const validation = validateBackupFile(backupData);
    
    if (!validation.isValid) {
      return {
        success: false,
        errors: validation.errors,
        warnings: validation.warnings
      };
    }

    // Convert date strings back to Date objects
    const processedBookmarks = backupData.bookmarks.map((bookmark: any) => ({
      ...bookmark,
      dateAdded: new Date(bookmark.dateAdded),
      dateModified: new Date(bookmark.dateModified),
    }));

    const processedMemos = backupData.memos?.map((memo: any) => ({
      ...memo,
      createdAt: new Date(memo.createdAt),
      updatedAt: new Date(memo.updatedAt),
    })) || [];

    const processedData: CompleteBackupData = {
      ...backupData,
      bookmarks: processedBookmarks,
      memos: processedMemos
    };

    return {
      success: true,
      data: processedData,
      errors: validation.errors,
      warnings: validation.warnings
    };
  } catch (error) {
    return {
      success: false,
      errors: [`Failed to parse backup file: ${error instanceof Error ? error.message : 'Unknown error'}`],
      warnings: []
    };
  }
}
