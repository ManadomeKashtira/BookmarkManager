import { useState, useEffect, useCallback } from 'react';
import { previewService } from '../services/previewService';
import { LinkPreview, PreviewGenerationResult } from '../types/linkPreview';

interface UseLinkPreviewOptions {
  autoGenerate?: boolean;
  cacheFirst?: boolean;
}

interface UseLinkPreviewReturn {
  preview: LinkPreview | null;
  isLoading: boolean;
  error: string | null;
  fromCache: boolean;
  generatePreview: () => Promise<void>;
  refreshPreview: () => Promise<void>;
  clearError: () => void;
}

export function useLinkPreview(
  url: string | null,
  options: UseLinkPreviewOptions = {}
): UseLinkPreviewReturn {
  const { autoGenerate = false, cacheFirst = true } = options;
  
  const [preview, setPreview] = useState<LinkPreview | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fromCache, setFromCache] = useState(false);

  const generatePreview = useCallback(async () => {
    if (!url) return;

    console.log('useLinkPreview: Starting preview generation for', url);
    setIsLoading(true);
    setError(null);

    try {
      const result: PreviewGenerationResult = await previewService.generatePreview(url);
      
      console.log('useLinkPreview: Preview generation result for', url, result);
      setPreview(result.preview);
      setFromCache(result.fromCache);
      
      if (result.error) {
        setError(result.error);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate preview';
      console.error('useLinkPreview: Preview generation failed for', url, err);
      setError(errorMessage);
      setPreview(null);
      setFromCache(false);
    } finally {
      setIsLoading(false);
    }
  }, [url]);

  const refreshPreview = useCallback(async () => {
    if (!url) return;

    setIsLoading(true);
    setError(null);

    try {
      const result: PreviewGenerationResult = await previewService.refreshPreview(url);
      
      setPreview(result.preview);
      setFromCache(false); // Always false for refresh
      
      if (result.error) {
        setError(result.error);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh preview';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [url]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Check cache first if enabled
  useEffect(() => {
    if (!url) {
      setPreview(null);
      setFromCache(false);
      return;
    }

    if (cacheFirst) {
      const cachedPreview = previewService.getCachedPreview(url);
      if (cachedPreview) {
        setPreview(cachedPreview);
        setFromCache(true);
        return;
      }
    }

    // Auto-generate if enabled and no cache
    if (autoGenerate) {
      generatePreview();
    }
  }, [url, cacheFirst, autoGenerate, generatePreview]);

  return {
    preview,
    isLoading,
    error,
    fromCache,
    generatePreview,
    refreshPreview,
    clearError,
  };
}

// Hook for managing multiple previews
export function useMultipleLinkPreviews(urls: string[]) {
  const [previews, setPreviews] = useState<Record<string, LinkPreview | null>>({});
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string | null>>({});

  const generatePreview = useCallback(async (url: string) => {
    setLoadingStates(prev => ({ ...prev, [url]: true }));
    setErrors(prev => ({ ...prev, [url]: null }));

    try {
      const result = await previewService.generatePreview(url);
      setPreviews(prev => ({ ...prev, [url]: result.preview }));
      
      if (result.error) {
        setErrors(prev => ({ ...prev, [url]: result.error! }));
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate preview';
      setErrors(prev => ({ ...prev, [url]: errorMessage }));
      setPreviews(prev => ({ ...prev, [url]: null }));
    } finally {
      setLoadingStates(prev => ({ ...prev, [url]: false }));
    }
  }, []);

  const generateAllPreviews = useCallback(async () => {
    const promises = urls.map(url => generatePreview(url));
    await Promise.allSettled(promises);
  }, [urls, generatePreview]);

  // Initialize previews from cache
  useEffect(() => {
    const initialPreviews: Record<string, LinkPreview | null> = {};
    const initialLoading: Record<string, boolean> = {};
    const initialErrors: Record<string, string | null> = {};

    urls.forEach(url => {
      const cached = previewService.getCachedPreview(url);
      initialPreviews[url] = cached;
      initialLoading[url] = false;
      initialErrors[url] = null;
    });

    setPreviews(initialPreviews);
    setLoadingStates(initialLoading);
    setErrors(initialErrors);
  }, [urls]);

  return {
    previews,
    loadingStates,
    errors,
    generatePreview,
    generateAllPreviews,
  };
}