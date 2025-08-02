import React, { useState, useEffect } from 'react';
import { X, Search, AlertTriangle, ExternalLink, Calendar, Tag, Star, Eye, Trash2, Merge, RefreshCw } from 'lucide-react';
import { CustomIcon } from '@/lib/customIcons';
import { 
  DuplicateGroup, 
  DuplicateBookmark, 
  DuplicateDetectionResult, 
  MergeOptions 
} from '@/types/duplicateDetection';
import { Bookmark } from '@/types/bookmark';
import { useDuplicateDetection } from '@/hooks/useDuplicateDetection';

interface DuplicateManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookmarks: Bookmark[];
  onUpdateBookmark: (id: string, updates: Partial<Bookmark>) => void;
  onDeleteBookmark: (id: string) => void;
}

export const DuplicateManagementModal: React.FC<DuplicateManagementModalProps> = ({
  isOpen,
  onClose,
  bookmarks,
  onUpdateBookmark,
  onDeleteBookmark
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set());
  const [showMergeOptions, setShowMergeOptions] = useState<string | null>(null);
  const [mergeOptions, setMergeOptions] = useState<MergeOptions>({
    keepTitle: 'longest',
    keepDescription: 'longest',
    keepCategory: 'first',
    keepFavicon: 'first',
    combineTags: true,
    keepFavoriteStatus: 'any',
    keepVisits: 'sum',
    keepDates: 'earliest'
  });

  const {
    detectAllDuplicates,
    mergeDuplicates,
    isDetecting,
    lastDetectionResult,
    duplicateStats,
    getDefaultMergeOptions
  } = useDuplicateDetection({
    bookmarks,
    onUpdateBookmark,
    onDeleteBookmark
  });

  const [detectionResult, setDetectionResult] = useState<DuplicateDetectionResult | null>(null);

  useEffect(() => {
    if (isOpen && !detectionResult) {
      handleDetectDuplicates();
    }
  }, [isOpen]);

  useEffect(() => {
    if (lastDetectionResult) {
      setDetectionResult(lastDetectionResult);
    }
  }, [lastDetectionResult]);

  useEffect(() => {
    setMergeOptions(getDefaultMergeOptions());
  }, [getDefaultMergeOptions]);

  const handleDetectDuplicates = async () => {
    alert('🔍 Scanning for duplicates...\n\nAnalyzing all bookmarks for exact URL matches, similar URLs, and similar titles. Please wait...');
    const result = await detectAllDuplicates();
    setDetectionResult(result);
    setSelectedGroups(new Set());
    
    if (result.duplicateGroups.length > 0) {
      alert(`✅ Duplicate detection complete!\n\nFound ${result.duplicateGroups.length} duplicate groups with ${result.totalDuplicates} total duplicates.`);
    } else {
      alert('✅ Duplicate detection complete!\n\nNo duplicates found in your bookmarks collection.');
    }
  };

  const handleGroupSelection = (groupId: string, selected: boolean) => {
    const newSelection = new Set(selectedGroups);
    if (selected) {
      newSelection.add(groupId);
    } else {
      newSelection.delete(groupId);
    }
    setSelectedGroups(newSelection);
  };

  const handleSelectAll = () => {
    if (!detectionResult) return;
    
    const filteredGroups = getFilteredGroups();
    const allGroupIds = new Set(filteredGroups.map(group => group.id));
    setSelectedGroups(allGroupIds);
  };

  const handleDeselectAll = () => {
    setSelectedGroups(new Set());
  };

  const handleMergeGroup = (group: DuplicateGroup, options: MergeOptions) => {
    const bookmarkIds = group.bookmarks.map(b => b.id);
    mergeDuplicates(bookmarkIds, options);
    
    // Remove this group from results
    if (detectionResult) {
      const updatedGroups = detectionResult.duplicateGroups.filter(g => g.id !== group.id);
      setDetectionResult({
        ...detectionResult,
        duplicateGroups: updatedGroups,
        totalDuplicates: detectionResult.totalDuplicates - group.bookmarks.length
      });
    }
    
    setShowMergeOptions(null);
    alert(`✅ Successfully merged ${group.bookmarks.length} duplicate bookmarks into 1!`);
  };

  const handleDeleteGroup = (group: DuplicateGroup, keepFirst: boolean = true) => {
    const bookmarksToDelete = keepFirst ? group.bookmarks.slice(1) : group.bookmarks;
    
    bookmarksToDelete.forEach(bookmark => {
      onDeleteBookmark(bookmark.id);
    });

    // Remove this group from results
    if (detectionResult) {
      const updatedGroups = detectionResult.duplicateGroups.filter(g => g.id !== group.id);
      setDetectionResult({
        ...detectionResult,
        duplicateGroups: updatedGroups,
        totalDuplicates: detectionResult.totalDuplicates - group.bookmarks.length
      });
    }
    
    const action = keepFirst ? 'deleted all except the first bookmark' : 'deleted all bookmarks';
    alert(`✅ Successfully ${action} from this duplicate group!`);
  };

  const handleBulkMerge = () => {
    if (!detectionResult) return;

    const selectedGroupsList = detectionResult.duplicateGroups.filter(group => 
      selectedGroups.has(group.id)
    );

    if (selectedGroupsList.length === 0) {
      alert('⚠️ No duplicate groups selected for merging.');
      return;
    }

    const totalDuplicates = selectedGroupsList.reduce((sum, group) => sum + group.bookmarks.length, 0);
    
    if (confirm(`🔄 Merge ${selectedGroupsList.length} duplicate groups?\n\nThis will merge ${totalDuplicates} bookmarks into ${selectedGroupsList.length} unique bookmarks. This action cannot be undone.`)) {
      selectedGroupsList.forEach(group => {
        handleMergeGroup(group, mergeOptions);
      });

      setSelectedGroups(new Set());
      alert(`✅ Successfully merged ${selectedGroupsList.length} duplicate groups!`);
    }
  };

  const handleBulkDelete = (keepFirst: boolean = true) => {
    if (!detectionResult) return;

    const selectedGroupsList = detectionResult.duplicateGroups.filter(group => 
      selectedGroups.has(group.id)
    );

    if (selectedGroupsList.length === 0) {
      alert('⚠️ No duplicate groups selected for deletion.');
      return;
    }

    const totalDuplicates = selectedGroupsList.reduce((sum, group) => sum + group.bookmarks.length, 0);
    const action = keepFirst ? 'delete all except the first bookmark' : 'delete all bookmarks';
    
    if (confirm(`🗑️ Delete duplicates from ${selectedGroupsList.length} groups?\n\nThis will ${action} in ${totalDuplicates} total bookmarks. This action cannot be undone.`)) {
      selectedGroupsList.forEach(group => {
        handleDeleteGroup(group, keepFirst);
      });

      setSelectedGroups(new Set());
      alert(`✅ Successfully deleted duplicates from ${selectedGroupsList.length} groups!`);
    }
  };

  const getFilteredGroups = () => {
    if (!detectionResult) return [];

    let filtered = detectionResult.duplicateGroups;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(group =>
        group.bookmarks.some(bookmark =>
          bookmark.title.toLowerCase().includes(query) ||
          bookmark.url.toLowerCase().includes(query) ||
          bookmark.tags.some(tag => tag.toLowerCase().includes(query))
        )
      );
    }

    return filtered;
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  const getDuplicateTypeColor = (type: DuplicateGroup['duplicateType']) => {
    switch (type) {
      case 'exact':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'normalized':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'title-similar':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getDuplicateTypeLabel = (type: DuplicateGroup['duplicateType']) => {
    switch (type) {
      case 'exact':
        return 'Exact URL';
      case 'normalized':
        return 'Similar URL';
      case 'title-similar':
        return 'Similar Title';
      default:
        return 'Unknown';
    }
  };

  if (!isOpen) return null;

  const filteredGroups = getFilteredGroups();
  const selectedCount = selectedGroups.size;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card text-card-foreground rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                <Merge className="w-5 h-5 text-white" />
              </div>
              Duplicate Management
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-all duration-200"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Stats */}
          {duplicateStats && (
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="text-2xl font-bold text-foreground">{duplicateStats.totalGroups}</div>
                <div className="text-sm text-muted-foreground">Duplicate Groups</div>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="text-2xl font-bold text-foreground">{duplicateStats.totalDuplicates}</div>
                <div className="text-sm text-muted-foreground">Total Duplicates</div>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="text-2xl font-bold text-foreground">{duplicateStats.percentageDuplicates}%</div>
                <div className="text-sm text-muted-foreground">Of Collection</div>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="text-2xl font-bold text-foreground">{duplicateStats.detectionTime}ms</div>
                <div className="text-sm text-muted-foreground">Detection Time</div>
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="p-6 border-b border-border">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <input
                type="text"
                placeholder="Search duplicates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={handleDetectDuplicates}
                disabled={isDetecting}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-all duration-200 flex items-center gap-2 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isDetecting ? 'animate-spin' : ''}`} />
                {isDetecting ? 'Detecting...' : 'Refresh'}
              </button>
            </div>
          </div>

          {/* Bulk Actions */}
          {filteredGroups.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2 items-center">
              <div className="flex gap-2">
                <button
                  onClick={handleSelectAll}
                  className="px-3 py-1 text-sm bg-muted text-muted-foreground rounded-lg hover:bg-accent hover:text-accent-foreground transition-all duration-200"
                >
                  Select All
                </button>
                <button
                  onClick={handleDeselectAll}
                  className="px-3 py-1 text-sm bg-muted text-muted-foreground rounded-lg hover:bg-accent hover:text-accent-foreground transition-all duration-200"
                >
                  Deselect All
                </button>
              </div>

              {selectedCount > 0 && (
                <div className="flex gap-2 items-center">
                  <span className="text-sm text-muted-foreground">
                    {selectedCount} group{selectedCount > 1 ? 's' : ''} selected
                  </span>
                  <button
                    onClick={handleBulkMerge}
                    className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-all duration-200 flex items-center gap-1"
                  >
                    <Merge className="w-3 h-3" />
                    Merge All
                  </button>
                  <button
                    onClick={() => handleBulkDelete(true)}
                    className="px-3 py-1 text-sm bg-orange-500 text-white rounded-lg hover:opacity-90 transition-all duration-200 flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    Keep First
                  </button>
                  <button
                    onClick={() => handleBulkDelete(false)}
                    className="px-3 py-1 text-sm bg-red-500 text-white rounded-lg hover:opacity-90 transition-all duration-200 flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    Delete All
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isDetecting ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <RefreshCw className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
                <p className="text-muted-foreground">Detecting duplicates...</p>
              </div>
            </div>
          ) : filteredGroups.length === 0 ? (
            <div className="text-center py-12">
              <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {detectionResult ? 'No Duplicates Found' : 'No Detection Results'}
              </h3>
              <p className="text-muted-foreground">
                {detectionResult 
                  ? 'Your bookmark collection looks clean! No duplicate bookmarks were detected.'
                  : 'Click "Refresh" to scan your bookmarks for duplicates.'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredGroups.map((group) => (
                <div key={group.id} className="bg-background rounded-xl border border-border p-6">
                  {/* Group Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedGroups.has(group.id)}
                        onChange={(e) => handleGroupSelection(group.id, e.target.checked)}
                        className="w-4 h-4 text-primary rounded"
                      />
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getDuplicateTypeColor(group.duplicateType)}`}>
                          {getDuplicateTypeLabel(group.duplicateType)}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {Math.round(group.similarity * 100)}% similar
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {group.bookmarks.length} bookmarks
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowMergeOptions(showMergeOptions === group.id ? null : group.id)}
                        className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-all duration-200 flex items-center gap-1"
                      >
                        <Merge className="w-3 h-3" />
                        Merge
                      </button>
                      <button
                        onClick={() => handleDeleteGroup(group, true)}
                        className="px-3 py-1 text-sm bg-orange-500 text-white rounded-lg hover:opacity-90 transition-all duration-200 flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        Keep First
                      </button>
                      <button
                        onClick={() => handleDeleteGroup(group, false)}
                        className="px-3 py-1 text-sm bg-red-500 text-white rounded-lg hover:opacity-90 transition-all duration-200 flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        Delete All
                      </button>
                    </div>
                  </div>

                  {/* Merge Options */}
                  {showMergeOptions === group.id && (
                    <div className="mb-4 p-4 bg-muted/50 rounded-lg border border-border">
                      <h4 className="font-semibold text-foreground mb-3">Merge Options</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-1">Title</label>
                          <select
                            value={mergeOptions.keepTitle}
                            onChange={(e) => setMergeOptions({
                              ...mergeOptions,
                              keepTitle: e.target.value as MergeOptions['keepTitle']
                            })}
                            className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm"
                          >
                            <option value="first">Keep first</option>
                            <option value="last">Keep last</option>
                            <option value="longest">Keep longest</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-1">Visits</label>
                          <select
                            value={mergeOptions.keepVisits}
                            onChange={(e) => setMergeOptions({
                              ...mergeOptions,
                              keepVisits: e.target.value as MergeOptions['keepVisits']
                            })}
                            className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm"
                          >
                            <option value="sum">Add together</option>
                            <option value="max">Keep highest</option>
                            <option value="first">Keep first</option>
                            <option value="last">Keep last</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-1">Favorite</label>
                          <select
                            value={mergeOptions.keepFavoriteStatus}
                            onChange={(e) => setMergeOptions({
                              ...mergeOptions,
                              keepFavoriteStatus: e.target.value as MergeOptions['keepFavoriteStatus']
                            })}
                            className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm"
                          >
                            <option value="any">If any is favorite</option>
                            <option value="all">If all are favorite</option>
                            <option value="first">Keep first</option>
                            <option value="last">Keep last</option>
                          </select>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 mb-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={mergeOptions.combineTags}
                            onChange={(e) => setMergeOptions({
                              ...mergeOptions,
                              combineTags: e.target.checked
                            })}
                            className="w-4 h-4 text-primary rounded"
                          />
                          <span className="text-sm text-foreground">Combine all tags</span>
                        </label>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleMergeGroup(group, mergeOptions)}
                          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-all duration-200"
                        >
                          Apply Merge
                        </button>
                        <button
                          onClick={() => setShowMergeOptions(null)}
                          className="px-4 py-2 border border-border text-foreground rounded-lg hover:bg-muted transition-all duration-200"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Bookmarks in Group */}
                  <div className="space-y-3">
                    {group.bookmarks.map((bookmark, index) => (
                      <div key={bookmark.id} className="bg-muted/30 rounded-lg p-4 border border-border">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                            <CustomIcon name={bookmark.favicon || 'folder1484'} size={20} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-foreground truncate">{bookmark.title}</h4>
                              {index === 0 && (
                                <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                                  Primary
                                </span>
                              )}
                            </div>
                            <a 
                              href={bookmark.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-sm text-primary hover:underline flex items-center gap-1 mb-2"
                            >
                              {bookmark.url}
                              <ExternalLink className="w-3 h-3" />
                            </a>
                            {bookmark.description && (
                              <p className="text-sm text-muted-foreground mb-2">{bookmark.description}</p>
                            )}
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {formatDate(bookmark.dateAdded)}
                              </span>
                              <span className="flex items-center gap-1">
                                <CustomIcon name="folder1484" size={12} />
                                {bookmark.category}
                              </span>
                              <span className="flex items-center gap-1">
                                <Eye className="w-3 h-3" />
                                {bookmark.visits} visits
                              </span>
                              {bookmark.tags.length > 0 && (
                                <span className="flex items-center gap-1">
                                  <Tag className="w-3 h-3" />
                                  {bookmark.tags.join(', ')}
                                </span>
                              )}
                              {bookmark.isFavorite && (
                                <span className="flex items-center gap-1 text-yellow-500">
                                  <Star className="w-3 h-3 fill-current" />
                                  Favorite
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};