import React, { useState, useMemo } from 'react';
import { Plus, Search, Filter, Grid, List, Star, FileText, Trash2, Edit } from 'lucide-react';
import type { Memo } from '@/types/bookmark';
import { MemoCard } from './MemoCard';
import { MemoModal } from './MemoModal';
import { ConfirmationModal } from './ConfirmationModal';

interface MemoViewProps {
  memos: Memo[];
  categories: string[];
  onAddMemo: (memo: Omit<Memo, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateMemo: (memoId: string, updates: Partial<Omit<Memo, 'id' | 'createdAt'>>) => void;
  onDeleteMemo: (memoId: string) => void;
  onToggleFavorite: (memoId: string) => void;
}

export const MemoView: React.FC<MemoViewProps> = ({
  memos,
  categories,
  onAddMemo,
  onUpdateMemo,
  onDeleteMemo,
  onToggleFavorite
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isMemoModalOpen, setIsMemoModalOpen] = useState(false);
  const [editingMemo, setEditingMemo] = useState<Memo | undefined>();
  const [deleteMemoId, setDeleteMemoId] = useState<string | null>(null);

  // Filter memos based on search, category, and favorites
  const filteredMemos = useMemo(() => {
    return memos.filter(memo => {
      const matchesSearch = searchQuery === '' || 
        memo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        memo.content.some(block => block.content.toLowerCase().includes(searchQuery.toLowerCase())) ||
        memo.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory = selectedCategory === 'all' || memo.category === selectedCategory;
      const matchesFavorites = !showFavoritesOnly || memo.isFavorite;

      return matchesSearch && matchesCategory && matchesFavorites;
    });
  }, [memos, searchQuery, selectedCategory, showFavoritesOnly]);

  const handleAddMemo = () => {
    setEditingMemo(undefined);
    setIsMemoModalOpen(true);
  };

  const handleEditMemo = (memo: Memo) => {
    setEditingMemo(memo);
    setIsMemoModalOpen(true);
  };

  const handleSaveMemo = (memoData: Omit<Memo, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingMemo) {
      onUpdateMemo(editingMemo.id, memoData);
    } else {
      onAddMemo(memoData);
    }
    setIsMemoModalOpen(false);
  };

  const handleDeleteMemo = (memoId: string) => {
    setDeleteMemoId(memoId);
  };

  const confirmDelete = () => {
    if (deleteMemoId) {
      onDeleteMemo(deleteMemoId);
      setDeleteMemoId(null);
    }
  };

  const getMemoStats = () => {
    const total = memos.length;
    const favorites = memos.filter(memo => memo.isFavorite).length;
    const withGrid = memos.filter(memo => memo.gridBackground).length;
    const categories = new Set(memos.map(memo => memo.category)).size;

    return { total, favorites, withGrid, categories };
  };

  const stats = getMemoStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <FileText className="w-8 h-8 text-primary" />
            Memos
          </h1>
          <p className="text-muted-foreground mt-1">
            {stats.total} memos • {stats.favorites} favorites • {stats.categories} categories
          </p>
        </div>
        
        <button
          onClick={handleAddMemo}
          className="px-6 py-3 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-all duration-200 font-medium hover:scale-105 hover:shadow-lg flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          New Memo
        </button>
      </div>

      {/* Filters and Search */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <input
                type="text"
                placeholder="Search memos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200"
              />
            </div>
          </div>

          {/* Category Filter */}
          <div className="lg:w-48">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all duration-200 ${
                viewMode === 'grid'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all duration-200 ${
                viewMode === 'list'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Additional Filters */}
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showFavoritesOnly}
              onChange={(e) => setShowFavoritesOnly(e.target.checked)}
              className="w-4 h-4 text-primary rounded focus:ring-primary"
            />
            <Star className="w-4 h-4 text-yellow-500" />
            <span className="text-sm font-medium text-foreground">
              Favorites only
            </span>
          </label>
        </div>
      </div>

      {/* Results */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground">
            {filteredMemos.length} memo{filteredMemos.length !== 1 ? 's' : ''} found
          </p>
        </div>

        {/* Memo Grid/List */}
        {filteredMemos.length > 0 ? (
          <div className={
            viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
              : 'space-y-4'
          }>
            {filteredMemos.map(memo => (
              <MemoCard
                key={memo.id}
                memo={memo}
                onEdit={handleEditMemo}
                onDelete={handleDeleteMemo}
                onToggleFavorite={onToggleFavorite}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {searchQuery || selectedCategory !== 'all' || showFavoritesOnly 
                ? 'No memos found' 
                : 'No memos yet'
              }
            </h3>
            <p className="text-muted-foreground mb-6">
              {searchQuery || selectedCategory !== 'all' || showFavoritesOnly
                ? 'Try adjusting your search or filters'
                : 'Create your first memo to get started'
              }
            </p>
            {!searchQuery && selectedCategory === 'all' && !showFavoritesOnly && (
              <button
                onClick={handleAddMemo}
                className="px-6 py-3 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-all duration-200 font-medium"
              >
                Create First Memo
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <MemoModal
        isOpen={isMemoModalOpen}
        onClose={() => setIsMemoModalOpen(false)}
        onSave={handleSaveMemo}
        editingMemo={editingMemo}
        categories={categories}
      />

              <ConfirmationModal
          isOpen={!!deleteMemoId}
          onClose={() => setDeleteMemoId(null)}
          onConfirm={confirmDelete}
          title="Delete Memo"
          message="Are you sure you want to delete this memo? This action cannot be undone."
          confirmText="Delete"
          isDestructive={true}
        />
    </div>
  );
}; 