import { 
  LinkPreview, 
  OpenGraphData, 
  TwitterCardData, 
  PreviewGenerationOptions, 
  PreviewCache, 
  PreviewGenerationResult 
} from '../types/linkPreview';
import { imageCacheService } from './imageCacheService';
import { previewServiceProxy } from './previewServiceProxy';

export class PreviewService {
  private cache: PreviewCache = {};
  private readonly defaultOptions: PreviewGenerationOptions = {
    timeout: 10000, // 10 seconds
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    followRedirects: true,
    maxRedirects: 5,
    cacheExpiration: 24 * 60 * 60 * 1000, // 24 hours
  };

  constructor() {
    this.loadCacheFromStorage();
  }

  /**
   * Generate a preview for a given URL
   */
  async generatePreview(
    url: string, 
    options: Partial<PreviewGenerationOptions> = {}
  ): Promise<PreviewGenerationResult> {
    const mergedOptions = { ...this.defaultOptions, ...options };
    
    console.log('PreviewService: Generating preview for', url);
    
    try {
      // Check cache first
      const cachedPreview = this.getCachedPreview(url);
      if (cachedPreview && !this.isExpired(cachedPreview)) {
        console.log('PreviewService: Using cached preview for', url);
        return {
          preview: cachedPreview,
          fromCache: true
        };
      }

      // Try to generate new preview, fallback to proxy service if needed
      let preview: LinkPreview;
      
      try {
        console.log('PreviewService: Attempting direct fetch for', url);
        preview = await this.fetchPreviewData(url, mergedOptions);
        console.log('PreviewService: Direct fetch successful for', url);
      } catch (error) {
        console.warn('PreviewService: Direct preview generation failed, trying proxy service:', error);
        const proxyResult = await previewServiceProxy.generatePreview(url, mergedOptions);
        if (!proxyResult.preview) {
          throw new Error('Both direct and proxy preview generation failed');
        }
        preview = proxyResult.preview;
        console.log('PreviewService: Proxy fetch successful for', url);
      }
      
      // Cache the result
      this.cachePreview(preview);
      
      return {
        preview,
        fromCache: false
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Create failed preview
      const failedPreview: LinkPreview = {
        id: this.generateId(),
        url,
        title: this.extractDomainFromUrl(url),
        description: 'Failed to generate preview',
        generatedAt: new Date(),
        expiresAt: new Date(Date.now() + mergedOptions.cacheExpiration!),
        status: 'failed',
        errorMessage
      };

      return {
        preview: failedPreview,
        fromCache: false,
        error: errorMessage
      };
    }
  }

  /**
   * Refresh an existing preview
   */
  async refreshPreview(url: string): Promise<PreviewGenerationResult> {
    // Remove from cache to force refresh
    delete this.cache[url];
    return this.generatePreview(url);
  }

  /**
   * Get cached preview if available and not expired
   */
  getCachedPreview(url: string): LinkPreview | null {
    const cached = this.cache[url];
    if (!cached || this.isExpired(cached)) {
      return null;
    }
    return cached;
  }

  /**
   * Clear expired previews from cache
   */
  clearExpiredPreviews(): void {
    const now = new Date();
    Object.keys(this.cache).forEach(url => {
      if (this.isExpired(this.cache[url])) {
        delete this.cache[url];
      }
    });
    this.saveCacheToStorage();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { total: number; expired: number; size: string } {
    const total = Object.keys(this.cache).length;
    const expired = Object.values(this.cache).filter(preview => this.isExpired(preview)).length;
    const size = this.estimateCacheSize();
    
    return { total, expired, size };
  }

  /**
   * Clear all cached previews
   */
  clearCache(): void {
    this.cache = {};
    this.saveCacheToStorage();
  }

  /**
   * Clear all cached images
   */
  clearImageCache(): void {
    imageCacheService.clearAllImages();
  }

  /**
   * Get image cache statistics
   */
  getImageCacheStats() {
    return imageCacheService.getCacheStats();
  }

  /**
   * Preload images for multiple previews
   */
  async preloadPreviewImages(
    previews: LinkPreview[],
    onProgress?: (completed: number, total: number) => void
  ): Promise<void> {
    const imageUrls = previews
      .map(preview => [preview.image, preview.favicon])
      .flat()
      .filter((url): url is string => Boolean(url));

    await imageCacheService.preloadImages(imageUrls, true, onProgress);
  }

  private async fetchPreviewData(
    url: string, 
    options: PreviewGenerationOptions
  ): Promise<LinkPreview> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), options.timeout);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': options.userAgent!,
        },
        redirect: options.followRedirects ? 'follow' : 'manual',
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('text/html')) {
        throw new Error('URL does not point to an HTML page');
      }

      const html = await response.text();
      const preview = await this.parseHtmlForPreview(url, html);
      
      return preview;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  private async parseHtmlForPreview(url: string, html: string): Promise<LinkPreview> {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Extract Open Graph data
    const ogData = this.extractOpenGraphData(doc);
    
    // Extract Twitter Card data
    const twitterData = this.extractTwitterCardData(doc);
    
    // Extract basic HTML data as fallback
    const htmlData = this.extractBasicHtmlData(doc);

    // Combine data with priority: Open Graph > Twitter Card > HTML
    const title = ogData.title || twitterData.title || htmlData.title || this.extractDomainFromUrl(url);
    const description = ogData.description || twitterData.description || htmlData.description || '';
    const imageUrl = ogData.image || twitterData.image || htmlData.image;
    const siteName = ogData.siteName || twitterData.site || htmlData.siteName;
    const faviconUrl = htmlData.favicon;

    // Cache images if available
    let cachedImageUrl: string | undefined;
    let cachedFaviconUrl: string | undefined;

    if (imageUrl) {
      const resolvedImageUrl = this.resolveUrl(imageUrl, url);
      const cached = await imageCacheService.cacheImage(resolvedImageUrl, true, {
        width: 400,
        height: 300,
        quality: 0.8
      });
      cachedImageUrl = cached || resolvedImageUrl;
    }

    if (faviconUrl) {
      const resolvedFaviconUrl = this.resolveUrl(faviconUrl, url);
      const cached = await imageCacheService.cacheImage(resolvedFaviconUrl, true, {
        width: 32,
        height: 32,
        quality: 0.9
      });
      cachedFaviconUrl = cached || resolvedFaviconUrl;
    }

    const preview: LinkPreview = {
      id: this.generateId(),
      url,
      title: this.sanitizeText(title),
      description: this.sanitizeText(description),
      image: cachedImageUrl,
      siteName: siteName ? this.sanitizeText(siteName) : undefined,
      favicon: cachedFaviconUrl,
      generatedAt: new Date(),
      expiresAt: new Date(Date.now() + this.defaultOptions.cacheExpiration!),
      status: 'success'
    };

    return preview;
  }

  private extractOpenGraphData(doc: Document): OpenGraphData {
    const ogTags = doc.querySelectorAll('meta[property^="og:"]');
    const data: OpenGraphData = {};

    ogTags.forEach(tag => {
      const property = tag.getAttribute('property');
      const content = tag.getAttribute('content');
      
      if (!property || !content) return;

      switch (property) {
        case 'og:title':
          data.title = content;
          break;
        case 'og:description':
          data.description = content;
          break;
        case 'og:image':
          data.image = content;
          break;
        case 'og:site_name':
          data.siteName = content;
          break;
        case 'og:type':
          data.type = content;
          break;
        case 'og:url':
          data.url = content;
          break;
      }
    });

    return data;
  }

  private extractTwitterCardData(doc: Document): TwitterCardData {
    const twitterTags = doc.querySelectorAll('meta[name^="twitter:"]');
    const data: TwitterCardData = {};

    twitterTags.forEach(tag => {
      const name = tag.getAttribute('name');
      const content = tag.getAttribute('content');
      
      if (!name || !content) return;

      switch (name) {
        case 'twitter:title':
          data.title = content;
          break;
        case 'twitter:description':
          data.description = content;
          break;
        case 'twitter:image':
          data.image = content;
          break;
        case 'twitter:site':
          data.site = content;
          break;
        case 'twitter:creator':
          data.creator = content;
          break;
        case 'twitter:card':
          data.card = content;
          break;
      }
    });

    return data;
  }

  private extractBasicHtmlData(doc: Document) {
    // Title
    const titleElement = doc.querySelector('title');
    const title = titleElement?.textContent?.trim() || '';

    // Description
    const descriptionMeta = doc.querySelector('meta[name="description"]');
    const description = descriptionMeta?.getAttribute('content')?.trim() || '';

    // Image (first img tag as fallback)
    const firstImg = doc.querySelector('img[src]');
    const image = firstImg?.getAttribute('src') || undefined;

    // Site name (try to extract from title or domain)
    const siteName = this.extractSiteNameFromTitle(title);

    // Favicon
    const faviconLink = doc.querySelector('link[rel*="icon"]') as HTMLLinkElement;
    const favicon = faviconLink?.href || '/favicon.ico';

    return {
      title,
      description,
      image,
      siteName,
      favicon
    };
  }

  private extractSiteNameFromTitle(title: string): string | undefined {
    // Common patterns: "Page Title | Site Name" or "Page Title - Site Name"
    const separators = [' | ', ' - ', ' • ', ' :: '];
    
    for (const separator of separators) {
      if (title.includes(separator)) {
        const parts = title.split(separator);
        if (parts.length > 1) {
          return parts[parts.length - 1].trim();
        }
      }
    }
    
    return undefined;
  }

  private extractDomainFromUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace('www.', '');
    } catch {
      return url;
    }
  }

  private resolveUrl(relativeUrl: string, baseUrl: string): string {
    try {
      return new URL(relativeUrl, baseUrl).href;
    } catch {
      return relativeUrl;
    }
  }

  private sanitizeText(text: string): string {
    return text
      .replace(/\s+/g, ' ') // Replace multiple whitespace with single space
      .trim()
      .substring(0, 500); // Limit length
  }

  private isExpired(preview: LinkPreview): boolean {
    return new Date() > preview.expiresAt;
  }

  private cachePreview(preview: LinkPreview): void {
    this.cache[preview.url] = preview;
    this.saveCacheToStorage();
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private loadCacheFromStorage(): void {
    try {
      const cached = localStorage.getItem('linkPreviewCache');
      if (cached) {
        const parsedCache = JSON.parse(cached);
        // Convert date strings back to Date objects
        Object.values(parsedCache).forEach((preview: any) => {
          preview.generatedAt = new Date(preview.generatedAt);
          preview.expiresAt = new Date(preview.expiresAt);
        });
        this.cache = parsedCache;
      }
    } catch (error) {
      console.warn('Failed to load preview cache from storage:', error);
      this.cache = {};
    }
  }

  private saveCacheToStorage(): void {
    try {
      localStorage.setItem('linkPreviewCache', JSON.stringify(this.cache));
    } catch (error) {
      console.warn('Failed to save preview cache to storage:', error);
    }
  }

  private estimateCacheSize(): string {
    const jsonString = JSON.stringify(this.cache);
    const bytes = new Blob([jsonString]).size;
    
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}

// Export singleton instance
export const previewService = new PreviewService();