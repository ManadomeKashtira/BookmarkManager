export interface LinkHealthStatus {
  status: 'healthy' | 'broken' | 'warning' | 'checking' | 'unknown';
  statusCode?: number;
  lastChecked: Date;
  errorMessage?: string;
  responseTime?: number;
  redirectUrl?: string;
}

export interface HealthCheckResult {
  bookmarkId: string;
  url: string;
  status: LinkHealthStatus;
  checkedAt: Date;
}

export interface BulkHealthCheckProgress {
  total: number;
  completed: number;
  failed: number;
  inProgress: boolean;
  currentUrl?: string;
  startTime: Date;
  estimatedTimeRemaining?: number;
}

export interface HealthCheckOptions {
  timeout?: number; // milliseconds, default 10000
  maxRetries?: number; // default 2
  retryDelay?: number; // milliseconds, default 1000
  followRedirects?: boolean; // default true
  userAgent?: string;
}

export interface HealthCheckServiceConfig {
  defaultTimeout: number;
  maxRetries: number;
  retryDelay: number;
  rateLimitDelay: number; // delay between bulk checks
  maxConcurrentChecks: number;
  userAgent: string;
}