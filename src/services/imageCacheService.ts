interface CachedImage {
  id: string;
  originalUrl: string;
  localUrl: string;
  blob: Blob;
  mimeType: string;
  size: number;
  cachedAt: Date;
  expiresAt: Date;
  lastAccessed: Date;
}

interface ImageCacheStats {
  totalImages: number;
  totalSize: number;
  expiredImages: number;
  oldestImage: Date | null;
  newestImage: Date | null;
}

interface ThumbnailOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
}

export class ImageCacheService {
  private cache: Map<string, CachedImage> = new Map();
  private readonly maxCacheSize = 100 * 1024 * 1024; // 100MB
  private readonly defaultExpiration = 7 * 24 * 60 * 60 * 1000; // 7 days
  private readonly maxImageSize = 5 * 1024 * 1024; // 5MB per image
  private readonly supportedFormats = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];

  constructor() {
    this.loadCacheFromStorage();
    this.startCleanupInterval();
  }

  /**
   * Cache an image from URL with optional thumbnail generation
   */
  async cacheImage(
    url: string, 
    generateThumbnail: boolean = true,
    thumbnailOptions: ThumbnailOptions = {}
  ): Promise<string | null> {
    try {
      // Check if already cached and not expired
      const existing = this.getCachedImage(url);
      if (existing) {
        this.updateLastAccessed(url);
        return existing.localUrl;
      }

      // Fetch the image
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type') || '';
      if (!this.supportedFormats.some(format => contentType.includes(format))) {
        throw new Error(`Unsupported image format: ${contentType}`);
      }

      const blob = await response.blob();
      
      // Check size limit
      if (blob.size > this.maxImageSize) {
        throw new Error(`Image too large: ${blob.size} bytes (max: ${this.maxImageSize})`);
      }

      // Generate thumbnail if requested
      const finalBlob = generateThumbnail ? 
        await this.generateThumbnail(blob, thumbnailOptions) : blob;

      // Create cache entry
      const cachedImage: CachedImage = {
        id: this.generateId(),
        originalUrl: url,
        localUrl: URL.createObjectURL(finalBlob),
        blob: finalBlob,
        mimeType: finalBlob.type,
        size: finalBlob.size,
        cachedAt: new Date(),
        expiresAt: new Date(Date.now() + this.defaultExpiration),
        lastAccessed: new Date()
      };

      // Ensure we don't exceed cache size
      await this.ensureCacheSpace(finalBlob.size);

      // Store in cache
      this.cache.set(url, cachedImage);
      this.saveCacheToStorage();

      return cachedImage.localUrl;
    } catch (error) {
      console.warn(`Failed to cache image ${url}:`, error);
      return null;
    }
  }

  /**
   * Get cached image URL if available
   */
  getCachedImage(url: string): CachedImage | null {
    const cached = this.cache.get(url);
    if (!cached || this.isExpired(cached)) {
      if (cached) {
        this.removeCachedImage(url);
      }
      return null;
    }
    return cached;
  }

  /**
   * Get cached image URL or return original URL as fallback
   */
  getImageUrl(url: string): string {
    const cached = this.getCachedImage(url);
    return cached ? cached.localUrl : url;
  }

  /**
   * Generate thumbnail from image blob
   */
  private async generateThumbnail(
    blob: Blob, 
    options: ThumbnailOptions = {}
  ): Promise<Blob> {
    const {
      width = 300,
      height = 200,
      quality = 0.8,
      format = 'jpeg'
    } = options;

    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      img.onload = () => {
        // Calculate dimensions maintaining aspect ratio
        const aspectRatio = img.width / img.height;
        let newWidth = width;
        let newHeight = height;

        if (aspectRatio > width / height) {
          newHeight = width / aspectRatio;
        } else {
          newWidth = height * aspectRatio;
        }

        // Ensure dimensions don't exceed maximums
        newWidth = Math.min(newWidth, width);
        newHeight = Math.min(newHeight, height);

        canvas.width = newWidth;
        canvas.height = newHeight;

        // Clear canvas and draw image
        ctx.clearRect(0, 0, newWidth, newHeight);
        ctx.drawImage(img, 0, 0, newWidth, newHeight);

        // Convert to blob
        canvas.toBlob(
          (thumbnailBlob) => {
            if (thumbnailBlob) {
              resolve(thumbnailBlob);
            } else {
              reject(new Error('Failed to generate thumbnail'));
            }
          },
          `image/${format}`,
          quality
        );
      };

      img.onerror = () => {
        reject(new Error('Failed to load image for thumbnail generation'));
      };

      img.src = URL.createObjectURL(blob);
    });
  }

  /**
   * Remove cached image
   */
  removeCachedImage(url: string): void {
    const cached = this.cache.get(url);
    if (cached) {
      URL.revokeObjectURL(cached.localUrl);
      this.cache.delete(url);
      this.saveCacheToStorage();
    }
  }

  /**
   * Clear expired images from cache
   */
  clearExpiredImages(): number {
    let removedCount = 0;
    const now = new Date();

    for (const [url, cached] of this.cache.entries()) {
      if (this.isExpired(cached)) {
        URL.revokeObjectURL(cached.localUrl);
        this.cache.delete(url);
        removedCount++;
      }
    }

    if (removedCount > 0) {
      this.saveCacheToStorage();
    }

    return removedCount;
  }

  /**
   * Clear all cached images
   */
  clearAllImages(): void {
    for (const cached of this.cache.values()) {
      URL.revokeObjectURL(cached.localUrl);
    }
    this.cache.clear();
    this.saveCacheToStorage();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): ImageCacheStats {
    const images = Array.from(this.cache.values());
    const totalSize = images.reduce((sum, img) => sum + img.size, 0);
    const expiredImages = images.filter(img => this.isExpired(img)).length;
    
    const dates = images.map(img => img.cachedAt);
    const oldestImage = dates.length > 0 ? new Date(Math.min(...dates.map(d => d.getTime()))) : null;
    const newestImage = dates.length > 0 ? new Date(Math.max(...dates.map(d => d.getTime()))) : null;

    return {
      totalImages: images.length,
      totalSize,
      expiredImages,
      oldestImage,
      newestImage
    };
  }

  /**
   * Get formatted cache size
   */
  getFormattedCacheSize(): string {
    const stats = this.getCacheStats();
    return this.formatBytes(stats.totalSize);
  }

  /**
   * Preload images for multiple URLs
   */
  async preloadImages(
    urls: string[], 
    generateThumbnails: boolean = true,
    onProgress?: (completed: number, total: number) => void
  ): Promise<void> {
    let completed = 0;
    const total = urls.length;

    const promises = urls.map(async (url) => {
      try {
        await this.cacheImage(url, generateThumbnails);
      } catch (error) {
        console.warn(`Failed to preload image: ${url}`, error);
      } finally {
        completed++;
        onProgress?.(completed, total);
      }
    });

    await Promise.allSettled(promises);
  }

  private async ensureCacheSpace(requiredSize: number): Promise<void> {
    const currentSize = this.getCurrentCacheSize();
    
    if (currentSize + requiredSize <= this.maxCacheSize) {
      return;
    }

    // Remove expired images first
    this.clearExpiredImages();
    
    // If still not enough space, remove least recently accessed images
    const remainingSize = this.getCurrentCacheSize();
    if (remainingSize + requiredSize > this.maxCacheSize) {
      await this.removeLeastRecentlyUsed(requiredSize);
    }
  }

  private async removeLeastRecentlyUsed(requiredSize: number): Promise<void> {
    const images = Array.from(this.cache.entries())
      .sort(([, a], [, b]) => a.lastAccessed.getTime() - b.lastAccessed.getTime());

    let freedSpace = 0;
    for (const [url, cached] of images) {
      if (freedSpace >= requiredSize) break;
      
      URL.revokeObjectURL(cached.localUrl);
      this.cache.delete(url);
      freedSpace += cached.size;
    }

    this.saveCacheToStorage();
  }

  private getCurrentCacheSize(): number {
    return Array.from(this.cache.values())
      .reduce((sum, cached) => sum + cached.size, 0);
  }

  private updateLastAccessed(url: string): void {
    const cached = this.cache.get(url);
    if (cached) {
      cached.lastAccessed = new Date();
      this.saveCacheToStorage();
    }
  }

  private isExpired(cached: CachedImage): boolean {
    return new Date() > cached.expiresAt;
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  private startCleanupInterval(): void {
    // Clean up expired images every hour
    setInterval(() => {
      this.clearExpiredImages();
    }, 60 * 60 * 1000);
  }

  private loadCacheFromStorage(): void {
    try {
      const cached = localStorage.getItem('imageCacheMetadata');
      if (cached) {
        const metadata = JSON.parse(cached);
        
        // Note: We can't restore blob URLs from localStorage
        // This is just for metadata - actual images need to be re-cached
        // In a real app, you might want to use IndexedDB for blob storage
        console.log('Image cache metadata loaded:', Object.keys(metadata).length, 'entries');
      }
    } catch (error) {
      console.warn('Failed to load image cache metadata:', error);
    }
  }

  private saveCacheToStorage(): void {
    try {
      // Save only metadata (not the actual blobs)
      const metadata: Record<string, Omit<CachedImage, 'blob' | 'localUrl'>> = {};
      
      for (const [url, cached] of this.cache.entries()) {
        metadata[url] = {
          id: cached.id,
          originalUrl: cached.originalUrl,
          mimeType: cached.mimeType,
          size: cached.size,
          cachedAt: cached.cachedAt,
          expiresAt: cached.expiresAt,
          lastAccessed: cached.lastAccessed
        };
      }
      
      localStorage.setItem('imageCacheMetadata', JSON.stringify(metadata));
    } catch (error) {
      console.warn('Failed to save image cache metadata:', error);
    }
  }
}

// Export singleton instance
export const imageCacheService = new ImageCacheService();