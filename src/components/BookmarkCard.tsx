
import React, { useState, useEffect } from 'react';
import { Heart, ExternalLink, Edit, Trash2, Eye, Clock, CheckCircle, AlertTriangle, Activity, RefreshCw, Image as ImageIcon } from 'lucide-react';
import { CustomIcon } from '@/lib/customIcons';
import type { Bookmark } from '@/types/bookmark';
import { LinkHealthStatus } from '@/types/healthCheck';
import { healthCheckService } from '@/services/healthCheckService';
import { useLinkPreview } from '@/hooks/useLinkPreview';

interface BookmarkCardProps {
  bookmark: Bookmark;
  viewMode: 'grid' | 'list';
  onToggleFavorite: (id: string) => void;
  onEdit: (bookmark: Bookmark) => void;
  onDelete: (id: string) => void;
  onVisit: (bookmark: Bookmark) => void;
  cardBackgroundClass: string;
  showDescriptions: boolean;
  showVisitCount: boolean;
  showHealthStatus?: boolean;
  showPreviews?: boolean;
  enablePreviewGeneration?: boolean;
}

export const BookmarkCard: React.FC<BookmarkCardProps> = ({
  bookmark,
  viewMode,
  onToggleFavorite,
  onEdit,
  onDelete,
  onVisit,
  cardBackgroundClass,
  showDescriptions,
  showVisitCount,
  showHealthStatus = true,
  showPreviews = true,
  enablePreviewGeneration = true
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [healthStatus, setHealthStatus] = useState<LinkHealthStatus | null>(null);
  
  // Link preview hook
  const {
    preview,
    isLoading: isPreviewLoading,
    error: previewError,
    fromCache,
    generatePreview,
    refreshPreview
  } = useLinkPreview(bookmark.url, {
    autoGenerate: enablePreviewGeneration,
    cacheFirst: true
  });

  // Debug logging
  useEffect(() => {
    if (showPreviews && enablePreviewGeneration) {
      console.log('BookmarkCard Preview Debug:', {
        url: bookmark.url,
        preview,
        isLoading: isPreviewLoading,
        error: previewError,
        fromCache,
        showPreviews,
        enablePreviewGeneration
      });
    }
  }, [bookmark.url, preview, isPreviewLoading, previewError, fromCache, showPreviews, enablePreviewGeneration]);

  useEffect(() => {
    if (showHealthStatus) {
      const status = healthCheckService.getHealthStatus(bookmark.id);
      setHealthStatus(status);
    }
  }, [bookmark.id, showHealthStatus]);

  const formatDate = (dateInput: Date | string) => {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(date.getTime())) {
        return 'Invalid Date';
    }
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };

  const getHealthStatusIndicator = () => {
    if (!showHealthStatus || !healthStatus) return null;

    const getStatusIcon = () => {
      switch (healthStatus.status) {
        case 'healthy':
          return <CheckCircle className="w-3 h-3 text-green-500" />;
        case 'broken':
          return <AlertTriangle className="w-3 h-3 text-red-500" />;
        case 'warning':
          return <AlertTriangle className="w-3 h-3 text-yellow-500" />;
        case 'checking':
          return <Activity className="w-3 h-3 text-blue-500 animate-pulse" />;
        default:
          return null;
      }
    };

    const getStatusTitle = () => {
      switch (healthStatus.status) {
        case 'healthy':
          return `Link is healthy (${healthStatus.statusCode})`;
        case 'broken':
          return `Link is broken (${healthStatus.statusCode || 'Error'})`;
        case 'warning':
          return `Link has warnings (${healthStatus.statusCode})`;
        case 'checking':
          return 'Checking link health...';
        default:
          return 'Health status unknown';
      }
    };

    return (
      <div className="flex items-center" title={getStatusTitle()}>
        {getStatusIcon()}
      </div>
    );
  };

  const getPreviewImage = () => {
    if (!showPreviews) return null;

    // Use preview image if available, otherwise fall back to favicon
    const imageUrl = preview?.image || preview?.favicon;
    
    if (!imageUrl) return null;

    return (
      <div className="relative overflow-hidden rounded-lg bg-gray-100">
        <img
          src={imageUrl}
          alt={preview?.title || bookmark.title}
          className="w-full h-full object-cover"
          onError={(e) => {
            // Hide image on error
            e.currentTarget.style.display = 'none';
          }}
        />
      </div>
    );
  };

  const getPreviewContent = () => {
    if (!showPreviews) return null;

    if (isPreviewLoading) {
      return (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Activity className="w-4 h-4 animate-pulse" />
          <span>Loading preview...</span>
        </div>
      );
    }

    if (previewError && !preview) {
      return (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4" />
            <span>Preview unavailable</span>
          </div>
          <button
            onClick={generatePreview}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            title="Retry preview generation"
          >
            <RefreshCw className="w-3 h-3" />
          </button>
        </div>
      );
    }

    if (!preview) return null;

    return (
      <div className="space-y-2">
        {preview.description && (
          <p className="text-sm text-gray-600 line-clamp-2">
            {preview.description}
          </p>
        )}
        {preview.siteName && (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>{preview.siteName}</span>
            {fromCache && (
              <span className="px-1 py-0.5 bg-green-100 text-green-600 rounded text-xs">
                Cached
              </span>
            )}
          </div>
        )}
      </div>
    );
  };

  const getPreviewActions = () => {
    if (!showPreviews || !preview) return null;

    return (
      <button
        onClick={refreshPreview}
        className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
        title="Refresh preview"
      >
        <RefreshCw className="w-3 h-3" />
      </button>
    );
  };

  const faviconDisplay = (() => {
    // Use preview favicon if available and showing previews
    const faviconUrl = showPreviews && preview?.favicon ? preview.favicon : null;
    
    if (faviconUrl) {
      return (
        <img
          src={faviconUrl}
          alt="Site favicon"
          className="flex-shrink-0"
          style={{ width: viewMode === 'list' ? 24 : 32, height: viewMode === 'list' ? 24 : 32 }}
          onError={(e) => {
            // Fall back to custom icon on error
            e.currentTarget.style.display = 'none';
          }}
        />
      );
    }
    
    // Fall back to custom icon
    return bookmark.favicon ? (
      <CustomIcon 
        name={bookmark.favicon as any} 
        size={viewMode === 'list' ? 24 : 32}
        className="flex-shrink-0 text-foreground"
      />
    ) : (
      <CustomIcon 
        name="folder1484" 
        size={viewMode === 'list' ? 24 : 32}
        className="flex-shrink-0 text-foreground"
      />
    );
  })();

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, bookmarkId: string) => {
    e.dataTransfer.setData('bookmarkId', bookmarkId);
    e.currentTarget.style.opacity = '0.6'; // Visual feedback for dragging
  };

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.style.opacity = '1'; // Reset opacity
  };

  if (viewMode === 'list') {
    return (
      <div
        draggable
        onDragStart={(e) => handleDragStart(e, bookmark.id)}
        onDragEnd={handleDragEnd}
        className={`group border border-border/50 rounded-xl p-4 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 hover:border-primary/20 hover:-translate-y-1 cursor-grab ${cardBackgroundClass}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="flex items-center gap-4">
          <div className="text-2xl flex-shrink-0 w-6 h-6 flex items-center justify-center">
            {faviconDisplay}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-foreground truncate">
                {showPreviews && preview?.title ? preview.title : bookmark.title}
              </h3>
              {bookmark.isFavorite && (
                <Heart className="w-4 h-4 text-red-500 fill-current flex-shrink-0" />
              )}
              {getHealthStatusIndicator()}
              {getPreviewActions()}
            </div>
            {showDescriptions && (
              <div className="mb-2">
                {showPreviews && preview?.description ? (
                  <p className="text-sm text-muted-foreground truncate">{preview.description}</p>
                ) : bookmark.description ? (
                  <p className="text-sm text-muted-foreground truncate">{bookmark.description}</p>
                ) : null}
                {getPreviewContent()}
              </div>
            )}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>{bookmark.category}</span>
              <span>•</span>
              <span>{formatDate(bookmark.dateAdded)}</span>
              {showVisitCount && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    {bookmark.visits}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="hidden sm:flex flex-wrap gap-1">
              {bookmark.tags.slice(0, 2).map((tag: string) => (
                <span
                  key={tag}
                  className="px-2 py-1 bg-secondary text-secondary-foreground text-xs rounded-full"
                >
                  {tag}
                </span>
              ))}
              {bookmark.tags.length > 2 && (
                <span className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded-full">
                  +{bookmark.tags.length - 2}
                </span>
              )}
            </div>

            <div
              className={`flex items-center gap-1 sm:gap-2 transition-opacity duration-200 ${
                isHovered ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
              }`}
            >
              <button
                title="Toggle Favorite"
                onClick={() => onToggleFavorite(bookmark.id)}
                className="p-2 text-muted-foreground hover:text-red-500 transition-colors"
              >
                <Heart className={`w-4 h-4 ${bookmark.isFavorite ? 'fill-current text-red-500' : ''}`} />
              </button>
              <button
                title="Visit Link"
                onClick={() => onVisit(bookmark)}
                className="p-2 text-muted-foreground hover:text-primary transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
              </button>
              <button
                title="Edit Bookmark"
                onClick={() => onEdit(bookmark)}
                className="p-2 text-muted-foreground hover:text-accent transition-colors"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                title="Delete Bookmark"
                onClick={() => onDelete(bookmark.id)}
                className="p-2 text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`modern-card modern-card-hover overflow-hidden ${cardBackgroundClass}`}>
      {/* Preview Image */}
      {showPreviews && preview?.image && (
        <div className="w-full h-48 mb-4">
          {getPreviewImage()}
        </div>
      )}

      <div className="p-6">
        {/* Header */}
        <div className="flex items-start gap-4 mb-4">
          {/* Favicon */}
          <div className="flex-shrink-0">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center border border-gray-200/60">
              {faviconDisplay}
            </div>
          </div>

          {/* Title and Actions */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-semibold text-gray-900 leading-tight line-clamp-2">
                    {showPreviews && preview?.title ? preview.title : bookmark.title}
                  </h3>
                  {getHealthStatusIndicator()}
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {getPreviewActions()}
                <button
                  onClick={() => onToggleFavorite(bookmark.id)}
                  className={`p-2 rounded-lg transition-all duration-200 ${
                    bookmark.isFavorite
                      ? 'text-red-500 hover:bg-red-50'
                      : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                  }`}
                  title={bookmark.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                >
                  <Heart className={`w-4 h-4 ${bookmark.isFavorite ? 'fill-current' : ''}`} />
                </button>
                <button
                  onClick={() => onEdit(bookmark)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
                  title="Edit bookmark"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDelete(bookmark.id)}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200"
                  title="Delete bookmark"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Description and Preview Content */}
        <div className="mb-4">
          {showPreviews && preview?.description ? (
            <p className="text-gray-600 text-sm leading-relaxed line-clamp-3 mb-2">
              {preview.description}
            </p>
          ) : showDescriptions && bookmark.description ? (
            <p className="text-gray-600 text-sm leading-relaxed line-clamp-3 mb-2">
              {bookmark.description}
            </p>
          ) : null}
          
          {getPreviewContent()}
        </div>

        {/* URL and Domain */}
        <div className="mb-4">
          <a
            href={bookmark.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-700 text-sm font-medium hover:underline transition-colors"
          >
            {new URL(bookmark.url).hostname}
          </a>
          <p className="text-gray-500 text-xs mt-1 truncate">
            {bookmark.url}
          </p>
        </div>

        {/* Tags */}
        {bookmark.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {bookmark.tags.slice(0, 3).map((tag: string, index: number) => (
              <span
                key={index}
                className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md font-medium"
              >
                #{tag}
              </span>
            ))}
            {bookmark.tags.length > 3 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded-md">
                +{bookmark.tags.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200/60">
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {new Date(bookmark.dateAdded).toLocaleDateString()}
            </span>
            {showVisitCount && (
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                {bookmark.visits} visits
              </span>
            )}
          </div>
          <button
            onClick={() => onVisit(bookmark)}
            className="modern-btn modern-btn-primary text-xs"
          >
            Visit
          </button>
        </div>
      </div>
    </div>
  );
};
