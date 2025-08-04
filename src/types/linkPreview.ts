export interface LinkPreview {
  id: string;
  url: string;
  title: string;
  description: string;
  image?: string;
  siteName?: string;
  favicon?: string;
  generatedAt: Date;
  expiresAt: Date;
  status: 'pending' | 'success' | 'failed' | 'expired';
  errorMessage?: string;
}

export interface OpenGraphData {
  title?: string;
  description?: string;
  image?: string;
  siteName?: string;
  type?: string;
  url?: string;
}

export interface TwitterCardData {
  title?: string;
  description?: string;
  image?: string;
  site?: string;
  creator?: string;
  card?: string;
}

export interface PreviewGenerationOptions {
  timeout?: number; // Request timeout in milliseconds
  userAgent?: string;
  followRedirects?: boolean;
  maxRedirects?: number;
  cacheExpiration?: number; // Cache expiration in milliseconds
}

export interface PreviewCache {
  [url: string]: LinkPreview;
}

export interface PreviewGenerationResult {
  preview: LinkPreview | null;
  fromCache: boolean;
  error?: string;
}