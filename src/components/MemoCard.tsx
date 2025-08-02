import React from 'react';
import { Star, Tag, Folder, Edit, Trash2, Calendar, Clock } from 'lucide-react';
import type { Memo, MemoContent } from '@/types/bookmark';

interface MemoCardProps {
  memo: Memo;
  onEdit: (memo: Memo) => void;
  onDelete: (memoId: string) => void;
  onToggleFavorite: (memoId: string) => void;
}

export const MemoCard: React.FC<MemoCardProps> = ({
  memo,
  onEdit,
  onDelete,
  onToggleFavorite
}) => {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(new Date(date));
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  const renderContent = (content: MemoContent[]) => {
    return content.slice(0, 3).map((block, index) => {
      const style: React.CSSProperties = {
        fontFamily: block.formatting?.fontFamily || 'inherit',
        fontSize: block.formatting?.fontSize ? `${block.formatting.fontSize}px` : 'inherit',
        color: block.formatting?.color || 'inherit',
        backgroundColor: block.formatting?.backgroundColor || 'transparent',
        fontWeight: block.formatting?.bold ? 'bold' : 'normal',
        fontStyle: block.formatting?.italic ? 'italic' : 'normal',
        textDecoration: [
          block.formatting?.underline ? 'underline' : '',
          block.formatting?.strikethrough ? 'line-through' : ''
        ].filter(Boolean).join(' ') || 'none'
      };

      return (
        <div key={index} style={style} className="text-sm leading-relaxed">
          {block.content.length > 100 
            ? block.content.substring(0, 100) + '...' 
            : block.content
          }
        </div>
      );
    });
  };

  const getContentPreview = () => {
    const textContent = memo.content
      .map(block => block.content)
      .join(' ')
      .substring(0, 150);
    
    return textContent.length > 150 ? textContent + '...' : textContent;
  };

  return (
    <div 
      className="group relative bg-card border border-border rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-[1.02]"
      style={{
        backgroundColor: memo.backgroundColor,
        backgroundImage: memo.gridBackground 
          ? `linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px),
             linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px)`
          : 'none',
        backgroundSize: memo.gridBackground ? '15px 15px' : 'auto'
      }}
    >
      {/* Header */}
      <div className="p-4 border-b border-border/20">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground text-lg mb-1 truncate">
              {memo.title}
            </h3>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatDate(memo.createdAt)}
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatTime(memo.updatedAt)}
              </div>
            </div>
          </div>
          
          {/* Favorite button */}
          <button
            onClick={() => onToggleFavorite(memo.id)}
            className={`p-2 rounded-lg transition-all duration-200 ${
              memo.isFavorite 
                ? 'text-yellow-500 bg-yellow-50 hover:bg-yellow-100' 
                : 'text-muted-foreground hover:text-yellow-500 hover:bg-yellow-50'
            }`}
          >
            <Star className={`w-4 h-4 ${memo.isFavorite ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="space-y-2 mb-4">
          {memo.content.length > 0 ? (
            renderContent(memo.content)
          ) : (
            <div className="text-muted-foreground text-sm italic">
              No content yet...
            </div>
          )}
        </div>

        {/* Tags */}
        {memo.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {memo.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-xs rounded-md"
              >
                <Tag className="w-3 h-3" />
                {tag}
              </span>
            ))}
            {memo.tags.length > 3 && (
              <span className="text-xs text-muted-foreground">
                +{memo.tags.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Category */}
        {memo.category && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
            <Folder className="w-3 h-3" />
            {memo.category}
          </div>
        )}
      </div>

      {/* Action buttons - hidden by default, shown on hover */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <div className="flex gap-1">
          <button
            onClick={() => onEdit(memo)}
            className="p-2 bg-background/80 backdrop-blur-sm border border-border rounded-lg hover:bg-background transition-colors"
            title="Edit memo"
          >
            <Edit className="w-4 h-4 text-foreground" />
          </button>
          <button
            onClick={() => onDelete(memo.id)}
            className="p-2 bg-background/80 backdrop-blur-sm border border-border rounded-lg hover:bg-red-50 hover:border-red-200 transition-colors"
            title="Delete memo"
          >
            <Trash2 className="w-4 h-4 text-red-500" />
          </button>
        </div>
      </div>

      {/* Grid background indicator */}
      {memo.gridBackground && (
        <div className="absolute bottom-2 left-2">
          <div className="px-2 py-1 bg-background/80 backdrop-blur-sm border border-border rounded text-xs text-muted-foreground">
            Grid
          </div>
        </div>
      )}

      {/* Favorite indicator */}
      {memo.isFavorite && (
        <div className="absolute top-2 left-2">
          <div className="w-3 h-3 bg-yellow-500 rounded-full shadow-sm"></div>
        </div>
      )}
    </div>
  );
}; 