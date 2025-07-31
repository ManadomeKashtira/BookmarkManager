
import React from 'react';
import {
  Tag, Link as LinkIcon, Book, Star, Heart, Folder, FileText, Image as ImageIcon, Video, Music,
  MapPin, Globe, Settings2, Code, Terminal, Bookmark as BookmarkLucideIcon, AlertCircle, CheckCircle,
  HelpCircle, Info, Search, Edit2, Trash2, Users, Briefcase, Calendar, Home, ShoppingCart, Zap, Anchor
} from 'lucide-react';

export interface SelectableIcon {
  name: string;
  IconComponent: React.FC<React.SVGProps<SVGSVGElement>>;
  tags?: string[];
}

export const selectableIcons: SelectableIcon[] = [
  { name: 'Tag', IconComponent: Tag, tags: ['label', 'category'] },
  { name: 'Link', IconComponent: LinkIcon, tags: ['url', 'web'] },
  { name: 'Bookmark', IconComponent: BookmarkLucideIcon, tags: ['save', 'read'] },
  { name: 'Book', IconComponent: Book, tags: ['read', 'document'] },
  { name: 'Star', IconComponent: Star, tags: ['favorite', 'rating'] },
  { name: 'Heart', IconComponent: Heart, tags: ['favorite', 'like'] },
  { name: 'Folder', IconComponent: Folder, tags: ['directory', 'organize'] },
  { name: 'FileText', IconComponent: FileText, tags: ['document', 'notes'] },
  { name: 'Image', IconComponent: ImageIcon, tags: ['photo', 'picture'] },
  { name: 'Video', IconComponent: Video, tags: ['movie', 'media'] },
  { name: 'Music', IconComponent: Music, tags: ['audio', 'song'] },
  { name: 'MapPin', IconComponent: MapPin, tags: ['location', 'place'] },
  { name: 'Globe', IconComponent: Globe, tags: ['web', 'internet', 'world'] },
  { name: 'Settings', IconComponent: Settings2, tags: ['options', 'configure'] },
  { name: 'Code', IconComponent: Code, tags: ['develop', 'programming'] },
  { name: 'Terminal', IconComponent: Terminal, tags: ['console', 'cli'] },
  { name: 'AlertCircle', IconComponent: AlertCircle, tags: ['warning', 'error'] },
  { name: 'CheckCircle', IconComponent: CheckCircle, tags: ['success', 'done'] },
  { name: 'HelpCircle', IconComponent: HelpCircle, tags: ['question', 'support'] },
  { name: 'Info', IconComponent: Info, tags: ['information', 'details'] },
  { name: 'Search', IconComponent: Search, tags: ['find', 'lookup'] },
  { name: 'Edit', IconComponent: Edit2, tags: ['modify', 'change'] },
  { name: 'Trash', IconComponent: Trash2, tags: ['delete', 'remove'] },
  { name: 'Users', IconComponent: Users, tags: ['people', 'group'] },
  { name: 'Briefcase', IconComponent: Briefcase, tags: ['work', 'business'] },
  { name: 'Calendar', IconComponent: Calendar, tags: ['date', 'schedule'] },
  { name: 'Home', IconComponent: Home, tags: ['house', 'main'] },
  { name: 'ShoppingCart', IconComponent: ShoppingCart, tags: ['buy', 'store'] },
  { name: 'Zap', IconComponent: Zap, tags: ['fast', 'electric'] },
  { name: 'Anchor', IconComponent: Anchor, tags: ['stable', 'fixed'] },
];

const iconMap: Record<string, React.FC<React.SVGProps<SVGSVGElement>>> =
  selectableIcons.reduce((acc, curr) => {
    acc[curr.name] = curr.IconComponent;
    return acc;
  }, {} as Record<string, React.FC<React.SVGProps<SVGSVGElement>>>);

export const defaultFaviconName = 'Bookmark'; // This is a Lucide icon name

const DefaultIconComponent = iconMap[defaultFaviconName] || BookmarkLucideIcon; // Fallback to BookmarkLucideIcon if 'Bookmark' name is ever removed

export const renderLucideIcon = (
  iconName: string | undefined,
  props?: React.SVGProps<SVGSVGElement> & { size?: number | string; className?: string }
): JSX.Element | string => {
  const defaultSize = props?.size || 20;
  const className = props?.className || '';

  if (!iconName) {
    return <DefaultIconComponent {...props} size={defaultSize} className={className} />;
  }

  // Check for data URI or common image URL
  const isDataURI = iconName.startsWith('data:image/');
  const isHttpURL = iconName.startsWith('http://') || iconName.startsWith('https://');
  const isLikelyImageUrl = /\.(png|jpg|jpeg|gif|svg|ico)(\?.*)?$/i.test(iconName);

  if (isDataURI || (isHttpURL && isLikelyImageUrl)) {
    return (
      <img
        src={iconName}
        alt="" // Decorative, alt can be empty
        style={{ width: defaultSize, height: defaultSize, objectFit: 'contain' }}
        className={className}
        onError={(e) => {
          // Attempt to replace with default Lucide icon on error.
          // This is a bit hacky; ideally, the parent component would handle state.
          const parent = e.currentTarget.parentElement;
          if (parent) {
            // Create a temporary span to render the default icon into, then replace img
            const tempSpan = document.createElement('span');
            // ReactDOM.render is deprecated in React 18. This is tricky to do without re-rendering parent.
            // For simplicity, we'll just hide it. A more robust solution involves component state.
            e.currentTarget.style.display = 'none';
            // Or, you could set src to a placeholder image, but that might loop if placeholder also fails.
          }
        }}
      />
    );
  }

  const IconComponent = iconMap[iconName];
  if (IconComponent) {
    return <IconComponent {...props} size={defaultSize} className={className} />;
  }

  // Fallback for Emojis (single or double character common emojis)
  // Regex for common emojis (simplified)
  if (iconName.length <= 2 && (/\p{Emoji}/u.test(iconName) || /\p{Extended_Pictographic}/u.test(iconName))) {
     return <span className={className} style={{ fontSize: `${Number(defaultSize) * 0.8}px`, lineHeight: `${Number(defaultSize)}px`, display: 'inline-block', verticalAlign: 'middle' }}>{iconName}</span>;
  }
  
  // If not an image, not a known Lucide icon, and not a simple emoji, fallback to default Lucide Icon
  return <DefaultIconComponent {...props} size={defaultSize} className={className} />;
};
