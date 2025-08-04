import React, { useState, useEffect, useRef } from 'react';
import { X, Save, Star, Grid, FileText } from 'lucide-react';
import { 
  CustomIcon, 
  FolderIcon, 
  UserIcon, 
  SettingsIcon 
} from '@/lib/customIcons';
import type { Memo, MemoContent } from '@/types/bookmark';
import { RichTextEditor } from './RichTextEditor';

interface MemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (memo: Omit<Memo, 'id' | 'createdAt' | 'updatedAt'>) => void;
  editingMemo?: Memo;
  categories: string[];
}

const initialMemoState = {
  title: '',
  content: [] as MemoContent[],
  backgroundColor: '#ffffff',
  gridBackground: false,
  tags: '',
  isFavorite: false,
  category: 'Uncategorized'
};

const backgroundColors = [
  '#ffffff', '#fefefe', '#fafafa', '#f5f5f5', '#f0f0f0',
  '#fff8e1', '#fff3e0', '#fce4ec', '#f3e5f5', '#e8eaf6',
  '#e3f2fd', '#e0f2f1', '#e8f5e8', '#fffde7', '#f9f9f9'
];

export const MemoModal: React.FC<MemoModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingMemo,
  categories
}) => {
  const [memoData, setMemoData] = useState(initialMemoState);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const prevIsOpenRef = useRef(isOpen);

  useEffect(() => {
    const isOpening = isOpen && !prevIsOpenRef.current;

    if (isOpening) {
      if (editingMemo) {
        setMemoData({
          title: editingMemo.title || '',
          content: editingMemo.content || [],
          backgroundColor: editingMemo.backgroundColor || '#ffffff',
          gridBackground: editingMemo.gridBackground || false,
          tags: editingMemo.tags.join(', ') || '',
          isFavorite: editingMemo.isFavorite || false,
          category: editingMemo.category || 'Uncategorized'
        });
      } else {
        setMemoData({
          ...initialMemoState,
          category: categories.length > 0 ? categories[0] : 'Uncategorized'
        });
      }
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, editingMemo, categories]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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

    onSave(memoPayload);
    onClose();
  };

  const handleContentChange = (content: MemoContent[]) => {
    setMemoData(prev => ({ ...prev, content }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card text-card-foreground rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              {editingMemo ? 'Edit Memo' : 'Create New Memo'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-all duration-200"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main content area */}
            <div className="lg:col-span-2 space-y-6">
              {/* Title */}
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

              {/* Rich Text Editor */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Memo Content
                </label>
                <div 
                  className="border border-input rounded-xl overflow-hidden"
                  style={{
                    backgroundColor: memoData.backgroundColor,
                    backgroundImage: memoData.gridBackground 
                      ? `linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
                         linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)`
                      : 'none',
                    backgroundSize: memoData.gridBackground ? '20px 20px' : 'auto'
                  }}
                >
                  <RichTextEditor
                    content={memoData.content}
                    onChange={handleContentChange}
                    placeholder="Start writing your memo..."
                    className="bg-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Sidebar settings */}
            <div className="space-y-6">
              {/* Background Settings */}
              <div className="bg-muted/50 rounded-xl p-4">
                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <CustomIcon name="settings" size={16} />
                  Background
                </h3>
                
                {/* Background Color */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Background Color
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {backgroundColors.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setMemoData({ ...memoData, backgroundColor: color })}
                        className={`w-8 h-8 rounded-lg border-2 transition-all duration-200 ${
                          memoData.backgroundColor === color
                            ? 'border-primary ring-2 ring-primary ring-offset-2'
                            : 'border-border hover:border-primary'
                        }`}
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>

                {/* Grid Background Toggle */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Grid className="w-4 h-4" />
                    <span className="text-sm font-medium text-foreground">
                      Grid Background
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setMemoData({ ...memoData, gridBackground: !memoData.gridBackground })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      memoData.gridBackground ? 'bg-primary' : 'bg-muted'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        memoData.gridBackground ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Category */}
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

              {/* Tags */}
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

              {/* Favorite Toggle */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Star className="w-4 h-4" />
                  <span className="text-sm font-medium text-foreground">
                    Add to favorites
                  </span>
                </label>
                <button
                  type="button"
                  onClick={() => setMemoData({ ...memoData, isFavorite: !memoData.isFavorite })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    memoData.isFavorite ? 'bg-yellow-500' : 'bg-muted'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      memoData.isFavorite ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Preview */}
              <div className="bg-muted/50 rounded-xl p-4">
                <h3 className="font-semibold text-foreground mb-3">Preview</h3>
                <div 
                  className="w-full h-32 rounded-lg border border-border p-3 overflow-hidden"
                  style={{
                    backgroundColor: memoData.backgroundColor,
                    backgroundImage: memoData.gridBackground 
                      ? `linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
                         linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)`
                      : 'none',
                    backgroundSize: memoData.gridBackground ? '20px 20px' : 'auto'
                  }}
                >
                  <div className="text-sm text-foreground/70 truncate">
                    {memoData.title || 'Memo Title'}
                  </div>
                  <div className="text-xs text-foreground/50 mt-1 line-clamp-3">
                    {memoData.content.length > 0 
                      ? memoData.content.map(block => block.content).join(' ').substring(0, 100) + '...'
                      : 'Start writing your memo...'
                    }
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-4 pt-6 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-border text-foreground rounded-xl hover:bg-muted transition-all duration-200 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-all duration-200 font-medium hover:scale-105 hover:shadow-lg flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              {editingMemo ? 'Update Memo' : 'Save Memo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}; 