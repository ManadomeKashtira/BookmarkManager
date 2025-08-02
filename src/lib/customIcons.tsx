import React from 'react';

// Dynamic icon loading - this will be populated with all available icons
let customIconsCache: Record<string, string> = {};
let iconsCacheLoaded = false;

// Function to convert filename to camelCase key
const filenameToKey = (filename: string): string => {
  // Remove extension
  const nameWithoutExt = filename.replace(/\.(png|svg|jpg|jpeg|gif)$/i, '');
  
  // Handle special cases and convert to camelCase
  return nameWithoutExt
    .replace(/[^a-zA-Z0-9]/g, ' ') // Replace non-alphanumeric with spaces
    .split(' ')
    .filter(word => word.length > 0)
    .map((word, index) => {
      if (index === 0) {
        return word.toLowerCase();
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join('');
};

// Function to convert camelCase key to readable label
const keyToLabel = (key: string): string => {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/([0-9]+)/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
};

// Dynamically load all icons from ICON_LIB directory
const loadAllIcons = async (): Promise<Record<string, string>> => {
  if (iconsCacheLoaded && Object.keys(customIconsCache).length > 0) {
    return customIconsCache;
  }

  try {
    // Get all files from the ICON_LIB directory
    const iconFiles = [
      '$.png', '100.png', '1F31D.png', '1F31E.png', '1F31F.png', '1F34E.png', '1F34F.png',
      'Apple_retro.png', 'Artstartion.png', 'Backup.png', 'bag-shopping-solid-full.svg',
      'bear.png', 'C.png', 'callendar.png', 'camel.png', 'Cc.png', 'CD.png', 'chart-671.svg',
      'chrome.png', 'chromium.png', 'Clock.png', 'cow.png', 'Discord_retro.png', 'dolphin.png',
      'euro-coin-2141.svg', 'Export.png', 'facebook-messenger-2881.svg', 'FB.png', 'Fire.png',
      'fold.png', 'Folder_brown.png', 'Folder_purple.svg', 'Folder_Sls.png', 'folder-1484.svg',
      'gear-1213.svg', 'IG_white.png', 'import.png', 'instagram-like-3507.svg', 'instagram-logo-8869.svg',
      'JS.png', 'lantern.png', 'Linkdin.png', 'linkedin-logo-2430.svg', 'mail-142.svg',
      'medical.png', 'midnight.png', 'mouse.png', 'movie-850.svg', 'music 1.png', 'music 2.png',
      'music 3.png', 'music 4.png', 'music 5.png', 'music 6.png', 'newspaper-solid-full.svg',
      'Night (2).png', 'Night.png', 'No Smoking.png', 'Notes A.png', 'Notes B.png', 'Notes C.png',
      'Notes_CC.png', 'opera.png', 'Pack.png', 'panda.png', 'phone.png', 'Pin.png', 'Pinterst.png',
      'Radio.png', 'rail.png', 'Rar.png', 'red-parental-advisory-10660.svg', 'reddit_2.png',
      'reddit-logo-2436.svg', 'rice.png', 'ruller A.png', 'Ruller_b.png', 'safari.png',
      'save black.png', 'save.png', 'settings-778.svg', 'Smoke.png', 'Speaker (2).png',
      'Speaker.png', 'Stop.png', 'subscribe-852.svg', 'tiger.png', 'Tools A.png', 'Tools B.png',
      'Tools_y.png', 'Twit.png', 'twitter-x-logo-black-round-20851.svg', 'umbrella-solid-full.svg',
      'user-3296.svg', 'user-secret-solid-full.svg', 'video-solid-full.svg', 'whatsapp-logo-4456.svg',
      'white bear.png', 'Wifi.png', 'Windows 11.png', 'Wolf.png', 'www.png',
      'youtube-shorts-logo-15250.svg', 'youtube-shorts-speech-bubble-21706.svg', 'YT_retro.png'
    ];

    const icons: Record<string, string> = {};
    
    iconFiles.forEach(filename => {
      const key = filenameToKey(filename);
      const path = `/ICON_LIB/${filename}`;
      icons[key] = path;
    });

    customIconsCache = icons;
    iconsCacheLoaded = true;
    return icons;
  } catch (error) {
    console.error('Error loading icons:', error);
    // Fallback to basic icons if loading fails
    return {
      folder1484: '/ICON_LIB/folder-1484.svg',
      gear1213: '/ICON_LIB/gear-1213.svg',
      settings778: '/ICON_LIB/settings-778.svg',
    };
  }
};

// Initialize icons cache
loadAllIcons().then(() => {
  console.log('Icons loaded successfully:', Object.keys(customIconsCache).length, 'icons available');
}).catch(error => {
  console.error('Failed to load icons:', error);
});

export type CustomIconName = string;

interface CustomIconProps {
  name: CustomIconName;
  className?: string;
  size?: number;
  style?: React.CSSProperties;
}

export const CustomIcon: React.FC<CustomIconProps> = ({ 
  name, 
  className = '', 
  size = 24,
  style = {} 
}) => {
  const iconPath = customIconsCache[name];
  
  if (!iconPath) {
    console.warn(`Custom icon "${name}" not found`);
    return null;
  }

  return (
    <img
      key={`icon-${name}-${iconPath}`}
      src={iconPath}
      alt={name}
      className={className}
      style={{
        width: size,
        height: size,
        ...style
      }}
      onError={(e) => {
        console.error(`Failed to load icon: ${name} from path: ${iconPath}`);
        // Hide the broken image
        e.currentTarget.style.display = 'none';
      }}
    />
  );
};

// Helper function to get icon path
export const getCustomIconPath = async (name: CustomIconName): Promise<string> => {
  const icons = await loadAllIcons();
  return icons[name] || '';
};

// Helper function to get all available icons for selection
export const getAllIcons = async () => {
  const icons = await loadAllIcons();
  return Object.entries(icons).map(([name, path]) => ({
    name: name as CustomIconName,
    path,
    label: keyToLabel(name)
  }));
};

// Helper function to get icons by category
export const getIconsByCategory = async () => {
  const icons = await loadAllIcons();
  const iconNames = Object.keys(icons);
  
  // Categorize icons based on their names and content
  const categories: Record<string, CustomIconName[]> = {
    folders: [],
    social: [],
    browsers: [],
    programming: [],
    music: [],
    animals: [],
    food: [],
    weather: [],
    tools: [],
    notes: [],
    system: [],
    files: [],
    other: []
  };

  iconNames.forEach(iconName => {
    const lowerName = iconName.toLowerCase();
    
    if (lowerName.includes('folder')) {
      categories.folders.push(iconName);
    } else if (lowerName.includes('facebook') || lowerName.includes('twitter') || lowerName.includes('instagram') || 
               lowerName.includes('linkedin') || lowerName.includes('reddit') || lowerName.includes('whatsapp') ||
               lowerName.includes('youtube') || lowerName.includes('discord') || lowerName.includes('pinterest') ||
               lowerName.includes('fb') || lowerName.includes('ig') || lowerName.includes('yt')) {
      categories.social.push(iconName);
    } else if (lowerName.includes('chrome') || lowerName.includes('safari') || lowerName.includes('opera') ||
               lowerName.includes('chromium')) {
      categories.browsers.push(iconName);
    } else if (lowerName.includes('javascript') || lowerName.includes('js') || lowerName === 'c' ||
               lowerName.includes('programming')) {
      categories.programming.push(iconName);
    } else if (lowerName.includes('music') || lowerName.includes('radio') || lowerName.includes('speaker') ||
               lowerName.includes('cd')) {
      categories.music.push(iconName);
    } else if (lowerName.includes('bear') || lowerName.includes('camel') || lowerName.includes('cow') ||
               lowerName.includes('mouse') || lowerName.includes('panda') || lowerName.includes('tiger') ||
               lowerName.includes('wolf') || lowerName.includes('dolphin')) {
      categories.animals.push(iconName);
    } else if (lowerName.includes('1f34') || lowerName.includes('apple') || lowerName.includes('rice')) {
      categories.food.push(iconName);
    } else if (lowerName.includes('1f31') || lowerName.includes('sun') || lowerName.includes('moon') ||
               lowerName.includes('star') || lowerName.includes('night')) {
      categories.weather.push(iconName);
    } else if (lowerName.includes('tools') || lowerName.includes('ruler') || lowerName.includes('ruller') ||
               lowerName.includes('lantern') || lowerName.includes('fire') || lowerName.includes('medical') ||
               lowerName.includes('gear') || lowerName.includes('settings')) {
      categories.tools.push(iconName);
    } else if (lowerName.includes('notes') || lowerName.includes('note')) {
      categories.notes.push(iconName);
    } else if (lowerName.includes('clock') || lowerName.includes('calendar') || lowerName.includes('phone') ||
               lowerName.includes('wifi') || lowerName.includes('pack') || lowerName.includes('pin') ||
               lowerName.includes('stop') || lowerName.includes('smoke') || lowerName.includes('windows')) {
      categories.system.push(iconName);
    } else if (lowerName.includes('save') || lowerName.includes('backup') || lowerName.includes('export') ||
               lowerName.includes('import') || lowerName.includes('rar') || lowerName.includes('cc')) {
      categories.files.push(iconName);
    } else {
      categories.other.push(iconName);
    }
  });

  return categories;
};

// Synchronous versions for backward compatibility
export const getAllIconsSync = () => {
  if (!iconsCacheLoaded) {
    console.warn('Icons not loaded yet, returning empty array');
    return [];
  }
  
  return Object.entries(customIconsCache).map(([name, path]) => ({
    name: name as CustomIconName,
    path,
    label: keyToLabel(name)
  }));
};

export const getIconsByCategorySync = () => {
  if (!iconsCacheLoaded) {
    console.warn('Icons not loaded yet, returning empty categories');
    return {};
  }

  const iconNames = Object.keys(customIconsCache);
  
  // Categorize icons based on their names and content
  const categories: Record<string, CustomIconName[]> = {
    folders: [],
    social: [],
    browsers: [],
    programming: [],
    music: [],
    animals: [],
    food: [],
    weather: [],
    tools: [],
    notes: [],
    system: [],
    files: [],
    other: []
  };

  iconNames.forEach(iconName => {
    const lowerName = iconName.toLowerCase();
    
    if (lowerName.includes('folder')) {
      categories.folders.push(iconName);
    } else if (lowerName.includes('facebook') || lowerName.includes('twitter') || lowerName.includes('instagram') || 
               lowerName.includes('linkedin') || lowerName.includes('reddit') || lowerName.includes('whatsapp') ||
               lowerName.includes('youtube') || lowerName.includes('discord') || lowerName.includes('pinterest') ||
               lowerName.includes('fb') || lowerName.includes('ig') || lowerName.includes('yt')) {
      categories.social.push(iconName);
    } else if (lowerName.includes('chrome') || lowerName.includes('safari') || lowerName.includes('opera') ||
               lowerName.includes('chromium')) {
      categories.browsers.push(iconName);
    } else if (lowerName.includes('javascript') || lowerName.includes('js') || lowerName === 'c' ||
               lowerName.includes('programming')) {
      categories.programming.push(iconName);
    } else if (lowerName.includes('music') || lowerName.includes('radio') || lowerName.includes('speaker') ||
               lowerName.includes('cd')) {
      categories.music.push(iconName);
    } else if (lowerName.includes('bear') || lowerName.includes('camel') || lowerName.includes('cow') ||
               lowerName.includes('mouse') || lowerName.includes('panda') || lowerName.includes('tiger') ||
               lowerName.includes('wolf') || lowerName.includes('dolphin')) {
      categories.animals.push(iconName);
    } else if (lowerName.includes('1f34') || lowerName.includes('apple') || lowerName.includes('rice')) {
      categories.food.push(iconName);
    } else if (lowerName.includes('1f31') || lowerName.includes('sun') || lowerName.includes('moon') ||
               lowerName.includes('star') || lowerName.includes('night')) {
      categories.weather.push(iconName);
    } else if (lowerName.includes('tools') || lowerName.includes('ruler') || lowerName.includes('ruller') ||
               lowerName.includes('lantern') || lowerName.includes('fire') || lowerName.includes('medical') ||
               lowerName.includes('gear') || lowerName.includes('settings')) {
      categories.tools.push(iconName);
    } else if (lowerName.includes('notes') || lowerName.includes('note')) {
      categories.notes.push(iconName);
    } else if (lowerName.includes('clock') || lowerName.includes('calendar') || lowerName.includes('phone') ||
               lowerName.includes('wifi') || lowerName.includes('pack') || lowerName.includes('pin') ||
               lowerName.includes('stop') || lowerName.includes('smoke') || lowerName.includes('windows')) {
      categories.system.push(iconName);
    } else if (lowerName.includes('save') || lowerName.includes('backup') || lowerName.includes('export') ||
               lowerName.includes('import') || lowerName.includes('rar') || lowerName.includes('cc')) {
      categories.files.push(iconName);
    } else {
      categories.other.push(iconName);
    }
  });

  return categories;
};

// Predefined icon components for common use cases
export const FolderIcon = (props: Omit<CustomIconProps, 'name'>) => (
  <CustomIcon name="folder1484" {...props} />
);

export const SettingsIcon = (props: Omit<CustomIconProps, 'name'>) => (
  <CustomIcon name="settings778" {...props} />
);

export const GearIcon = (props: Omit<CustomIconProps, 'name'>) => (
  <CustomIcon name="gear1213" {...props} />
);

export const ChartIcon = (props: Omit<CustomIconProps, 'name'>) => (
  <CustomIcon name="chart671" {...props} />
);

export const UserIcon = (props: Omit<CustomIconProps, 'name'>) => (
  <CustomIcon name="user3296" {...props} />
);

export const MailIcon = (props: Omit<CustomIconProps, 'name'>) => (
  <CustomIcon name="mail142" {...props} />
);

export const VideoIcon = (props: Omit<CustomIconProps, 'name'>) => (
  <CustomIcon name="videoSolidFull" {...props} />
);

export const MovieIcon = (props: Omit<CustomIconProps, 'name'>) => (
  <CustomIcon name="movie850" {...props} />
);

export const NewspaperIcon = (props: Omit<CustomIconProps, 'name'>) => (
  <CustomIcon name="newspaperSolidFull" {...props} />
);