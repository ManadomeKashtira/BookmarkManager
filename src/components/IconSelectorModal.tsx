import React, { useState, useEffect } from 'react';
import { X, Search } from 'lucide-react';
import { CustomIcon, getAllIcons, getAllIconsSync, getIconsByCategory, getIconsByCategorySync, type CustomIconName } from '@/lib/customIcons';

interface IconSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectIcon: (iconName: CustomIconName) => void;
  currentIcon?: CustomIconName;
}

export const IconSelectorModal: React.FC<IconSelectorModalProps> = ({
  isOpen,
  onClose,
  onSelectIcon,
  currentIcon
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [allIcons, setAllIcons] = useState<Array<{name: CustomIconName, path: string, label: string}>>([]);
  const [iconsByCategory, setIconsByCategory] = useState<Record<string, CustomIconName[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  
  // Load icons when modal opens
  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      
      const loadIcons = async () => {
        try {
          // Use async version for better reliability
          const icons = await getAllIcons();
          const categories = await getIconsByCategory();
          
          if (icons.length > 0) {
            setAllIcons(icons);
            setIconsByCategory(categories);
            setIsLoading(false);
          } else {
            // Fallback to sync version if async fails
            const syncIcons = getAllIconsSync();
            const syncCategories = getIconsByCategorySync();
            
            if (syncIcons.length > 0) {
              setAllIcons(syncIcons);
              setIconsByCategory(syncCategories);
              setIsLoading(false);
            } else {
              // Final retry after delay
              setTimeout(() => {
                const retryIcons = getAllIconsSync();
                const retryCategories = getIconsByCategorySync();
                setAllIcons(retryIcons);
                setIconsByCategory(retryCategories);
                setIsLoading(false);
              }, 200);
            }
          }
        } catch (error) {
          console.error('Error loading icons:', error);
          // Fallback to sync version
          const syncIcons = getAllIconsSync();
          const syncCategories = getIconsByCategorySync();
          setAllIcons(syncIcons);
          setIconsByCategory(syncCategories);
          setIsLoading(false);
        }
      };
      
      loadIcons();
    }
  }, [isOpen]);
  
  const categories = [
    { key: 'all', label: 'All Icons' },
    { key: 'folders', label: 'Folders' },
    { key: 'social', label: 'Social Media' },
    { key: 'browsers', label: 'Browsers' },
    { key: 'programming', label: 'Programming' },
    { key: 'music', label: 'Music' },
    { key: 'animals', label: 'Animals' },
    { key: 'food', label: 'Food' },
    { key: 'weather', label: 'Weather' },
    { key: 'tools', label: 'Tools' },
    { key: 'notes', label: 'Notes' },
    { key: 'system', label: 'System' },
    { key: 'files', label: 'Files' },
    { key: 'other', label: 'Other' }
  ];

  const filteredIcons = allIcons.filter(icon => {
    // Improved search matching
    const searchLower = searchTerm.toLowerCase().trim();
    if (!searchLower) {
      // No search term, just filter by category
      if (selectedCategory === 'all') {
        return true;
      }
      const categoryIcons = iconsByCategory[selectedCategory as keyof typeof iconsByCategory] || [];
      return categoryIcons.includes(icon.name);
    }
    
    // Search in multiple fields
    const matchesName = icon.name.toLowerCase().includes(searchLower);
    const matchesLabel = icon.label.toLowerCase().includes(searchLower);
    const matchesPath = icon.path.toLowerCase().includes(searchLower);
    
    const matchesSearch = matchesName || matchesLabel || matchesPath;
    
    if (selectedCategory === 'all') {
      return matchesSearch;
    }
    
    const categoryIcons = iconsByCategory[selectedCategory as keyof typeof iconsByCategory] || [];
    return categoryIcons.includes(icon.name) && matchesSearch;
  });

  const handleIconSelect = (iconName: CustomIconName) => {
    onSelectIcon(iconName);
    onClose();
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === '/' && e.target !== e.currentTarget.querySelector('input')) {
      // Focus search when "/" is pressed
      e.preventDefault();
      const searchInput = e.currentTarget.querySelector('input[type="text"]') as HTMLInputElement;
      if (searchInput) {
        searchInput.focus();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-start justify-center z-50 p-2 sm:p-4 pt-4 sm:pt-8"
      onKeyDown={handleKeyDown}
    >
      <div className="bg-card text-card-foreground rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] sm:max-h-[85vh] overflow-hidden border border-border/20">
        <div className="p-4 border-b border-border bg-gradient-to-r from-primary/5 to-secondary/5">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg flex items-center justify-center">
                <CustomIcon name="folder1484" size={16} className="text-white" />
              </div>
              Select Icon
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-all duration-200"
              aria-label="Close icon selector"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-4">
          {/* Search Bar */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <input
                type="text"
                placeholder="Search icons... (Press / to focus)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 text-sm"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  title="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Quick Access Icons */}
          {selectedCategory === 'all' && !searchTerm && (
            <div className="mb-4">
              <h3 className="text-xs font-medium text-muted-foreground mb-2">Quick Access</h3>
              <div className="flex flex-wrap gap-1.5">
                {['folder1484', 'user3296', 'mail142', 'gear1213', 'settings778', 'chart671', 'videoSolidFull', 'movie850'].map((iconName) => {
                  const icon = allIcons.find(i => i.name === iconName);
                  if (!icon) return null;
                  return (
                    <button
                      key={iconName}
                      onClick={() => handleIconSelect(iconName)}
                      className={`p-1.5 rounded-md flex items-center justify-center transition-all duration-200 ${
                        currentIcon === iconName
                          ? 'bg-primary text-primary-foreground ring-1 ring-primary ring-offset-1'
                          : 'bg-card hover:bg-accent hover:text-accent-foreground border border-border/30'
                      }`}
                      title={icon.label}
                    >
                      <CustomIcon name={iconName} size={16} />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Category Tabs */}
          <div className="mb-4">
            <div className="flex flex-wrap gap-1.5">
              {categories.map((category) => (
                <button
                  key={category.key}
                  onClick={() => setSelectedCategory(category.key)}
                  className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
                    selectedCategory === category.key
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                  }`}
                >
                  {category.label}
                </button>
              ))}
            </div>
          </div>

          {/* Results count */}
          {!isLoading && (
            <div className="mb-3 text-xs text-muted-foreground flex items-center justify-between">
              <span>
                {filteredIcons.length} icon{filteredIcons.length !== 1 ? 's' : ''} 
                {selectedCategory !== 'all' && ` in ${categories.find(c => c.key === selectedCategory)?.label}`}
                {searchTerm && ` matching "${searchTerm}"`}
              </span>
              {currentIcon && (
                <span className="text-primary font-medium">
                  Current: {allIcons.find(icon => icon.name === currentIcon)?.label || currentIcon}
                </span>
              )}
            </div>
          )}

          {/* Icons Grid */}
          <div className="max-h-[50vh] overflow-y-auto border border-border/30 rounded-lg bg-background/50">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-3"></div>
                <p className="text-sm">Loading icons...</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-8 sm:grid-cols-10 md:grid-cols-12 lg:grid-cols-14 xl:grid-cols-16 2xl:grid-cols-18 gap-2 p-2 sm:p-3">
                  {filteredIcons.map((icon) => (
                    <button
                      key={icon.name}
                      onClick={() => handleIconSelect(icon.name)}
                      className={`p-2 rounded-lg flex items-center justify-center transition-all duration-200 aspect-square group relative ${
                        currentIcon === icon.name
                          ? 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-1 shadow-md'
                          : 'bg-card hover:bg-accent hover:text-accent-foreground hover:shadow-sm border border-border/30'
                      }`}
                      title={icon.label}
                    >
                      <CustomIcon 
                        name={icon.name} 
                        size={20}
                        style={{ 
                          maxWidth: '20px', 
                          maxHeight: '20px',
                          objectFit: 'contain'
                        }}
                      />
                      
                      {/* Tooltip */}
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                        {icon.label}
                      </div>
                    </button>
                  ))}
                </div>
                
                {filteredIcons.length === 0 && !isLoading && (
                  <div className="text-center py-8 text-muted-foreground">
                    <div className="w-10 h-10 mx-auto mb-3 opacity-50 flex items-center justify-center">
                      <CustomIcon name="folder1484" size={40} />
                    </div>
                    <p className="text-sm">No icons found{searchTerm ? ` matching "${searchTerm}"` : ''}</p>
                    {searchTerm && (
                      <p className="text-xs mt-1 opacity-75">Try a different search term or select a different category</p>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}; 