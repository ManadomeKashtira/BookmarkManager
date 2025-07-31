import type { Category } from '@/types/bookmark';

/**
 * Parse a category path (e.g., "Work/Projects/Web") into individual category names
 */
export function parseCategoryPath(fullPath: string): string[] {
  return fullPath.split('/').map(part => part.trim()).filter(Boolean);
}

/**
 * Get the parent path from a full path (e.g., "Work/Projects/Web" -> "Work/Projects")
 */
export function getParentPath(fullPath: string): string | null {
  const parts = parseCategoryPath(fullPath);
  if (parts.length <= 1) return null;
  return parts.slice(0, -1).join('/');
}

/**
 * Get the category name from a full path (e.g., "Work/Projects/Web" -> "Web")
 */
export function getCategoryName(fullPath: string): string {
  const parts = parseCategoryPath(fullPath);
  return parts[parts.length - 1] || fullPath;
}

/**
 * Validate and normalize a category path
 */
export function normalizeCategoryPath(path: string): string {
  return parseCategoryPath(path).join('/');
}

/**
 * Get the depth level of a category path (e.g., "Work/Projects/Web" -> 2)
 */
export function getCategoryLevel(fullPath: string): number {
  return parseCategoryPath(fullPath).length - 1;
}

/**
 * Build a hierarchical tree structure from flat category list
 */
export function buildCategoryTree(flatCategories: Category[]): Category[] {
  const categoryMap = new Map<string, Category>();
  const rootCategories: Category[] = [];

  // First pass: Create enhanced categories with hierarchy info
  const enhancedCategories = flatCategories.map(cat => {
    const fullPath = cat.name;
    const level = getCategoryLevel(fullPath);
    const parentPath = getParentPath(fullPath);
    const displayName = getCategoryName(fullPath);
    
    const enhanced: Category = {
      ...cat,
      name: displayName, // Display name (last part of path)
      fullPath, // Keep original full path
      level,
      parentId: parentPath,
      isExpanded: cat.isExpanded !== undefined ? cat.isExpanded : (level === 0), // Preserve existing state or default to expanded for root
      children: []
    };
    
    categoryMap.set(fullPath, enhanced);
    return enhanced;
  });

  // Second pass: Build parent-child relationships
  enhancedCategories.forEach(category => {
    if (category.parentId) {
      const parent = categoryMap.get(category.parentId);
      if (parent) {
        parent.children = parent.children || [];
        parent.children.push(category);
      } else {
        // Parent doesn't exist, treat as root
        rootCategories.push(category);
      }
    } else {
      // Root category
      rootCategories.push(category);
    }
  });

  // Sort categories at each level
  const sortCategories = (categories: Category[]): Category[] => {
    return categories.sort((a, b) => a.name.localeCompare(b.name)).map(cat => ({
      ...cat,
      children: cat.children ? sortCategories(cat.children) : []
    }));
  };

  return sortCategories(rootCategories);
}

/**
 * Flatten a hierarchical tree back to a flat list (for storage/processing)
 */
export function flattenCategoryTree(treeCategories: Category[]): Category[] {
  const flattened: Category[] = [];
  
  const traverse = (categories: Category[]) => {
    categories.forEach(category => {
      // Add the category with its full path as name for storage
      flattened.push({
        ...category,
        name: category.fullPath || category.name,
        children: undefined // Remove children for flat storage
      });
      
      if (category.children && category.children.length > 0) {
        traverse(category.children);
      }
    });
  };
  
  traverse(treeCategories);
  return flattened;
}

/**
 * Toggle the expanded state of a category
 */
export function toggleCategoryExpansion(
  treeCategories: Category[], 
  categoryPath: string
): Category[] {
  const updateCategory = (categories: Category[]): Category[] => {
    return categories.map(category => {
      if (category.fullPath === categoryPath) {
        return {
          ...category,
          isExpanded: !category.isExpanded
        };
      }
      
      if (category.children) {
        return {
          ...category,
          children: updateCategory(category.children)
        };
      }
      
      return category;
    });
  };
  
  return updateCategory(treeCategories);
}

/**
 * Get all visible categories (considering expanded/collapsed state)
 */
export function getVisibleCategories(treeCategories: Category[]): Category[] {
  const visible: Category[] = [];
  
  const traverse = (categories: Category[], currentLevel: number = 0) => {
    categories.forEach(category => {
      // Add the category with its display level
      visible.push({
        ...category,
        level: currentLevel
      });
      
      // If expanded and has children, traverse children
      if (category.isExpanded && category.children && category.children.length > 0) {
        traverse(category.children, currentLevel + 1);
      }
    });
  };
  
  traverse(treeCategories);
  return visible;
}

/**
 * Find a category by its full path in the tree
 */
export function findCategoryInTree(
  treeCategories: Category[], 
  fullPath: string
): Category | null {
  const search = (categories: Category[]): Category | null => {
    for (const category of categories) {
      if (category.fullPath === fullPath) {
        return category;
      }
      
      if (category.children) {
        const found = search(category.children);
        if (found) return found;
      }
    }
    return null;
  };
  
  return search(treeCategories);
}

/**
 * Create missing parent categories for a given path
 */
export function ensureParentCategories(
  existingCategories: Category[], 
  fullPath: string,
  defaultColor: string = '#A1A1AA'
): Category[] {
  const parts = parseCategoryPath(fullPath);
  const newCategories: Category[] = [...existingCategories];
  const existingPaths = new Set(existingCategories.map(cat => cat.name));
  
  // Create parent paths if they don't exist
  for (let i = 1; i <= parts.length; i++) {
    const currentPath = parts.slice(0, i).join('/');
    
    if (!existingPaths.has(currentPath)) {
      const newCategory: Category = {
        id: `cat-${currentPath.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}`,
        name: currentPath,
        color: defaultColor,
        count: 0,
        fullPath: currentPath,
        level: i - 1,
        isExpanded: i === 1, // Root categories expanded by default
        children: []
      };
      
      newCategories.push(newCategory);
      existingPaths.add(currentPath);
    }
  }
  
  return newCategories;
}
