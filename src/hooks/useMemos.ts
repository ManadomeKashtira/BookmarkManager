import { useState, useEffect, useCallback } from 'react';
import type { Memo, MemoContent } from '@/types/bookmark';

const MEMOS_STORAGE_KEY = 'bookmark-manager-memos';

export const useMemos = () => {
  const [memos, setMemos] = useState<Memo[]>([]);
  const [loading, setLoading] = useState(true);

  // Load memos from localStorage on mount
  useEffect(() => {
    try {
      const storedMemos = localStorage.getItem(MEMOS_STORAGE_KEY);
      if (storedMemos) {
        const parsedMemos = JSON.parse(storedMemos).map((memo: any) => ({
          ...memo,
          createdAt: new Date(memo.createdAt),
          updatedAt: new Date(memo.updatedAt)
        }));
        setMemos(parsedMemos);
      }
    } catch (error) {
      console.error('Failed to load memos from localStorage:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Save memos to localStorage whenever memos change
  useEffect(() => {
    if (!loading) {
      try {
        localStorage.setItem(MEMOS_STORAGE_KEY, JSON.stringify(memos));
      } catch (error) {
        console.error('Failed to save memos to localStorage:', error);
      }
    }
  }, [memos, loading]);

  const addMemo = useCallback((memoData: Omit<Memo, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newMemo: Memo = {
      ...memoData,
      id: `memo-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    setMemos(prev => [newMemo, ...prev]);
    return newMemo;
  }, []);

  const updateMemo = useCallback((memoId: string, updates: Partial<Omit<Memo, 'id' | 'createdAt'>>) => {
    setMemos(prev => prev.map(memo => 
      memo.id === memoId 
        ? { ...memo, ...updates, updatedAt: new Date() }
        : memo
    ));
  }, []);

  const deleteMemo = useCallback((memoId: string) => {
    setMemos(prev => prev.filter(memo => memo.id !== memoId));
  }, []);

  const toggleFavorite = useCallback((memoId: string) => {
    setMemos(prev => prev.map(memo => 
      memo.id === memoId 
        ? { ...memo, isFavorite: !memo.isFavorite, updatedAt: new Date() }
        : memo
    ));
  }, []);

  const getMemosByCategory = useCallback((category: string) => {
    return memos.filter(memo => memo.category === category);
  }, [memos]);

  const getFavoriteMemos = useCallback(() => {
    return memos.filter(memo => memo.isFavorite);
  }, [memos]);

  const searchMemos = useCallback((query: string) => {
    const lowercaseQuery = query.toLowerCase();
    return memos.filter(memo => 
      memo.title.toLowerCase().includes(lowercaseQuery) ||
      memo.content.some(block => block.content.toLowerCase().includes(lowercaseQuery)) ||
      memo.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery)) ||
      memo.category?.toLowerCase().includes(lowercaseQuery)
    );
  }, [memos]);

  const getMemosByTag = useCallback((tag: string) => {
    return memos.filter(memo => memo.tags.includes(tag));
  }, [memos]);

  const getMemoStats = useCallback(() => {
    const total = memos.length;
    const favorites = memos.filter(memo => memo.isFavorite).length;
    const categories = new Set(memos.map(memo => memo.category)).size;
    const tags = new Set(memos.flatMap(memo => memo.tags)).size;
    const withGrid = memos.filter(memo => memo.gridBackground).length;

    return {
      total,
      favorites,
      categories,
      tags,
      withGrid,
      withoutGrid: total - withGrid
    };
  }, [memos]);

  const exportMemos = useCallback(() => {
    return {
      memos,
      exportDate: new Date().toISOString(),
      version: '1.0.0',
      stats: {
        total: memos.length,
        categories: new Set(memos.map(memo => memo.category)).size,
        tags: new Set(memos.flatMap(memo => memo.tags)).size
      }
    };
  }, [memos]);

  const importMemos = useCallback((importedMemos: Memo[]) => {
    const processedMemos = importedMemos.map(memo => ({
      ...memo,
      id: memo.id || `memo-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      createdAt: new Date(memo.createdAt),
      updatedAt: new Date(memo.updatedAt)
    }));

    setMemos(prev => [...prev, ...processedMemos]);
    return processedMemos.length;
  }, []);

  const clearAllMemos = useCallback(() => {
    setMemos([]);
  }, []);

  return {
    memos,
    loading,
    addMemo,
    updateMemo,
    deleteMemo,
    toggleFavorite,
    getMemosByCategory,
    getFavoriteMemos,
    searchMemos,
    getMemosByTag,
    getMemoStats,
    exportMemos,
    importMemos,
    clearAllMemos
  };
}; 