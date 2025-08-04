import { 
  LinkHealthStatus, 
  HealthCheckResult, 
  BulkHealthCheckProgress, 
  HealthCheckOptions, 
  HealthCheckServiceConfig 
} from '../types/healthCheck';
import { Bookmark } from '../types/bookmark';

export class HealthCheckService {
  private config: HealthCheckServiceConfig;
  private abortController: AbortController | null = null;
  private progressCallback: ((progress: BulkHealthCheckProgress) => void) | null = null;

  constructor(config?: Partial<HealthCheckServiceConfig>) {
    this.config = {
      defaultTimeout: 10000,
      maxRetries: 2,
      retryDelay: 1000,
      rateLimitDelay: 500,
      maxConcurrentChecks: 5,
      userAgent: 'BookmarkManager/1.0 (Health Check)',
      ...config
    };
  }

  /**
   * Check the health of a single link
   */
  async checkSingleLink(
    url: string, 
    options?: HealthCheckOptions
  ): Promise<LinkHealthStatus> {
    const opts = {
      timeout: this.config.defaultTimeout,
      maxRetries: this.config.maxRetries,
      retryDelay: this.config.retryDelay,
      followRedirects: true,
      userAgent: this.config.userAgent,
      ...options
    };

    let lastError: string | undefined;
    let attempt = 0;

    while (attempt <= opts.maxRetries) {
      try {
        const startTime = Date.now();
        const result = await this.performHealthCheck(url, opts);
        const responseTime = Date.now() - startTime;

        return {
          ...result,
          responseTime,
          lastChecked: new Date()
        };
      } catch (error) {
        attempt++;
        lastError = error instanceof Error ? error.message : 'Unknown error';
        
        if (attempt <= opts.maxRetries) {
          await this.delay(opts.retryDelay);
        }
      }
    }

    return {
      status: 'broken',
      lastChecked: new Date(),
      errorMessage: lastError || 'Failed after maximum retries'
    };
  }

  /**
   * Perform the actual HTTP request to check link health
   */
  private async performHealthCheck(
    url: string, 
    options: Required<HealthCheckOptions>
  ): Promise<Omit<LinkHealthStatus, 'lastChecked' | 'responseTime'>> {
    // Validate URL format
    try {
      new URL(url);
    } catch {
      throw new Error('Invalid URL format');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), options.timeout);

    try {
      const response = await fetch(url, {
        method: 'HEAD', // Use HEAD to minimize data transfer
        signal: controller.signal,
        headers: {
          'User-Agent': options.userAgent,
        },
        redirect: options.followRedirects ? 'follow' : 'manual'
      });

      clearTimeout(timeoutId);

      if (!response) {
        throw new Error('No response received');
      }

      const status = this.determineHealthStatus(response.status);
      const result: Omit<LinkHealthStatus, 'lastChecked' | 'responseTime'> = {
        status,
        statusCode: response.status
      };

      // Check for redirects
      if (response.redirected && response.url !== url) {
        result.redirectUrl = response.url;
      }

      return result;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError' || error.message.includes('aborted') || error.message.includes('The user aborted a request')) {
          throw new Error('Request aborted');
        }
        if (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo ENOTFOUND')) {
          throw new Error('DNS resolution failed: ENOTFOUND');
        }
        if (error.message.includes('ECONNREFUSED')) {
          throw new Error('Connection refused');
        }
        if (error.message.includes('ETIMEDOUT')) {
          throw new Error('Connection timeout');
        }
        if (error.message.includes('Network error')) {
          throw new Error('Network error');
        }
        // If it's a generic error, re-throw it as is
        throw error;
      }
      
      throw new Error('Network error occurred');
    }
  }

  /**
   * Determine health status based on HTTP status code
   */
  private determineHealthStatus(statusCode: number): LinkHealthStatus['status'] {
    if (statusCode >= 200 && statusCode < 300) {
      return 'healthy';
    } else if (statusCode >= 300 && statusCode < 400) {
      return 'warning'; // Redirects
    } else if (statusCode >= 400) {
      return 'broken';
    }
    return 'unknown';
  }

  /**
   * Check health of all bookmarks with rate limiting and progress tracking
   */
  async checkAllLinks(
    bookmarks: Bookmark[],
    onProgress?: (progress: BulkHealthCheckProgress) => void
  ): Promise<HealthCheckResult[]> {
    this.abortController = new AbortController();
    this.progressCallback = onProgress;

    const results: HealthCheckResult[] = [];
    const progress: BulkHealthCheckProgress = {
      total: bookmarks.length,
      completed: 0,
      failed: 0,
      inProgress: true,
      startTime: new Date()
    };

    // Update progress callback
    this.updateProgress(progress);

    // Process bookmarks in batches to respect rate limits
    const batches = this.createBatches(bookmarks, this.config.maxConcurrentChecks);

    for (const batch of batches) {
      if (this.abortController.signal.aborted) {
        break;
      }

      // Process batch concurrently
      const batchPromises = batch.map(async (bookmark) => {
        if (this.abortController?.signal.aborted) {
          return null;
        }

        progress.currentUrl = bookmark.url;
        this.updateProgress(progress);

        try {
          const healthStatus = await this.checkSingleLink(bookmark.url);
          const result: HealthCheckResult = {
            bookmarkId: bookmark.id,
            url: bookmark.url,
            status: healthStatus,
            checkedAt: new Date()
          };

          progress.completed++;
          results.push(result);
          return result;
        } catch (error) {
          progress.failed++;
          progress.completed++;
          
          const result: HealthCheckResult = {
            bookmarkId: bookmark.id,
            url: bookmark.url,
            status: {
              status: 'broken',
              lastChecked: new Date(),
              errorMessage: error instanceof Error ? error.message : 'Unknown error'
            },
            checkedAt: new Date()
          };
          
          results.push(result);
          return result;
        } finally {
          // Update estimated time remaining
          const elapsed = Date.now() - progress.startTime.getTime();
          const rate = progress.completed / (elapsed / 1000);
          const remaining = progress.total - progress.completed;
          progress.estimatedTimeRemaining = remaining / rate;
          
          this.updateProgress(progress);
        }
      });

      await Promise.all(batchPromises);

      // Rate limiting delay between batches
      if (batches.indexOf(batch) < batches.length - 1) {
        await this.delay(this.config.rateLimitDelay);
      }
    }

    progress.inProgress = false;
    progress.currentUrl = undefined;
    this.updateProgress(progress);

    this.abortController = null;
    this.progressCallback = null;

    return results;
  }

  /**
   * Cancel ongoing bulk health check
   */
  cancelBulkCheck(): void {
    if (this.abortController) {
      this.abortController.abort();
    }
  }

  /**
   * Get health status for a specific bookmark (from cache/storage)
   */
  getHealthStatus(bookmarkId: string): LinkHealthStatus | null {
    // This would typically retrieve from localStorage or a cache
    // For now, return null - this will be implemented when integrating with storage
    const stored = localStorage.getItem(`health_${bookmarkId}`);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return {
          ...parsed,
          lastChecked: new Date(parsed.lastChecked)
        };
      } catch {
        return null;
      }
    }
    return null;
  }

  /**
   * Store health status for a bookmark
   */
  storeHealthStatus(bookmarkId: string, status: LinkHealthStatus): void {
    localStorage.setItem(`health_${bookmarkId}`, JSON.stringify(status));
  }

  /**
   * Clear stored health status for a bookmark
   */
  clearHealthStatus(bookmarkId: string): void {
    localStorage.removeItem(`health_${bookmarkId}`);
  }

  /**
   * Get all stored health statuses
   */
  getAllHealthStatuses(): Record<string, LinkHealthStatus> {
    const results: Record<string, LinkHealthStatus> = {};
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('health_')) {
        const bookmarkId = key.replace('health_', '');
        const status = this.getHealthStatus(bookmarkId);
        if (status) {
          results[bookmarkId] = status;
        }
      }
    }
    
    return results;
  }

  /**
   * Utility method to create batches for concurrent processing
   */
  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  /**
   * Utility method for delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Update progress and call callback if provided
   */
  private updateProgress(progress: BulkHealthCheckProgress): void {
    if (this.progressCallback) {
      this.progressCallback({ ...progress });
    }
  }
}

// Export a default instance
export const healthCheckService = new HealthCheckService();