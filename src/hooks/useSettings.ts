
import { useState, useEffect, useCallback } from 'react';
import type { AppSettings, ThemeSettings, SortOption } from '@/types/bookmark';

const SETTINGS_STORAGE_KEY = 'bookmarkManagerAppSettings_v2';

// Function to convert hex to HSL string "H S% L%"
function hexToHSLString(hex: string): string | null {
  if (!hex) return null;
  let r = 0, g = 0, b = 0;
  if (hex.length === 4) { // #RGB
    r = parseInt(hex[1] + hex[1], 16);
    g = parseInt(hex[2] + hex[2], 16);
    b = parseInt(hex[3] + hex[3], 16);
  } else if (hex.length === 7) { // #RRGGBB
    r = parseInt(hex.substring(1, 3), 16);
    g = parseInt(hex.substring(3, 5), 16);
    b = parseInt(hex.substring(5, 7), 16);
  } else {
    return null; // Invalid hex
  }

  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max === min) {
    h = s = 0; // achromatic
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  const finalH = Math.round(h * 360);
  const finalS = Math.round(s * 100);
  const finalL = Math.round(l * 100);
  return `${finalH} ${finalS}% ${finalL}%`;
}

const defaultTheme: ThemeSettings = {
  primaryColor: '#3B82F6', // Ocean Blue primary
  secondaryColor: '#8B5CF6', // Ocean Blue secondary
  accentColor: '#F59E0B', // Ocean Blue accent
  backgroundColor: '#F8FAFC', // Light gray-blue, good default background
  cardStyle: 'glass',
  borderRadius: 'medium',
  animation: 'smooth',
  density: 'comfortable'
};

const defaultSettings: AppSettings = {
  theme: defaultTheme,
  defaultView: 'grid',
  defaultSort: 'dateAdded-desc',
  itemsPerPage: 20,
  showDescriptions: true,
  showVisitCount: true,
  autoBackup: false,
  confirmDelete: true
};

export const useSettings = () => {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load settings from localStorage
  useEffect(() => {
    console.log("Attempting to load settings from localStorage...");
    const savedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        const mergedSettings = {
          ...defaultSettings,
          ...parsed,
          theme: {
            ...defaultSettings.theme,
            ...(parsed.theme || {}),
          },
        };
        setSettings(mergedSettings);
        console.log("Loaded settings from localStorage:", mergedSettings);
      } catch (error) {
        console.error('Failed to parse saved settings, using defaults:', error);
        setSettings(defaultSettings);
      }
    } else {
      console.log("No settings in localStorage, using defaults.");
      setSettings(defaultSettings);
    }
    setIsInitialized(true);
  }, []);

  // Apply theme to CSS custom properties and save settings to localStorage
  useEffect(() => {
    if (isInitialized) {
      console.log("Applying theme and saving settings:", settings);
      const root = document.documentElement;
      const theme = settings.theme;

      // Apply colors
      const primaryHSL = hexToHSLString(theme.primaryColor);
      const secondaryHSL = hexToHSLString(theme.secondaryColor);
      const accentHSL = hexToHSLString(theme.accentColor);
      const backgroundHSL = hexToHSLString(theme.backgroundColor);
      // For foreground, card, popover, border, input, ring, we'll let globals.css handle defaults
      // or derive them if more complex theming is needed later.
      // For now, focusing on the main customizable ones.

      if (primaryHSL) root.style.setProperty('--primary', primaryHSL);
      if (secondaryHSL) root.style.setProperty('--secondary', secondaryHSL);
      if (accentHSL) root.style.setProperty('--accent', accentHSL);
      if (backgroundHSL) {
        root.style.setProperty('--background', backgroundHSL);
        // Assuming card and popover follow the main background for simplicity in this step
        root.style.setProperty('--card', backgroundHSL);
        root.style.setProperty('--popover', backgroundHSL);
        // A common pattern is to make foreground contrast with background
        // This is a simplified check, for true accessibility a more robust solution is needed
        const bgLuminance = parseInt(backgroundHSL.split(' ')[2], 10);
        if (bgLuminance < 50) { // If background is dark
          root.style.setProperty('--foreground', '0 0% 98%'); // Light foreground
          root.style.setProperty('--card-foreground', '0 0% 98%');
          root.style.setProperty('--popover-foreground', '0 0% 98%');
          root.style.setProperty('--primary-foreground', '240 5.9% 10%'); // Dark text on light primary buttons
          root.style.setProperty('--secondary-foreground', '0 0% 98%');
          root.style.setProperty('--muted-foreground', '240 5% 64.9%');
          root.style.setProperty('--accent-foreground', '0 0% 98%');
          root.style.setProperty('--destructive-foreground', '0 0% 98%');
        } else { // If background is light
          root.style.setProperty('--foreground', '240 10% 3.9%'); // Dark foreground
          root.style.setProperty('--card-foreground', '240 10% 3.9%');
          root.style.setProperty('--popover-foreground', '240 10% 3.9%');
          root.style.setProperty('--primary-foreground', '0 0% 98%'); // Light text on dark primary buttons
          root.style.setProperty('--secondary-foreground', '240 5.9% 10%');
          root.style.setProperty('--muted-foreground', '240 3.8% 46.1%');
          root.style.setProperty('--accent-foreground', '240 5.9% 10%');
          root.style.setProperty('--destructive-foreground', '0 0% 98%');
        }
      }


      // Apply border radius
      let radiusValue = '0.5rem'; // Default (medium)
      if (theme.borderRadius === 'small') radiusValue = '0.3rem';
      else if (theme.borderRadius === 'large') radiusValue = '0.75rem';
      root.style.setProperty('--radius', radiusValue);
      
      // Also update the custom theme variables that page.tsx might use for direct styling
      root.style.setProperty('--theme-primary-color', theme.primaryColor);
      root.style.setProperty('--theme-secondary-color', theme.secondaryColor);
      root.style.setProperty('--theme-accent-color', theme.accentColor);
      root.style.setProperty('--theme-bg-color', theme.backgroundColor);

      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    }
  }, [settings, isInitialized]);

  const updateSettingsCallback = useCallback((newSettings: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  const updateThemeCallback = useCallback((themeUpdates: Partial<ThemeSettings>) => {
    setSettings(prev => ({
      ...prev,
      theme: { ...prev.theme, ...themeUpdates }
    }));
  }, []);

  const resetSettingsCallback = useCallback(() => {
    setSettings(defaultSettings); // This will trigger the useEffect to save and apply CSS vars
    console.log("Settings reset to default.");
  }, []);

  const restoreSettingsCallback = useCallback((restoredSettings: AppSettings) => {
    const mergedSettings = {
      ...defaultSettings,
      ...restoredSettings,
      theme: {
        ...defaultSettings.theme,
        ...(restoredSettings.theme || {}),
      },
    };
    setSettings(mergedSettings);
    console.log("Settings restored from backup:", mergedSettings);
  }, []);

  return {
    settings,
    updateSettings: updateSettingsCallback,
    updateTheme: updateThemeCallback,
    resetSettings: resetSettingsCallback,
    restoreSettings: restoreSettingsCallback,
    isInitialized
  };
};
