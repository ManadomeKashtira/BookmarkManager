
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, FileText, AlertTriangle } from 'lucide-react';
import { 
  CustomIcon, 
  FolderIcon, 
  SettingsIcon,
  GearIcon,
  type CustomIconName
} from '@/lib/customIcons';
import type { Bookmark, Memo, MemoContent } from '@/types/bookmark';
import { RichTextEditor } from './RichTextEditor';
import { IconSelectorModal } from './IconSelectorModal';
import { DuplicateWarningModal } from './DuplicateWarningModal';
import { useDuplicateDetection } from '@/hooks/useDuplicateDetection';
import { DuplicateBookmark, MergeOptions } from '@/types/duplicateDetection';

interface AddBookmarkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (bookmark: Omit<Bookmark, 'id' | 'dateAdded' | 'dateModified' | 'visits'>) => void;
  onAddMemo?: (memo: Omit<Memo, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateBookmark?: (id: string, updates: Partial<Bookmark>) => void;
  onDeleteBookmark?: (id: string) => void;
  categories: string[];
  editingBookmark?: Bookmark;
  initialCategory?: string | null;
  allBookmarks: Bookmark[];
}

const initialFormState = {
  id: undefined as string | undefined, // To track if editing
  title: '',
  url: '',
  description: '',
  category: 'Uncategorized',
  tags: '',
  isFavorite: false,
  favicon: 'folder'
};

const initialMemoState = {
  title: '',
  content: [] as MemoContent[],
  backgroundColor: '#ffffff',
  gridBackground: false,
  tags: '',
  isFavorite: false,
  category: 'Uncategorized'
};

export const AddBookmarkModal: React.FC<AddBookmarkModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  onAddMemo,
  onUpdateBookmark,
  onDeleteBookmark,
  categories,
  editingBookmark,
  initialCategory,
  allBookmarks
}) => {
  const [formData, setFormData] = useState(initialFormState);
  const [memoData, setMemoData] = useState(initialMemoState);
  const [activeTab, setActiveTab] = useState<'bookmark' | 'memo'>('bookmark');
  const [showIconSelector, setShowIconSelector] = useState(false);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const [pendingBookmark, setPendingBookmark] = useState<Omit<Bookmark, 'id' | 'dateAdded' | 'dateModified' | 'visits'> | null>(null);
  const [detectedDuplicates, setDetectedDuplicates] = useState<DuplicateBookmark[]>([]);
  const [realTimeDuplicates, setRealTimeDuplicates] = useState<DuplicateBookmark[]>([]);
  const prevIsOpenRef = useRef(isOpen);

  // Initialize duplicate detection hook
  const {
    checkForDuplicates,
    checkUrlInRealTime,
    mergeWithExisting,
    getDefaultMergeOptions
  } = useDuplicateDetection({
    bookmarks: allBookmarks,
    onUpdateBookmark,
    onDeleteBookmark
  });

  useEffect(() => {
    const isOpening = isOpen && !prevIsOpenRef.current;

    if (isOpening) { // Modal is newly opened
      if (editingBookmark) {
        setFormData({
          id: editingBookmark.id,
          title: editingBookmark.title || '',
          url: editingBookmark.url || '',
          description: editingBookmark.description || '',
          category: editingBookmark.category || (categories.length > 0 ? categories[0] : 'Uncategorized'),
          tags: editingBookmark.tags.join(', ') || '',
          isFavorite: editingBookmark.isFavorite || false,
          favicon: editingBookmark.favicon || 'folder',
        });
      } else {
        // New bookmark: use initialCategory if provided, otherwise default from existing categories or 'Uncategorized'
        const defaultCat = categories.includes('Uncategorized') ? 'Uncategorized' : (categories.length > 0 ? categories[0] : 'Uncategorized');
        setFormData({
          ...initialFormState,
          id: undefined, // Explicitly undefined for new
          category: initialCategory || defaultCat,
          favicon: 'folder',
        });
      }
      
      // Reset duplicate detection state
      setRealTimeDuplicates([]);
      setDetectedDuplicates([]);
      setPendingBookmark(null);
      setShowDuplicateWarning(false);
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, editingBookmark, initialCategory, categories]);


  const handleIconSelect = (iconName: CustomIconName) => {
    setFormData({ ...formData, favicon: iconName });
    setShowIconSelector(false);
  };

  // Real-time duplicate checking for URL field
  const handleUrlChange = useCallback((url: string) => {
    setFormData(prev => ({ ...prev, url }));
    
    // Check for duplicates in real-time (debounced)
    const timeoutId = setTimeout(() => {
      if (url && url.length > 10 && !editingBookmark) {
        const duplicates = checkUrlInRealTime(url);
        setRealTimeDuplicates(duplicates);
      } else {
        setRealTimeDuplicates([]);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [checkUrlInRealTime, editingBookmark]);

  // Handle duplicate warning actions
  const handleDuplicateProceed = useCallback(() => {
    if (pendingBookmark) {
      onAdd(pendingBookmark);
      setPendingBookmark(null);
      setDetectedDuplicates([]);
      setShowDuplicateWarning(false);
      onClose();
    }
  }, [pendingBookmark, onAdd, onClose]);

  const handleDuplicateMerge = useCallback((duplicateId: string, mergeOptions: MergeOptions) => {
    if (pendingBookmark) {
      mergeWithExisting(pendingBookmark, duplicateId, mergeOptions);
      setPendingBookmark(null);
      setDetectedDuplicates([]);
      setShowDuplicateWarning(false);
      onClose();
    }
  }, [pendingBookmark, mergeWithExisting, onClose]);

  const handleDuplicateCancel = useCallback(() => {
    setPendingBookmark(null);
    setDetectedDuplicates([]);
    setShowDuplicateWarning(false);
    // Don't close the modal, return to form
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (activeTab === 'bookmark') {
      if (!formData.title || !formData.url) return;

      const bookmarkPayload = {
        title: formData.title,
        url: formData.url,
        description: formData.description,
        category: formData.category || 'Uncategorized', 
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
        isFavorite: formData.isFavorite,
        favicon: formData.favicon
      };

      // If editing existing bookmark, just update it
      if (editingBookmark) {
        onAdd(bookmarkPayload);
        return;
      }

      // Check for duplicates before adding new bookmark
      const duplicates = checkForDuplicates(bookmarkPayload);
      
      if (duplicates.length > 0) {
        // Show duplicate warning modal
        setPendingBookmark(bookmarkPayload);
        setDetectedDuplicates(duplicates);
        setShowDuplicateWarning(true);
      } else {
        // No duplicates, add directly
        onAdd(bookmarkPayload);
        onClose();
      }
    } else if (activeTab === 'memo' && onAddMemo) {
      if (!memoData.title.trim()) return;

      const memoPayload = {
        title: memoData.title.trim(),
        content: memoData.content,
        backgroundColor: memoData.backgroundColor,
        gridBackground: memoData.gridBackground,
        tags: memoData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
        isFavorite: memoData.isFavorite,
        category: memoData.category || 'Uncategorized'
      };
      onAddMemo(memoPayload);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card text-card-foreground rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center">
                {activeTab === 'bookmark' ? (
                  <CustomIcon name="folder1484" size={20} className="text-primary-foreground" />
                ) : (
                  <FileText className="w-5 h-5 text-primary-foreground" />
                )}
              </div>
              {editingBookmark ? 'Edit Bookmark' : `Add New ${activeTab === 'bookmark' ? 'Bookmark' : 'Memo'}`}
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-all duration-200"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          {/* Tab Navigation */}
          <div className="flex gap-2 mt-4">
            <button
              type="button"
              onClick={() => setActiveTab('bookmark')}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                activeTab === 'bookmark'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              <CustomIcon name="folder1484" size={16} />
              Bookmark
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('memo')}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                activeTab === 'memo'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              <FileText className="w-4 h-4" />
              Memo
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {activeTab === 'bookmark' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-foreground mb-2">
                  <CustomIcon name="mail142" size={16} className="inline mr-2" />
                  URL *
                </label>
                <div className="relative">
                  <input
                    type="url"
                    value={formData.url}
                    onChange={(e) => handleUrlChange(e.target.value)}
                    placeholder="https://example.com"
                    className={`w-full px-4 py-3 bg-background border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 ${
                      realTimeDuplicates.length > 0 && !editingBookmark
                        ? 'border-yellow-500 pr-10'
                        : 'border-input'
                    }`}
                    required
                  />
                  {realTimeDuplicates.length > 0 && !editingBookmark && (
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      <AlertTriangle className="w-5 h-5 text-yellow-500" />
                    </div>
                  )}
                </div>
                {realTimeDuplicates.length > 0 && !editingBookmark && (
                  <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center gap-2 text-yellow-800 text-sm font-medium mb-2">
                      <AlertTriangle className="w-4 h-4" />
                      Similar bookmark{realTimeDuplicates.length > 1 ? 's' : ''} found
                    </div>
                    <div className="space-y-2">
                      {realTimeDuplicates.slice(0, 2).map((duplicate) => (
                        <div key={duplicate.id} className="text-sm text-yellow-700">
                          <div className="font-medium truncate">{duplicate.title}</div>
                          <div className="text-xs text-yellow-600 truncate">{duplicate.url}</div>
                        </div>
                      ))}
                      {realTimeDuplicates.length > 2 && (
                        <div className="text-xs text-yellow-600">
                          +{realTimeDuplicates.length - 2} more similar bookmark{realTimeDuplicates.length - 2 > 1 ? 's' : ''}
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-yellow-600 mt-2">
                      You'll be able to merge or keep both when you submit.
                    </div>
                  </div>
                )}
              </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-foreground mb-2">
                Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter bookmark title"
                className="w-full px-4 py-3 bg-background border border-input rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-foreground mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the bookmark"
                rows={3}
                className="w-full px-4 py-3 bg-background border border-input rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                <CustomIcon name="folder1484" size={16} className="inline mr-2" />
                Category
              </label>
              <div className="relative">
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-3 bg-background border border-input rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 appearance-none cursor-pointer"
                >
                  <option value="Uncategorized">Uncategorized</option>
                  {categories.filter(cat => cat !== 'Uncategorized').map(categoryName => (
                    <option key={categoryName} value={categoryName}>
                      {categoryName}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              <div className="mt-2">
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="Or type a new category name"
                  className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  You can select from existing categories above or type a new one here
                </p>
              </div>
            </div>
            
            <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-foreground mb-2 flex items-center justify-between">
                <span className="flex items-center">
                  <CustomIcon name="folder1484" size={16} className="inline mr-2" />
                  Icon / Favicon
                </span>
                <button
                  type="button"
                  onClick={() => setShowIconSelector(true)}
                  className="text-sm text-primary hover:text-primary/80 underline"
                >
                  Browse All Icons
                </button>
              </label>
              <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2 p-3 border border-input rounded-xl bg-background max-h-48 overflow-y-auto">
                {[
                  { name: 'folder1484', icon: () => <CustomIcon name="folder1484" size={24} />, label: 'Folder' },
                  { name: 'user3296', icon: () => <CustomIcon name="user3296" size={24} />, label: 'User' },
                  { name: 'mail142', icon: () => <CustomIcon name="mail142" size={24} />, label: 'Mail' },
                  { name: 'videoSolidFull', icon: () => <CustomIcon name="videoSolidFull" size={24} />, label: 'Video' },
                  { name: 'movie850', icon: () => <CustomIcon name="movie850" size={24} />, label: 'Movie' },
                  { name: 'newspaperSolidFull', icon: () => <CustomIcon name="newspaperSolidFull" size={24} />, label: 'Newspaper' },
                  { name: 'chart671', icon: () => <CustomIcon name="chart671" size={24} />, label: 'Chart' },
                  { name: 'settings778', icon: () => <CustomIcon name="settings778" size={24} />, label: 'Settings' },
                  { name: 'gear1213', icon: () => <CustomIcon name="gear1213" size={24} />, label: 'Gear' },
                  { name: 'youtubeShortsLogo15250', icon: () => <CustomIcon name="youtubeShortsLogo15250" size={24} />, label: 'YouTube Shorts' },
                  { name: 'facebookMessenger2881', icon: () => <CustomIcon name="facebookMessenger2881" size={24} />, label: 'Facebook Messenger' },
                  { name: 'twitterXLogoBlackRound20851', icon: () => <CustomIcon name="twitterXLogoBlackRound20851" size={24} />, label: 'Twitter X' },
                  { name: 'instagramLogo8869', icon: () => <CustomIcon name="instagramLogo8869" size={24} />, label: 'Instagram' },
                  { name: 'linkedinLogo2430', icon: () => <CustomIcon name="linkedinLogo2430" size={24} />, label: 'LinkedIn' },
                  { name: 'redditLogo2436', icon: () => <CustomIcon name="redditLogo2436" size={24} />, label: 'Reddit' },
                  { name: 'whatsappLogo4456', icon: () => <CustomIcon name="whatsappLogo4456" size={24} />, label: 'WhatsApp' },
                  { name: 'euroCoin2141', icon: () => <CustomIcon name="euroCoin2141" size={24} />, label: 'Euro Coin' },
                  { name: 'bagShoppingSolidFull', icon: () => <CustomIcon name="bagShoppingSolidFull" size={24} />, label: 'Shopping Bag' },
                  { name: 'umbrellaSolidFull', icon: () => <CustomIcon name="umbrellaSolidFull" size={24} />, label: 'Umbrella' },
                  { name: 'subscribe852', icon: () => <CustomIcon name="subscribe852" size={24} />, label: 'Subscribe' },
                  { name: 'userSecretSolidFull', icon: () => <CustomIcon name="userSecretSolidFull" size={24} />, label: 'User Secret' },
                ].map(({ name, icon: IconComponent, label }) => (
                  <button
                    type="button"
                    key={name}
                    title={label}
                    onClick={() => setFormData({ ...formData, favicon: name })}
                    className={`p-2 rounded-lg flex items-center justify-center transition-all duration-150 ease-in-out aspect-square
                      ${formData.favicon === name
                        ? 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2 ring-offset-background'
                        : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                      }`}
                  >
                    <IconComponent />
                  </button>
                ))}
              </div>
            </div>


            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-foreground mb-2">
                <CustomIcon name="user3296" size={16} className="inline mr-2" />
                Tags (comma-separated)
              </label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="react, javascript, web development"
                className="w-full px-4 py-3 bg-background border border-input rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200"
              />
            </div>

            <div className="md:col-span-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isFavorite}
                  onChange={(e) => setFormData({ ...formData, isFavorite: e.target.checked })}
                  className="w-5 h-5 text-primary rounded focus:ring-primary"
                />
                <span className="text-sm font-medium text-foreground">
                  Add to favorites
                </span>
              </label>
            </div>
          </div>
        ) : (
          // Memo Form
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Memo Title *
              </label>
              <input
                type="text"
                value={memoData.title}
                onChange={(e) => setMemoData({ ...memoData, title: e.target.value })}
                placeholder="Enter memo title"
                className="w-full px-4 py-3 bg-background border border-input rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Memo Content
              </label>
              <RichTextEditor
                content={memoData.content}
                onChange={(content) => setMemoData({ ...memoData, content })}
                placeholder="Start writing your memo..."
                className="border border-input rounded-xl overflow-hidden"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  <CustomIcon name="folder1484" size={16} className="inline mr-2" />
                  Category
                </label>
                <select
                  value={memoData.category}
                  onChange={(e) => setMemoData({ ...memoData, category: e.target.value })}
                  className="w-full px-4 py-3 bg-background border border-input rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200"
                >
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  <CustomIcon name="user3296" size={16} className="inline mr-2" />
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={memoData.tags}
                  onChange={(e) => setMemoData({ ...memoData, tags: e.target.value })}
                  placeholder="work, ideas, todo"
                  className="w-full px-4 py-3 bg-background border border-input rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={memoData.isFavorite}
                  onChange={(e) => setMemoData({ ...memoData, isFavorite: e.target.checked })}
                  className="w-5 h-5 text-primary rounded focus:ring-primary"
                />
                <span className="text-sm font-medium text-foreground">
                  Add to favorites
                </span>
              </label>
            </div>
          </div>
        )}

          <div className="flex gap-4 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-border text-foreground rounded-xl hover:bg-muted transition-all duration-200 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-all duration-200 font-medium hover:scale-105 hover:shadow-lg"
            >
              {editingBookmark ? 'Update Bookmark' : `Add ${activeTab === 'bookmark' ? 'Bookmark' : 'Memo'}`}
            </button>
          </div>
        </form>
      </div>

      {/* Icon Selector Modal */}
      <IconSelectorModal
        isOpen={showIconSelector}
        onClose={() => setShowIconSelector(false)}
        onSelectIcon={handleIconSelect}
        currentIcon={formData.favicon}
      />

      {/* Duplicate Warning Modal */}
      {pendingBookmark && (
        <DuplicateWarningModal
          isOpen={showDuplicateWarning}
          onClose={() => setShowDuplicateWarning(false)}
          newBookmark={pendingBookmark}
          duplicates={detectedDuplicates}
          onProceed={handleDuplicateProceed}
          onMerge={handleDuplicateMerge}
          onCancel={handleDuplicateCancel}
        />
      )}
    </div>
  );
};
