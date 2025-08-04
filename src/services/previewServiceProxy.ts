import { 
  LinkPreview, 
  PreviewGenerationOptions, 
  PreviewGenerationResult 
} from '../types/linkPreview';

/**
 * CORS-friendly preview service that uses a proxy or fallback methods
 * when direct fetching is blocked by CORS policies
 */
export class PreviewServiceProxy {
  private readonly defaultOptions: PreviewGenerationOptions = {
    timeout: 10000,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    followRedirects: true,
    maxRedirects: 5,
    cacheExpiration: 24 * 60 * 60 * 1000, // 24 hours
  };

  /**
   * Generate preview using CORS-friendly methods
   */
  async generatePreview(
    url: string, 
    options: Partial<PreviewGenerationOptions> = {}
  ): Promise<PreviewGenerationResult> {
    const mergedOptions = { ...this.defaultOptions, ...options };
    
    try {
      // Try different methods in order of preference
      const methods = [
        () => this.tryDirectFetch(url, mergedOptions),
        () => this.tryProxyFetch(url, mergedOptions),
        () => this.generateFallbackPreview(url)
      ];

      for (const method of methods) {
        try {
          const result = await method();
          if (result.preview) {
            return result;
          }
        } catch (error) {
          console.warn('Preview method failed:', error);
          continue;
        }
      }

      // If all methods fail, return fallback
      return this.generateFallbackPreview(url);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
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
   * Try direct fetch (will fail due to CORS in most cases)
   */
  private async tryDirectFetch(
    url: string, 
    options: PreviewGenerationOptions
  ): Promise<PreviewGenerationResult> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), options.timeout);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': options.userAgent!,
        },
        redirect: options.followRedirects ? 'follow' : 'manual',
        mode: 'cors' // This will likely fail due to CORS
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();
      const preview = this.parseHtmlForPreview(url, html);
      
      return {
        preview,
        fromCache: false
      };
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Try using a CORS proxy service
   */
  private async tryProxyFetch(
    url: string, 
    options: PreviewGenerationOptions
  ): Promise<PreviewGenerationResult> {
    // List of public CORS proxy services (use with caution in production)
    const proxies = [
      `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
      `https://corsproxy.io/?${encodeURIComponent(url)}`,
      `https://cors-anywhere.herokuapp.com/${url}` // Note: This requires requesting access
    ];

    for (const proxyUrl of proxies) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), options.timeout);

        const response = await fetch(proxyUrl, {
          signal: controller.signal,
          headers: {
            'User-Agent': options.userAgent!,
          }
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          continue; // Try next proxy
        }

        let html: string;
        
        // Handle different proxy response formats
        if (proxyUrl.includes('allorigins.win')) {
          const data = await response.json();
          html = data.contents;
        } else {
          html = await response.text();
        }

        const preview = this.parseHtmlForPreview(url, html);
        
        return {
          preview,
          fromCache: false
        };
      } catch (error) {
        console.warn(`Proxy ${proxyUrl} failed:`, error);
        continue;
      }
    }

    throw new Error('All proxy methods failed');
  }

  /**
   * Generate a basic preview from URL analysis
   */
  private async generateFallbackPreview(url: string): Promise<PreviewGenerationResult> {
    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname.replace('www.', '');
      
      // Try to get favicon from common locations
      const faviconUrls = [
        `${urlObj.protocol}//${urlObj.hostname}/favicon.ico`,
        `${urlObj.protocol}//${urlObj.hostname}/favicon.png`,
        `${urlObj.protocol}//${urlObj.hostname}/apple-touch-icon.png`
      ];

      let favicon: string | undefined;
      for (const faviconUrl of faviconUrls) {
        try {
          const response = await fetch(faviconUrl, { method: 'HEAD' });
          if (response.ok) {
            favicon = faviconUrl;
            break;
          }
        } catch {
          continue;
        }
      }

      const preview: LinkPreview = {
        id: this.generateId(),
        url,
        title: this.generateTitleFromUrl(url),
        description: `Visit ${domain}`,
        siteName: domain,
        favicon,
        generatedAt: new Date(),
        expiresAt: new Date(Date.now() + this.defaultOptions.cacheExpiration!),
        status: 'success'
      };

      return {
        preview,
        fromCache: false
      };
    } catch (error) {
      throw new Error('Fallback preview generation failed');
    }
  }

  private parseHtmlForPreview(url: string, html: string): LinkPreview {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Extract Open Graph data
    const ogTitle = doc.querySelector('meta[property="og:title"]')?.getAttribute('content');
    const ogDescription = doc.querySelector('meta[property="og:description"]')?.getAttribute('content');
    const ogImage = doc.querySelector('meta[property="og:image"]')?.getAttribute('content');
    const ogSiteName = doc.querySelector('meta[property="og:site_name"]')?.getAttribute('content');

    // Extract Twitter Card data
    const twitterTitle = doc.querySelector('meta[name="twitter:title"]')?.getAttribute('content');
    const twitterDescription = doc.querySelector('meta[name="twitter:description"]')?.getAttribute('content');
    const twitterImage = doc.querySelector('meta[name="twitter:image"]')?.getAttribute('content');

    // Extract basic HTML data
    const htmlTitle = doc.querySelector('title')?.textContent?.trim();
    const htmlDescription = doc.querySelector('meta[name="description"]')?.getAttribute('content')?.trim();
    const faviconLink = doc.querySelector('link[rel*="icon"]') as HTMLLinkElement;
    const favicon = faviconLink?.href;

    // Combine data with priority: Open Graph > Twitter Card > HTML
    const title = ogTitle || twitterTitle || htmlTitle || this.generateTitleFromUrl(url);
    const description = ogDescription || twitterDescription || htmlDescription || '';
    const image = ogImage || twitterImage;
    const siteName = ogSiteName || this.extractDomainFromUrl(url);

    const preview: LinkPreview = {
      id: this.generateId(),
      url,
      title: this.sanitizeText(title),
      description: this.sanitizeText(description),
      image: image ? this.resolveUrl(image, url) : undefined,
      siteName: siteName ? this.sanitizeText(siteName) : undefined,
      favicon: favicon ? this.resolveUrl(favicon, url) : undefined,
      generatedAt: new Date(),
      expiresAt: new Date(Date.now() + this.defaultOptions.cacheExpiration!),
      status: 'success'
    };

    return preview;
  }

  private generateTitleFromUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname.replace('www.', '');
      const path = urlObj.pathname;
      
      if (path && path !== '/') {
        const pathParts = path.split('/').filter(Boolean);
        const lastPart = pathParts[pathParts.length - 1];
        if (lastPart) {
          return this.formatPathAsTitle(lastPart) + ` - ${domain}`;
        }
      }
      
      return domain;
    } catch {
      return url;
    }
  }

  private formatPathAsTitle(path: string): string {
    return path
      .replace(/[-_]/g, ' ')
      .replace(/\.[^.]*$/, '') // Remove file extension
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
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
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 500);
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}

// Export singleton instance
export const previewServiceProxy = new PreviewServiceProxy();