
import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Bookmark, Category, BookmarkStats, SortOption, CompleteBackupData } from '@/types/bookmark';
import { defaultFaviconName } from '@/lib/icons';
import {
  buildCategoryTree,
  flattenCategoryTree,
  toggleCategoryExpansion,
  getVisibleCategories,
  ensureParentCategories
} from '@/lib/categoryTreeUtils';
import { healthCheckService } from '@/services/healthCheckService';

// Sample data for demonstration if localStorage is empty
const sampleBookmarks: Bookmark[] = [
  { id: '1', title: 'Youtube', url: 'https://youtube.com', description: 'video sharing platform.', favicon: 'Bookmark', category: 'Development', tags: ['YT', 'entertaiment'], isFavorite: true, dateAdded: new Date('2024-07-15T10:00:00Z'), dateModified: new Date('2024-07-15T10:00:00Z'), visits: 25 },
  { id: '2', title: 'Discord', url: 'https://discord.com/', description: 'Discord is a free voice and text chat client for gamers.', favicon: 'Palette', category: 'Development', tags: ['discord', 'MSG'], isFavorite: true, dateAdded: new Date('2024-07-10T11:00:00Z'), dateModified: new Date('2024-07-10T11:00:00Z'), visits: 18 },
  { id: '3', title: 'Gmail', url: 'https://mail.google.com/mail/u/0/#inbox', description: 'Mail_services', favicon: 'Globe', category: 'Development', tags: ['gmail', 'messages'], isFavorite: false, dateAdded: new Date('2024-07-08T12:00:00Z'), dateModified: new Date('2024-07-08T12:00:00Z'), visits: 12 },
  { id: '4', title: 'ChatGpt', url: 'https://chatgpt.com/', description: 'Chatgpt', favicon: 'Star', category: 'Design', tags: ['bot', 'Chatbot'], isFavorite: true, dateAdded: new Date('2024-07-05T09:00:00Z'), dateModified: new Date('2024-07-05T09:00:00Z'), visits: 30 },
  { id: '5', title: 'MDN Web Docs', url: 'https://developer.mozilla.org', description: 'Resources for developers, by developers.', favicon: 'FileText', category: 'Learning', tags: ['html', 'css', 'js', 'web'], isFavorite: false, dateAdded: new Date('2024-07-01T14:00:00Z'), dateModified: new Date('2024-07-01T14:00:00Z'), visits: 40 },
];

const defaultCategoriesArray: Category[] = [
  { id: 'cat1', name: 'Development', color: '#3B82F6', count: 0, isExpanded: true },
  { id: 'cat2', name: 'Design', color: '#8B5CF6', count: 0, isExpanded: true },
  { id: 'cat3', name: 'Reading', color: '#F59E0B', count: 0, isExpanded: true },
  { id: 'cat4', name: 'Tools', color: '#10B981', count: 0, isExpanded: true },
  { id: 'cat5', name: 'Learning', color: '#EF4444', count: 0, isExpanded: true },
  { id: 'cat6', name: 'Personal', color: '#EC4899', count: 0, isExpanded: true},
  { id: 'cat7', name: 'Work', color: '#6366F1', count: 0, isExpanded: true},
  { id: 'cat8', name: 'Imported', color: '#78716C', count: 0, isExpanded: true},
  { id: 'cat9', name: 'Uncategorized', color: '#A1A1AA', count: 0, isExpanded: true}, // Added Uncategorized
];

const BOOKMARKS_STORAGE_KEY = 'bookmarkManagerData_v3_lucideFavicons';

export const useBookmarks = () => {
  const [rawBookmarks, setRawBookmarks] = useState<Bookmark[]>([]);
  const [categories, setCategories] = useState<Category[]>(defaultCategoriesArray);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('dateAdded-desc');
  const [healthFilter, setHealthFilter] = useState<'all' | 'healthy' | 'broken' | 'warning'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  // Tree view state
  const categoryTree = useMemo(() => buildCategoryTree(categories), [categories]);
  const visibleCategories = useMemo(() => getVisibleCategories(categoryTree), [categoryTree]);

  useEffect(() => {
    console.log("Attempting to load bookmarks from localStorage...");
    try {
      const savedData = localStorage.getItem(BOOKMARKS_STORAGE_KEY);
      if (savedData) {
        const parsedBookmarks = JSON.parse(savedData).map((b: any) => ({
          ...b,
          dateAdded: new Date(b.dateAdded),
          dateModified: new Date(b.dateModified),
          favicon: b.favicon || defaultFaviconName,
          category: b.category || 'Uncategorized', // Ensure category exists
        }));
        setRawBookmarks(parsedBookmarks);
        console.log(`Loaded ${parsedBookmarks.length} bookmarks from localStorage.`);
      } else {
        setRawBookmarks(sampleBookmarks.map(b => ({...b, favicon: b.favicon || defaultFaviconName, category: b.category || 'Uncategorized' })));
        console.log("No data in localStorage, initialized with sample bookmarks.");
      }
    } catch (error) {
      console.error('Failed to parse bookmarks from localStorage, using sample data:', error);
      setRawBookmarks(sampleBookmarks.map(b => ({...b, favicon: b.favicon || defaultFaviconName, category: b.category || 'Uncategorized' })));
    }
    setIsLoading(false);
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (isInitialized && !isLoading) {
      console.log("SAVING to localStorage (key: "+BOOKMARKS_STORAGE_KEY+"):", rawBookmarks.length, "bookmarks");
      localStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(rawBookmarks));
    }
  }, [rawBookmarks, isLoading, isInitialized]);

  useEffect(() => {
    // This effect updates the categories list based on existing bookmarks
    // It ensures all categories present in bookmarks are in the `categories` state,
    // and updates counts.
    console.log("Updating categories based on raw bookmarks...");
    setCategories(prevCategories => {
      const existingCategoriesMap = new Map<string, Category>();
      // Preserve existing categories and their colors, but reset counts temporarily
      prevCategories.forEach(cat => existingCategoriesMap.set(cat.name, { ...cat, count: 0 })); 

      // Calculate counts based on current rawBookmarks
      const bookmarkCategoryCounts = rawBookmarks.reduce((acc, bookmark) => {
        const catName = bookmark.category || 'Uncategorized';
        acc[catName] = (acc[catName] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Add new categories from bookmarks if not already present
      Object.keys(bookmarkCategoryCounts).forEach(bCatName => {
        if (!existingCategoriesMap.has(bCatName)) {
          existingCategoriesMap.set(bCatName, {
            id: `cat-${bCatName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
            name: bCatName,
            color: defaultCategoriesArray[existingCategoriesMap.size % defaultCategoriesArray.length]?.color || '#A1A1AA', // Assign a default color
            count: 0,
            isExpanded: bCatName.split('/').length === 1, // Root categories expanded by default
          });
        }
      });

      // Update counts for all categories
      const updatedCategoriesList = Array.from(existingCategoriesMap.values()).map(cat => ({
        ...cat,
        count: bookmarkCategoryCounts[cat.name] || 0,
      })).sort((a, b) => a.name.localeCompare(b.name));

      // Only update state if the categories list has actually changed
      // Simple stringify for comparison, might need deep comparison for more complex objects
      const sortedPrevCategories = [...prevCategories].sort((a,b) => a.name.localeCompare(b.name));
      // Comparing stringified versions can be fragile. A more robust check might involve comparing
      // each category's name, id, color, and count. For now, we'll update if counts change or new categories appear.
      // A simple length check and sorting + stringify might catch most changes.
      // If performance is an issue with many categories, a deeper check might be needed.

      return updatedCategoriesList;
    });
  }, [rawBookmarks]); // Only depend on rawBookmarks

  const filteredAndSortedBookmarks = useMemo(() => {
    let filtered = [...rawBookmarks];

    if (selectedCategory !== 'All') {
      if (selectedCategory === 'Favorites') {
        filtered = filtered.filter(bookmark => bookmark.isFavorite);
      } else if (selectedCategory === 'Recent') {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        filtered = filtered.filter(bookmark => new Date(bookmark.dateAdded) >= oneWeekAgo);
      } else {
        filtered = filtered.filter(bookmark => (bookmark.category || 'Uncategorized') === selectedCategory);
      }
    }

    if (searchQuery) {
      const lowerSearchQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(bookmark =>
        bookmark.title.toLowerCase().includes(lowerSearchQuery) ||
        (bookmark.description && bookmark.description.toLowerCase().includes(lowerSearchQuery)) ||
        bookmark.tags.some(tag => tag.toLowerCase().includes(lowerSearchQuery))
      );
    }

    // Health status filtering
    if (healthFilter !== 'all') {
      filtered = filtered.filter(bookmark => {
        const healthStatus = healthCheckService.getHealthStatus(bookmark.id);
        if (!healthStatus) return healthFilter === 'unknown';
        return healthStatus.status === healthFilter;
      });
    }

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'title-asc':
          return a.title.localeCompare(b.title);
        case 'title-desc':
          return b.title.localeCompare(a.title);
        case 'visits-desc':
          return (b.visits || 0) - (a.visits || 0);
        case 'visits-asc':
          return (a.visits || 0) - (b.visits || 0);
        case 'dateAdded-asc':
          return new Date(a.dateAdded).getTime() - new Date(b.dateAdded).getTime();
        case 'dateModified-desc':
          return new Date(b.dateModified).getTime() - new Date(a.dateModified).getTime();
        case 'dateModified-asc':
          return new Date(a.dateModified).getTime() - new Date(b.dateModified).getTime();
        case 'favorites-first':
          if (a.isFavorite && !b.isFavorite) return -1;
          if (!a.isFavorite && b.isFavorite) return 1;
          // If both are favorites or both are not, sort by date added (newest first)
          return new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime();
        case 'favorites-last':
          if (a.isFavorite && !b.isFavorite) return 1;
          if (!a.isFavorite && b.isFavorite) return -1;
          // If both are favorites or both are not, sort by date added (newest first)
          return new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime();
        case 'dateAdded-desc':
        default:
          return new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime();
      }
    });
  }, [rawBookmarks, selectedCategory, searchQuery, sortBy, healthFilter]);

  const stats: BookmarkStats = useMemo(() => {
    const totalVisits = rawBookmarks.reduce((sum, b) => sum + (b.visits || 0), 0);
    const recentlyAddedCount = rawBookmarks.filter(b => {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        return new Date(b.dateAdded) >= oneWeekAgo;
    }).length;

    return {
      total: rawBookmarks.length,
      favorites: rawBookmarks.filter(b => b.isFavorite).length,
      categories: categories.filter(c => c.count > 0).length, // Count only categories with bookmarks
      recentlyAdded: recentlyAddedCount,
      totalVisits,
      averageVisitsPerBookmark: rawBookmarks.length > 0 ? Math.round(totalVisits / rawBookmarks.length) : 0,
      mostVisitedCategory: '', // This would require more complex calculation based on visits per category
      topTags: [] // This would require tag aggregation
    };
  }, [rawBookmarks, categories]);

  const addBookmark = useCallback((bookmarkData: Omit<Bookmark, 'id' | 'dateAdded' | 'dateModified' | 'visits'>) => {
    const newBookmark: Bookmark = {
      ...bookmarkData,
      id: `bookmark-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      dateAdded: new Date(),
      dateModified: new Date(),
      visits: 0,
      favicon: bookmarkData.favicon || defaultFaviconName,
      category: bookmarkData.category || 'Uncategorized',
    };
    setRawBookmarks(prev => [newBookmark, ...prev]);
  }, []);

  const addCategory = useCallback((categoryName: string) => {
    const trimmedCategoryName = categoryName.trim();
    if (!trimmedCategoryName) return;

    setCategories(prev => {
      if (prev.some(cat => cat.name === trimmedCategoryName)) {
        return prev; // Category already exists
      }
      const newCategory: Category = {
        id: `cat-${trimmedCategoryName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`, // Unique ID
        name: trimmedCategoryName,
        color: defaultCategoriesArray[prev.length % defaultCategoriesArray.length]?.color || '#A1A1AA', // Assign a default color
        count: 0, // Start with 0 count
        isExpanded: trimmedCategoryName.split('/').length === 1, // Root categories expanded by default
      };
      return [...prev, newCategory].sort((a, b) => a.name.localeCompare(b.name)); // Add and re-sort
    });
  }, [defaultCategoriesArray]);

  const importBookmarks = useCallback((newBookmarks: Bookmark[]) => {
     const processedNewBookmarks = newBookmarks.map((b, index) => ({
        ...b,
        id: b.id || `imported-${Date.now()}-${index}`,
        dateAdded: b.dateAdded ? new Date(b.dateAdded) : new Date(),
        dateModified: new Date(),
        visits: Number(b.visits) || 0,
        favicon: b.favicon || defaultFaviconName,
        tags: Array.isArray(b.tags) ? b.tags : [],
        isFavorite: !!b.isFavorite,
        category: b.category || 'Imported'
    }));
    setRawBookmarks(prev => {
        const existingUrls = new Set(prev.map(bm => bm.url));
        const trulyNew = processedNewBookmarks.filter(nbm => !existingUrls.has(nbm.url));
        return [...trulyNew, ...prev];
    });
  }, []);

  const updateBookmark = useCallback((id: string, updates: Partial<Omit<Bookmark, 'id' | 'dateAdded'>>) => {
    setRawBookmarks(prev => prev.map(bookmark =>
      bookmark.id === id
        ? { ...bookmark, ...updates, dateModified: new Date(), favicon: updates.favicon || bookmark.favicon || defaultFaviconName, category: updates.category || bookmark.category || 'Uncategorized' }
        : bookmark
    ));
  }, []);

  const deleteBookmark = useCallback((id: string) => {
    console.log(`Attempting to delete bookmark with id: ${id}`);
    setRawBookmarks(prev => {
      const newList = prev.filter(bookmark => bookmark.id !== id);
      console.log(`Bookmarks remaining after filter (before save): ${newList.length} (was ${prev.length})`);
      return newList;
    });
  }, []);

  const deleteAllBookmarks = useCallback(() => {
    console.log("Attempting to delete all bookmarks and clear localStorage.");
    setRawBookmarks([]);
    localStorage.removeItem(BOOKMARKS_STORAGE_KEY); // Explicitly clear storage
    setSelectedCategory('All'); 
    console.log("All bookmarks deleted and localStorage cleared.");
  }, [setSelectedCategory]);

  const toggleFavorite = useCallback((id: string) => {
    setRawBookmarks(prev => prev.map(b =>
      b.id === id ? { ...b, isFavorite: !b.isFavorite, dateModified: new Date() } : b
    ));
  }, []);

  const incrementVisitCount = useCallback((id: string) => {
    setRawBookmarks(prev => prev.map(b =>
      b.id === id ? { ...b, visits: (b.visits || 0) + 1, dateModified: new Date() } : b
    ));
  }, []);

  const updateBookmarkCategory = useCallback((bookmarkId: string, newCategoryName: string) => {
    setRawBookmarks(prev => prev.map(b =>
      b.id === bookmarkId ? { ...b, category: newCategoryName || 'Uncategorized', dateModified: new Date() } : b
    ));
  }, []);

  const deleteBookmarksByCategory = useCallback((categoryName: string) => {
    setRawBookmarks(prev => prev.filter(b => (b.category || 'Uncategorized') !== categoryName));
    if (selectedCategory === categoryName) {
      setSelectedCategory('All');
    }
  }, [selectedCategory, setSelectedCategory]);

  const renameCategory = useCallback((oldCategoryName: string, newCategoryName: string) => {
    const trimmedNewName = newCategoryName.trim();
    if (!trimmedNewName || oldCategoryName === trimmedNewName) return;

    // Check if new name already exists
    setCategories(prev => {
      if (prev.some(cat => cat.name === trimmedNewName && cat.name !== oldCategoryName)) {
        return prev; // New name already exists, don't rename
      }

      // Update categories list - handle both the renamed category and its children
      const updated = prev.map(cat => {
        if (cat.name === oldCategoryName) {
          // Rename the category itself
          return { ...cat, name: trimmedNewName };
        } else if (cat.name.startsWith(oldCategoryName + '/')) {
          // Update child categories to reflect the new parent path
          const childPath = cat.name.substring(oldCategoryName.length + 1);
          return { ...cat, name: `${trimmedNewName}/${childPath}` };
        }
        return cat;
      });

      return updated;
    });

    // Update all bookmarks with the old category name and its children
    setRawBookmarks(prev => prev.map(bookmark => {
      const bookmarkCategory = bookmark.category || 'Uncategorized';
      if (bookmarkCategory === oldCategoryName) {
        // Direct category match
        return { ...bookmark, category: trimmedNewName, dateModified: new Date() };
      } else if (bookmarkCategory.startsWith(oldCategoryName + '/')) {
        // Child category match
        const childPath = bookmarkCategory.substring(oldCategoryName.length + 1);
        return { ...bookmark, category: `${trimmedNewName}/${childPath}`, dateModified: new Date() };
      }
      return bookmark;
    }));

    // Update selected category if it was the renamed one or a child
    if (selectedCategory === oldCategoryName) {
      setSelectedCategory(trimmedNewName);
    } else if (selectedCategory && selectedCategory.startsWith(oldCategoryName + '/')) {
      const childPath = selectedCategory.substring(oldCategoryName.length + 1);
      setSelectedCategory(`${trimmedNewName}/${childPath}`);
    }
  }, [selectedCategory, setSelectedCategory]);

  const deleteCategory = useCallback((categoryName: string) => {
    // Delete all bookmarks in this category
    setRawBookmarks(prev => prev.filter(b => (b.category || 'Uncategorized') !== categoryName));

    // Remove the category from the categories list
    setCategories(prev => prev.filter(cat => cat.name !== categoryName));

    // If this was the selected category, switch to 'All'
    if (selectedCategory === categoryName) {
      setSelectedCategory('All');
    }
  }, [selectedCategory, setSelectedCategory]);

  const updateCategoryIcon = useCallback((categoryPath: string, iconName: string) => {
    setCategories(prev => prev.map(cat => {
      if (cat.name === categoryPath || cat.fullPath === categoryPath) {
        return { ...cat, icon: iconName };
      }
      return cat;
    }));
  }, []);

  const restoreCompleteBackup = useCallback((backupData: CompleteBackupData) => {
    console.log('Restoring complete backup:', backupData.metadata);

    // Restore bookmarks
    setRawBookmarks(backupData.bookmarks);

    // Restore categories
    setCategories(backupData.categories);

    // Restore user preferences
    setSelectedCategory(backupData.userPreferences.selectedCategory);
    setSearchQuery(backupData.userPreferences.searchQuery);
    setViewMode(backupData.userPreferences.viewMode);
    setSortBy(backupData.userPreferences.sortBy);

    console.log(`Restored ${backupData.bookmarks.length} bookmarks and ${backupData.categories.length} categories`);
  }, []);

  // Tree-related functions
  const toggleCategoryExpansionState = useCallback((categoryPath: string) => {
    setCategories(prev => {
      return prev.map(cat => {
        if (cat.name === categoryPath || cat.fullPath === categoryPath) {
          return {
            ...cat,
            isExpanded: !cat.isExpanded
          };
        }
        return cat;
      });
    });
  }, []);

  const addCategoryWithPath = useCallback((categoryPath: string, options?: { autoRename?: boolean }) => {
    const trimmedPath = categoryPath.trim();
    if (!trimmedPath) return null;

    let newCategoryId: string | null = null;

    setCategories(prev => {
      // Ensure all parent categories exist
      const withParents = ensureParentCategories(prev, trimmedPath);

      // Check if the exact category already exists
      if (withParents.some(cat => cat.name === trimmedPath)) {
        return withParents;
      }

      // Add the new category
      newCategoryId = `cat-${trimmedPath.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}`;
      const newCategory: Category = {
        id: newCategoryId,
        name: trimmedPath,
        color: defaultCategoriesArray[withParents.length % defaultCategoriesArray.length]?.color || '#A1A1AA',
        count: 0,
        fullPath: trimmedPath,
        level: trimmedPath.split('/').length - 1,
        isExpanded: trimmedPath.split('/').length === 1, // Root categories expanded by default
        children: []
      };

      return [...withParents, newCategory];
    });

    // Return the new category info for auto-rename functionality
    return {
      id: newCategoryId,
      path: trimmedPath,
      autoRename: options?.autoRename || false
    };
  }, []);


  return {
    bookmarks: filteredAndSortedBookmarks,
    allBookmarks: rawBookmarks,
    categories,
    categoryTree,
    visibleCategories,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    viewMode,
    setViewMode,
    sortBy,
    setSortBy,
    healthFilter,
    setHealthFilter,
    isLoading,
    stats,
    addBookmark,
    addCategory, // Export the new function
    addCategoryWithPath, // New tree-aware function
    importBookmarks,
    updateBookmark,
    deleteBookmark,
    deleteAllBookmarks,
    toggleFavorite,
    incrementVisitCount,
    updateBookmarkCategory,
    deleteBookmarksByCategory,
    renameCategory,
    deleteCategory,
    updateCategoryIcon,
    restoreCompleteBackup,
    toggleCategoryExpansion: toggleCategoryExpansionState,
  };
};

    