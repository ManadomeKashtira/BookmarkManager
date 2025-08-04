import React, { useState, useEffect } from 'react';
import { X, Copy, RefreshCw, Eye, EyeOff, Shield, Zap, Settings, Check, AlertTriangle } from 'lucide-react';
import type { PasswordGeneratorSettings, GeneratedPassword } from '@/types/bookmark';
import { generateSecurePassword, copyToClipboard, DEFAULT_PASSWORD_SETTINGS } from '@/lib/passwordGenerator';

interface PasswordGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PasswordGeneratorModal: React.FC<PasswordGeneratorModalProps> = ({
  isOpen,
  onClose
}) => {
  const [settings, setSettings] = useState<PasswordGeneratorSettings>(DEFAULT_PASSWORD_SETTINGS);
  const [generatedPassword, setGeneratedPassword] = useState<GeneratedPassword | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Generate initial password on mount
  useEffect(() => {
    if (isOpen) {
      generateNewPassword();
    }
  }, [isOpen]);

  const generateNewPassword = () => {
    try {
      const newPassword = generateSecurePassword(settings);
      setGeneratedPassword(newPassword);
      setCopied(false);
    } catch (error) {
      console.error('Failed to generate password:', error);
    }
  };

  const handleCopyPassword = async () => {
    if (!generatedPassword) return;
    
    const success = await copyToClipboard(generatedPassword.password);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSettingChange = (key: keyof PasswordGeneratorSettings, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    
    // Regenerate password if settings change
    setTimeout(() => {
      try {
        const newPassword = generateSecurePassword(newSettings);
        setGeneratedPassword(newPassword);
        setCopied(false);
      } catch (error) {
        console.error('Failed to regenerate password:', error);
      }
    }, 100);
  };

  const getStrengthColor = (level: string) => {
    switch (level) {
      case 'very-weak': return 'text-red-500 bg-red-50';
      case 'weak': return 'text-orange-500 bg-orange-50';
      case 'medium': return 'text-yellow-500 bg-yellow-50';
      case 'strong': return 'text-blue-500 bg-blue-50';
      case 'very-strong': return 'text-green-500 bg-green-50';
      default: return 'text-gray-500 bg-gray-50';
    }
  };

  const getStrengthBarColor = (level: string) => {
    switch (level) {
      case 'very-weak': return 'bg-red-500';
      case 'weak': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'strong': return 'bg-blue-500';
      case 'very-strong': return 'bg-green-500';
      default: return 'bg-gray-300';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card text-card-foreground rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary-foreground" />
              </div>
              Password Generator
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-all duration-200"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Generated Password Display */}
          {generatedPassword && (
            <div className="space-y-4">
              <div className="relative">
                <div className="flex items-center gap-2 p-4 bg-muted rounded-xl border border-border">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={generatedPassword.password}
                    readOnly
                    className="flex-1 bg-transparent text-lg font-mono outline-none"
                  />
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={handleCopyPassword}
                    className={`p-2 rounded-lg transition-all duration-200 ${
                      copied 
                        ? 'text-green-500 bg-green-50' 
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                  >
                    {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Password Strength */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Password Strength</span>
                  <span className={`text-sm font-medium px-2 py-1 rounded-full ${getStrengthColor(generatedPassword.strength.level)}`}>
                    {generatedPassword.strength.level.replace('-', ' ').toUpperCase()}
                  </span>
                </div>
                
                {/* Strength Bar */}
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${getStrengthBarColor(generatedPassword.strength.level)}`}
                    style={{ width: `${generatedPassword.strength.score}%` }}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Score:</span>
                    <span className="ml-2 font-medium">{generatedPassword.strength.score}/100</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Entropy:</span>
                    <span className="ml-2 font-medium">{Math.round(generatedPassword.strength.entropy)} bits</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Time to crack:</span>
                    <span className="ml-2 font-medium">{generatedPassword.strength.timeToCrack}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Length:</span>
                    <span className="ml-2 font-medium">{generatedPassword.password.length} chars</span>
                  </div>
                </div>

                {/* Feedback */}
                {generatedPassword.strength.feedback.length > 0 && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-yellow-800">
                        <p className="font-medium mb-1">Suggestions:</p>
                        <ul className="list-disc list-inside space-y-1">
                          {generatedPassword.strength.feedback.map((feedback, index) => (
                            <li key={index}>{feedback}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Settings */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Generator Settings
              </h3>
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-sm text-primary hover:text-primary/80 transition-colors"
              >
                {showAdvanced ? 'Hide' : 'Show'} Advanced
              </button>
            </div>

            {/* Basic Settings */}
            <div className="space-y-4">
              {/* Length */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Password Length: {settings.length}
                </label>
                <input
                  type="range"
                  min="8"
                  max="64"
                  value={settings.length}
                  onChange={(e) => handleSettingChange('length', parseInt(e.target.value))}
                  className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>8</span>
                  <span>16</span>
                  <span>32</span>
                  <span>64</span>
                </div>
              </div>

              {/* Character Types */}
              <div className="grid grid-cols-2 gap-4">
                <label className="flex items-center gap-3 p-3 border border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                  <input
                    type="checkbox"
                    checked={settings.includeUppercase}
                    onChange={(e) => handleSettingChange('includeUppercase', e.target.checked)}
                    className="w-4 h-4 text-primary"
                  />
                  <span className="text-sm font-medium">Uppercase (A-Z)</span>
                </label>

                <label className="flex items-center gap-3 p-3 border border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                  <input
                    type="checkbox"
                    checked={settings.includeLowercase}
                    onChange={(e) => handleSettingChange('includeLowercase', e.target.checked)}
                    className="w-4 h-4 text-primary"
                  />
                  <span className="text-sm font-medium">Lowercase (a-z)</span>
                </label>

                <label className="flex items-center gap-3 p-3 border border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                  <input
                    type="checkbox"
                    checked={settings.includeNumbers}
                    onChange={(e) => handleSettingChange('includeNumbers', e.target.checked)}
                    className="w-4 h-4 text-primary"
                  />
                  <span className="text-sm font-medium">Numbers (0-9)</span>
                </label>

                <label className="flex items-center gap-3 p-3 border border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                  <input
                    type="checkbox"
                    checked={settings.includeSymbols}
                    onChange={(e) => handleSettingChange('includeSymbols', e.target.checked)}
                    className="w-4 h-4 text-primary"
                  />
                  <span className="text-sm font-medium">Symbols (!@#$%^&*)</span>
                </label>
              </div>
            </div>

            {/* Advanced Settings */}
            {showAdvanced && (
              <div className="space-y-4 p-4 bg-muted/30 rounded-xl border border-border">
                <h4 className="font-medium text-foreground">Advanced Options</h4>
                
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.excludeSimilar}
                      onChange={(e) => handleSettingChange('excludeSimilar', e.target.checked)}
                      className="w-4 h-4 text-primary"
                    />
                    <span className="text-sm">Exclude similar characters (l, 1, I, O, 0)</span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.excludeAmbiguous}
                      onChange={(e) => handleSettingChange('excludeAmbiguous', e.target.checked)}
                      className="w-4 h-4 text-primary"
                    />
                    <span className="text-sm">Exclude ambiguous characters ({'{}[]()/\\\'"`~,;:.<>'})</span>
                  </label>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Custom characters to exclude:
                    </label>
                    <input
                      type="text"
                      value={settings.customExclude}
                      onChange={(e) => handleSettingChange('customExclude', e.target.value)}
                      placeholder="Enter characters to exclude..."
                      className="w-full p-2 border border-border rounded-lg bg-background text-foreground"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border flex items-center justify-between">
          <button
            onClick={() => setSettings(DEFAULT_PASSWORD_SETTINGS)}
            className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Reset to Defaults
          </button>
          
          <div className="flex items-center gap-3">
            <button
              onClick={generateNewPassword}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Generate New
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}; 