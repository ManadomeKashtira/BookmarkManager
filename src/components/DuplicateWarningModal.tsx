import React, { useState } from 'react';
import { X, AlertTriangle, ExternalLink, Calendar, Tag, Star, Eye } from 'lucide-react';
import { CustomIcon } from '@/lib/customIcons';
import { DuplicateBookmark, MergeOptions } from '@/types/duplicateDetection';
import { Bookmark } from '@/types/bookmark';

interface DuplicateWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  newBookmark: Omit<Bookmark, 'id' | 'dateAdded' | 'dateModified' | 'visits'>;
  duplicates: DuplicateBookmark[];
  onProceed: () => void;
  onMerge: (duplicateId: string, mergeOptions: MergeOptions) => void;
  onCancel: () => void;
}

export const DuplicateWarningModal: React.FC<DuplicateWarningModalProps> = ({
  isOpen,
  onClose,
  newBookmark,
  duplicates,
  onProceed,
  onMerge,
  onCancel
}) => {
  const [selectedAction, setSelectedAction] = useState<'proceed' | 'merge' | 'cancel'>('cancel');
  const [selectedDuplicateId, setSelectedDuplicateId] = useState<string>(duplicates[0]?.id || '');
  const [showMergeOptions, setShowMergeOptions] = useState(false);
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

  if (!isOpen || duplicates.length === 0) return null;

  const handleActionChange = (action: 'proceed' | 'merge' | 'cancel') => {
    setSelectedAction(action);
    if (action === 'merge' && !selectedDuplicateId && duplicates.length > 0) {
      setSelectedDuplicateId(duplicates[0].id);
    }
  };

  const handleConfirm = () => {
    switch (selectedAction) {
      case 'proceed':
        onProceed();
        break;
      case 'merge':
        if (selectedDuplicateId) {
          onMerge(selectedDuplicateId, mergeOptions);
        }
        break;
      case 'cancel':
      default:
        onCancel();
        break;
    }
    onClose();
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

  const selectedDuplicate = duplicates.find(d => d.id === selectedDuplicateId);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card text-card-foreground rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
              Duplicate Bookmark Detected
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-all duration-200"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <p className="text-muted-foreground mt-2">
            We found {duplicates.length} existing bookmark{duplicates.length > 1 ? 's' : ''} that might be similar to the one you're adding.
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* New Bookmark Preview */}
          <div className="bg-muted/50 rounded-xl p-4">
            <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">+</span>
              </div>
              New Bookmark
            </h3>
            <div className="bg-background rounded-lg p-4 border border-border">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                  <CustomIcon name={newBookmark.favicon || 'folder1484'} size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-foreground truncate">{newBookmark.title}</h4>
                  <a 
                    href={newBookmark.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline flex items-center gap-1 mt-1"
                  >
                    {newBookmark.url}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  {newBookmark.description && (
                    <p className="text-sm text-muted-foreground mt-2">{newBookmark.description}</p>
                  )}
                  <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <CustomIcon name="folder1484" size={12} />
                      {newBookmark.category}
                    </span>
                    {newBookmark.tags.length > 0 && (
                      <span className="flex items-center gap-1">
                        <Tag className="w-3 h-3" />
                        {newBookmark.tags.join(', ')}
                      </span>
                    )}
                    {newBookmark.isFavorite && (
                      <span className="flex items-center gap-1 text-yellow-500">
                        <Star className="w-3 h-3 fill-current" />
                        Favorite
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Existing Duplicates */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
              <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">{duplicates.length}</span>
              </div>
              Existing Similar Bookmark{duplicates.length > 1 ? 's' : ''}
            </h3>
            <div className="space-y-3">
              {duplicates.map((duplicate) => (
                <div 
                  key={duplicate.id}
                  className={`bg-background rounded-lg p-4 border transition-all duration-200 cursor-pointer ${
                    selectedDuplicateId === duplicate.id && selectedAction === 'merge'
                      ? 'border-primary ring-2 ring-primary/20'
                      : 'border-border hover:border-muted-foreground'
                  }`}
                  onClick={() => {
                    setSelectedDuplicateId(duplicate.id);
                    if (selectedAction !== 'merge') {
                      setSelectedAction('merge');
                    }
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                      <CustomIcon name={duplicate.favicon || 'folder1484'} size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-foreground truncate">{duplicate.title}</h4>
                      <a 
                        href={duplicate.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline flex items-center gap-1 mt-1"
                      >
                        {duplicate.url}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                      {duplicate.description && (
                        <p className="text-sm text-muted-foreground mt-2">{duplicate.description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(duplicate.dateAdded)}
                        </span>
                        <span className="flex items-center gap-1">
                          <CustomIcon name="folder1484" size={12} />
                          {duplicate.category}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {duplicate.visits} visits
                        </span>
                        {duplicate.tags.length > 0 && (
                          <span className="flex items-center gap-1">
                            <Tag className="w-3 h-3" />
                            {duplicate.tags.join(', ')}
                          </span>
                        )}
                        {duplicate.isFavorite && (
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

          {/* Action Selection */}
          <div className="bg-muted/30 rounded-xl p-4">
            <h3 className="text-lg font-semibold text-foreground mb-4">What would you like to do?</h3>
            <div className="space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="action"
                  value="proceed"
                  checked={selectedAction === 'proceed'}
                  onChange={() => handleActionChange('proceed')}
                  className="mt-1 w-4 h-4 text-primary"
                />
                <div>
                  <div className="font-medium text-foreground">Add anyway</div>
                  <div className="text-sm text-muted-foreground">
                    Keep both bookmarks. The new bookmark will be added alongside the existing one(s).
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="action"
                  value="merge"
                  checked={selectedAction === 'merge'}
                  onChange={() => handleActionChange('merge')}
                  className="mt-1 w-4 h-4 text-primary"
                />
                <div className="flex-1">
                  <div className="font-medium text-foreground">Merge with existing bookmark</div>
                  <div className="text-sm text-muted-foreground mb-2">
                    Combine the new bookmark with an existing one. You can customize how the merge is handled.
                  </div>
                  {selectedAction === 'merge' && (
                    <div className="mt-3 space-y-3">
                      {duplicates.length > 1 && (
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            Select bookmark to merge with:
                          </label>
                          <select
                            value={selectedDuplicateId}
                            onChange={(e) => setSelectedDuplicateId(e.target.value)}
                            className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                          >
                            {duplicates.map((duplicate) => (
                              <option key={duplicate.id} value={duplicate.id}>
                                {duplicate.title} - {duplicate.url}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                      
                      <button
                        type="button"
                        onClick={() => setShowMergeOptions(!showMergeOptions)}
                        className="text-sm text-primary hover:underline"
                      >
                        {showMergeOptions ? 'Hide' : 'Show'} merge options
                      </button>

                      {showMergeOptions && (
                        <div className="bg-background rounded-lg p-4 border border-border space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-foreground mb-1">
                                Title
                              </label>
                              <select
                                value={mergeOptions.keepTitle}
                                onChange={(e) => setMergeOptions({
                                  ...mergeOptions,
                                  keepTitle: e.target.value as MergeOptions['keepTitle']
                                })}
                                className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm"
                              >
                                <option value="first">Keep existing</option>
                                <option value="last">Use new</option>
                                <option value="longest">Keep longest</option>
                                <option value="custom">Custom</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-foreground mb-1">
                                Description
                              </label>
                              <select
                                value={mergeOptions.keepDescription}
                                onChange={(e) => setMergeOptions({
                                  ...mergeOptions,
                                  keepDescription: e.target.value as MergeOptions['keepDescription']
                                })}
                                className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm"
                              >
                                <option value="first">Keep existing</option>
                                <option value="last">Use new</option>
                                <option value="longest">Keep longest</option>
                                <option value="custom">Custom</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-foreground mb-1">
                                Category
                              </label>
                              <select
                                value={mergeOptions.keepCategory}
                                onChange={(e) => setMergeOptions({
                                  ...mergeOptions,
                                  keepCategory: e.target.value as MergeOptions['keepCategory']
                                })}
                                className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm"
                              >
                                <option value="first">Keep existing</option>
                                <option value="last">Use new</option>
                                <option value="custom">Custom</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-foreground mb-1">
                                Visits
                              </label>
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
                                <option value="first">Keep existing</option>
                                <option value="last">Use new</option>
                              </select>
                            </div>
                          </div>

                          <div className="space-y-2">
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

                            <div>
                              <label className="block text-sm font-medium text-foreground mb-1">
                                Favorite Status
                              </label>
                              <select
                                value={mergeOptions.keepFavoriteStatus}
                                onChange={(e) => setMergeOptions({
                                  ...mergeOptions,
                                  keepFavoriteStatus: e.target.value as MergeOptions['keepFavoriteStatus']
                                })}
                                className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm"
                              >
                                <option value="any">Favorite if either is favorite</option>
                                <option value="all">Favorite only if both are favorite</option>
                                <option value="first">Keep existing status</option>
                                <option value="last">Use new status</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="action"
                  value="cancel"
                  checked={selectedAction === 'cancel'}
                  onChange={() => handleActionChange('cancel')}
                  className="mt-1 w-4 h-4 text-primary"
                />
                <div>
                  <div className="font-medium text-foreground">Cancel</div>
                  <div className="text-sm text-muted-foreground">
                    Don't add the bookmark and return to the form.
                  </div>
                </div>
              </label>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-border">
          <div className="flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-border text-foreground rounded-xl hover:bg-muted transition-all duration-200 font-medium"
            >
              Back to Form
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-all duration-200 font-medium"
            >
              {selectedAction === 'proceed' && 'Add Anyway'}
              {selectedAction === 'merge' && 'Merge Bookmarks'}
              {selectedAction === 'cancel' && 'Cancel'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};