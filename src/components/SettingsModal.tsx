
import React, { useState, useEffect } from 'react';
import { X, Palette, LayoutGrid, Zap, MonitorPlay, Save, RotateCcw, Trash2 as TrashIcon, Settings as SettingsIcon } from 'lucide-react';
import type { AppSettings, ThemeSettings } from '@/types/bookmark';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (settings: Partial<AppSettings>) => void;
  onUpdateTheme: (theme: Partial<ThemeSettings>) => void;
  onResetSettings: () => void;
  onDeleteAllData: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onUpdateTheme,
  onResetSettings,
  onDeleteAllData
}) => {
  const [activeTab, setActiveTab] = useState<'appearance' | 'behavior' | 'data' | 'advanced'>('appearance');
  const [currentSettings, setCurrentSettings] = useState<AppSettings>(settings);
  const [currentTheme, setCurrentTheme] = useState<ThemeSettings>(settings.theme);

  useEffect(() => {
    setCurrentSettings(settings);
    setCurrentTheme(settings.theme);
  }, [settings, isOpen]);

  const handleSettingChange = (key: keyof AppSettings, value: any) => {
    setCurrentSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleThemeChange = (key: keyof ThemeSettings, value: any) => {
    setCurrentTheme(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    onUpdateSettings(currentSettings); 
    onUpdateTheme(currentTheme); 
    onClose();
  };
  
  const handleReset = () => {
    onResetSettings();
    // onClose(); // Resetting might automatically update settings, let parent handle close if needed based on flow
  };

  const handleDeleteAll = () => {
    onDeleteAllData();
    // Parent (page.tsx) handles confirmation and potentially closing the modal
  };


  if (!isOpen) return null;

  const colorPresets = [
    { name: 'Ocean Blue', primary: '#3B82F6', secondary: '#8B5CF6', accent: '#F59E0B', background: '#F8FAFC' },
    { name: 'Forest Green', primary: '#10B981', secondary: '#059669', accent: '#F59E0B', background: '#F0FDF4' },
    { name: 'Sunset Orange', primary: '#F97316', secondary: '#EA580C', accent: '#EF4444', background: '#FFF7ED' },
    { name: 'Purple Dream', primary: '#8B5CF6', secondary: '#A855F7', accent: '#EC4899', background: '#F5F3FF' },
    { name: 'Rose Gold', primary: '#F43F5E', secondary: '#E11D48', accent: '#F59E0B', background: '#FFF1F2' },
    { name: 'Midnight', primary: '#60A5FA', secondary: '#374151', accent: '#1F2937', background: '#F3F4F6' } 
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card text-card-foreground rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center">
                <SettingsIcon className="w-5 h-5 text-primary-foreground" />
              </div>
              Settings
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-all duration-200"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-56 border-r border-border p-6 overflow-y-auto">
            <nav className="space-y-2">
              {[
                { id: 'appearance', label: 'Appearance', icon: Palette },
                { id: 'behavior', label: 'Behavior', icon: LayoutGrid },
                { id: 'data', label: 'Data Management', icon: TrashIcon },
                { id: 'advanced', label: 'Advanced', icon: Zap }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 text-sm font-medium ${
                    activeTab === tab.id
                      ? 'bg-primary text-primary-foreground shadow-lg'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 p-6 overflow-y-auto space-y-8">
            {activeTab === 'appearance' && (
              <>
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-1">Color Theme</h3>
                  <p className="text-sm text-muted-foreground mb-4">Choose a preset or customize colors below.</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {colorPresets.map(preset => (
                      <button
                        key={preset.name}
                        onClick={() => setCurrentTheme({
                          ...currentTheme, 
                          primaryColor: preset.primary,
                          secondaryColor: preset.secondary,
                          accentColor: preset.accent,
                          backgroundColor: preset.background
                        })}
                        className="p-3 border-2 border-border rounded-xl hover:border-accent transition-all duration-200 hover:scale-105"
                      >
                        <div className="flex gap-2 mb-2">
                          <div className="w-5 h-5 rounded-full border" style={{ backgroundColor: preset.primary }} />
                          <div className="w-5 h-5 rounded-full border" style={{ backgroundColor: preset.secondary }} />
                          <div className="w-5 h-5 rounded-full border" style={{ backgroundColor: preset.accent }} />
                        </div>
                        <p className="text-xs font-medium text-foreground">{preset.name}</p>
                      </button>
                    ))}
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-medium text-muted-foreground">Primary</label>
                        <input type="color" value={currentTheme.primaryColor} onChange={e => handleThemeChange('primaryColor', e.target.value)} className="w-full h-8 p-1 border border-input rounded-md bg-background"/>
                    </div>
                    <div>
                        <label className="text-xs font-medium text-muted-foreground">Background</label>
                        <input type="color" value={currentTheme.backgroundColor} onChange={e => handleThemeChange('backgroundColor', e.target.value)} className="w-full h-8 p-1 border border-input rounded-md bg-background"/>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-1">Card Style</h3>
                   <p className="text-sm text-muted-foreground mb-4">How bookmark cards appear.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                      { id: 'glass', label: 'Glass', description: 'Translucent with blur' },
                      { id: 'solid', label: 'Solid', description: 'Clean and minimal' },
                      { id: 'minimal', label: 'Minimal', description: 'Borderless design' }
                    ].map(style => (
                      <button
                        key={style.id}
                        onClick={() => handleThemeChange('cardStyle', style.id as any)}
                        className={`p-3 border-2 rounded-xl transition-all duration-200 hover:scale-105 text-left ${
                          currentTheme.cardStyle === style.id
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-accent'
                        }`}
                      >
                        <h4 className="font-medium text-foreground text-sm">{style.label}</h4>
                        <p className="text-xs text-muted-foreground">{style.description}</p>
                      </button>
                    ))}
                  </div>
                </div>
                 <div>
                  <h3 className="text-lg font-semibold text-foreground mb-1">Density</h3>
                  <p className="text-sm text-muted-foreground mb-4">Adjust spacing for items in grid/list views.</p>
                  <div className="flex gap-4">
                    {[
                      { id: 'compact', label: 'Compact' },
                      { id: 'comfortable', label: 'Comfortable' },
                      { id: 'spacious', label: 'Spacious' }
                    ].map(density => (
                      <button
                        key={density.id}
                        onClick={() => handleThemeChange('density', density.id as any)}
                        className={`px-4 py-2 border-2 rounded-xl transition-all duration-200 text-sm ${
                          currentTheme.density === density.id
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border hover:border-accent text-muted-foreground'
                        }`}
                      >
                        {density.label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {activeTab === 'behavior' && (
              <>
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-1">Default View</h3>
                  <p className="text-sm text-muted-foreground mb-4">Choose how bookmarks are displayed by default.</p>
                  <div className="flex gap-4">
                    {[
                      { id: 'grid', label: 'Grid View' },
                      { id: 'list', label: 'List View' }
                    ].map(view => (
                      <button
                        key={view.id}
                        onClick={() => handleSettingChange('defaultView', view.id as any)}
                        className={`px-6 py-3 border-2 rounded-xl transition-all duration-200 text-sm ${
                          currentSettings.defaultView === view.id
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border hover:border-accent text-muted-foreground'
                        }`}
                      >
                        {view.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-1">Default Sort</h3>
                  <p className="text-sm text-muted-foreground mb-4">Choose the default sorting for bookmarks.</p>
                  <select
                    value={currentSettings.defaultSort}
                    onChange={(e) => handleSettingChange('defaultSort', e.target.value as any)}
                    className="w-full px-4 py-3 border border-input bg-background rounded-xl focus:ring-2 focus:ring-primary focus:border-primary text-sm"
                  >
                    <option value="dateAdded-desc">📅 Date Added (Newest First)</option>
                    <option value="dateAdded-asc">📅 Date Added (Oldest First)</option>
                    <option value="title-asc">🔤 Title (A-Z)</option>
                    <option value="title-desc">🔤 Title (Z-A)</option>
                    <option value="visits-desc">👁️ Most Visited</option>
                    <option value="visits-asc">👁️ Least Visited</option>
                    <option value="dateModified-desc">✏️ Recently Modified</option>
                    <option value="dateModified-asc">✏️ Oldest Modified</option>
                    <option value="favorites-first">⭐ Favorites First</option>
                    <option value="favorites-last">⭐ Favorites Last</option>
                  </select>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-1">Items Per Page</h3>
                  <p className="text-sm text-muted-foreground mb-4">Number of bookmarks to show per page (for future pagination).</p>
                  <select
                    value={currentSettings.itemsPerPage}
                    onChange={(e) => handleSettingChange('itemsPerPage', parseInt(e.target.value))}
                    className="w-full px-4 py-3 border border-input bg-background rounded-xl focus:ring-2 focus:ring-primary focus:border-primary text-sm"
                  >
                    <option value={10}>10 items</option>
                    <option value={20}>20 items</option>
                    <option value={50}>50 items</option>
                    <option value={100}>100 items</option>
                  </select>
                </div>
              </>
            )}

            {activeTab === 'data' && (
              <>
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-1">Data Management</h3>
                  <p className="text-sm text-muted-foreground mb-4">Manage your application data.</p>
                </div>
                <div className="bg-destructive/10 border border-destructive/30 p-4 rounded-xl">
                  <h4 className="font-semibold text-destructive mb-2">Danger Zone</h4>
                  <p className="text-sm text-destructive/80 mb-4">
                    These actions are irreversible. Please proceed with caution.
                  </p>
                  <button
                    onClick={handleDeleteAll}
                    className="flex items-center gap-2 px-4 py-2 bg-destructive text-destructive-foreground rounded-xl hover:opacity-90 transition-all duration-200 text-sm font-medium hover:scale-105 hover:shadow-lg"
                  >
                    <TrashIcon className="w-4 h-4" />
                    Delete All Bookmarks
                  </button>
                  <p className="text-xs text-destructive/70 mt-2">This will permanently remove all your saved bookmarks.</p>
                </div>
              </>
            )}
            
            {activeTab === 'advanced' && (
             <>
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-1">Display Options</h3>
                   <p className="text-sm text-muted-foreground mb-4">Toggle display of certain bookmark elements.</p>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={currentSettings.showDescriptions}
                        onChange={(e) => handleSettingChange('showDescriptions', e.target.checked)}
                        className="w-4 h-4 text-primary rounded focus:ring-primary border-input"
                      />
                      <span className="text-sm text-muted-foreground">Show bookmark descriptions</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={currentSettings.showVisitCount}
                        onChange={(e) => handleSettingChange('showVisitCount', e.target.checked)}
                        className="w-4 h-4 text-primary rounded focus:ring-primary border-input"
                      />
                      <span className="text-sm text-muted-foreground">Show visit counts</span>
                    </label>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-1">Confirmation & Backup</h3>
                   <p className="text-sm text-muted-foreground mb-4">Manage data safety features.</p>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={currentSettings.confirmDelete}
                        onChange={(e) => handleSettingChange('confirmDelete', e.target.checked)}
                        className="w-4 h-4 text-primary rounded focus:ring-primary border-input"
                      />
                      <span className="text-sm text-muted-foreground">Confirm before deleting individual bookmarks</span>
                    </label>
                     <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={currentSettings.autoBackup}
                        onChange={(e) => handleSettingChange('autoBackup', e.target.checked)}
                        className="w-4 h-4 text-primary rounded focus:ring-primary border-input"
                        disabled // Placeholder
                      />
                      <span className="text-sm text-muted-foreground">Enable automatic backups (future feature)</span>
                    </label>
                  </div>
                </div>



                <div className="pt-6 border-t border-border">
                  <button
                    onClick={handleReset}
                    className="flex items-center gap-2 px-4 py-2 text-destructive hover:bg-destructive/10 rounded-xl transition-all duration-200 text-sm"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Reset All Settings to Default
                  </button>
                </div>
             </>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-border flex justify-end gap-4 bg-muted/50">
          <button
            onClick={onClose}
            className="px-6 py-3 border border-input text-muted-foreground rounded-xl hover:bg-accent hover:text-accent-foreground transition-all duration-200 font-medium text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-all duration-200 font-medium hover:scale-105 hover:shadow-lg text-sm"
          >
            <Save className="w-4 h-4" />
            Save Settings
          </button>
        </div>
      </div>
      
    </div>
  );
};


    