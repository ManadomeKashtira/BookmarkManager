import React, { useState, useEffect } from 'react';
import { X, Eye, EyeOff, Copy, RefreshCw, Check, Shield, Settings } from 'lucide-react';
import type { PasswordGeneratorSettings, GeneratedPassword } from '@/types/bookmark';
import { generateSecurePassword, copyToClipboard, DEFAULT_PASSWORD_SETTINGS } from '@/lib/passwordGenerator';
import { PasswordStrengthChecker } from './PasswordStrengthChecker';

interface PasgenModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PasgenModal: React.FC<PasgenModalProps> = ({ isOpen, onClose }) => {
  
  const [settings, setSettings] = useState<PasswordGeneratorSettings>(DEFAULT_PASSWORD_SETTINGS);
  const [generatedPassword, setGeneratedPassword] = useState<GeneratedPassword | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

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
      console.error('Error generating password:', error);
    }
  };

  const handleSettingChange = (key: keyof PasswordGeneratorSettings, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    
    // Auto-generate new password when settings change
    setTimeout(() => {
      generateNewPassword();
    }, 100);
  };

  const handleCopyPassword = async () => {
    if (generatedPassword) {
      const success = await copyToClipboard(generatedPassword.password);
      if (success) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    }
  };

  const resetSettings = () => {
    setSettings(DEFAULT_PASSWORD_SETTINGS);
    setTimeout(() => {
      generateNewPassword();
    }, 100);
  };

  if (!isOpen) return null;

  return (
    <div className="modern-modal">
      <div className="modern-modal-content">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Pasgen</h2>
              <p className="text-sm text-gray-600">Secure Password Generator</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)] modern-scrollbar">
          {/* Generated Password Display */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Generated Password</h3>
              <button
                onClick={generateNewPassword}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Generate new password"
              >
                <RefreshCw className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            
            <div className="relative">
              <div className="flex items-center gap-3 p-4 bg-gray-50/80 rounded-xl border border-gray-200/60">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={generatedPassword?.password || ''}
                  readOnly
                  onChange={(e) => {
                    // Prevent any changes to the password field
                    e.preventDefault();
                    return false;
                  }}
                  className="flex-1 bg-transparent text-lg font-mono text-gray-900 outline-none cursor-text select-all"
                  style={{ userSelect: 'text' }}
                />
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5 text-gray-600" />
                  ) : (
                    <Eye className="w-5 h-5 text-gray-600" />
                  )}
                </button>
                <button
                  onClick={handleCopyPassword}
                  className={`p-2 rounded-lg transition-colors ${
                    copied 
                      ? 'bg-green-100 text-green-600' 
                      : 'hover:bg-gray-200 text-gray-600'
                  }`}
                  title="Copy to clipboard"
                >
                  {copied ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <Copy className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Password Strength */}
            {generatedPassword && (
              <div className="mt-4">
                <PasswordStrengthChecker password={generatedPassword.password} />
              </div>
            )}
          </div>

          {/* Basic Settings */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Password Settings</h3>
            
            {/* Length Slider */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-gray-700">Length: {settings.length}</label>
                <span className="text-sm text-gray-500">8-128 characters</span>
              </div>
              <input
                type="range"
                min="8"
                max="128"
                value={settings.length}
                onChange={(e) => handleSettingChange('length', parseInt(e.target.value))}
                className="slider w-full"
              />
            </div>

            {/* Character Types */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <label className="flex items-center gap-3 p-4 border border-gray-200/60 rounded-xl hover:bg-gray-50/80 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={settings.includeUppercase}
                  onChange={(e) => handleSettingChange('includeUppercase', e.target.checked)}
                  className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                />
                <span className="text-sm font-medium text-gray-700">Uppercase (A-Z)</span>
              </label>
              
              <label className="flex items-center gap-3 p-4 border border-gray-200/60 rounded-xl hover:bg-gray-50/80 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={settings.includeLowercase}
                  onChange={(e) => handleSettingChange('includeLowercase', e.target.checked)}
                  className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                />
                <span className="text-sm font-medium text-gray-700">Lowercase (a-z)</span>
              </label>
              
              <label className="flex items-center gap-3 p-4 border border-gray-200/60 rounded-xl hover:bg-gray-50/80 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={settings.includeNumbers}
                  onChange={(e) => handleSettingChange('includeNumbers', e.target.checked)}
                  className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                />
                <span className="text-sm font-medium text-gray-700">Numbers (0-9)</span>
              </label>
              
              <label className="flex items-center gap-3 p-4 border border-gray-200/60 rounded-xl hover:bg-gray-50/80 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={settings.includeSymbols}
                  onChange={(e) => handleSettingChange('includeSymbols', e.target.checked)}
                  className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                />
                <span className="text-sm font-medium text-gray-700">Symbols (!@#$%^&*)</span>
              </label>
            </div>
          </div>

          {/* Advanced Settings Toggle */}
          <div className="mb-6">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
            >
              <Settings className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-90' : ''}`} />
              Advanced Options
            </button>
          </div>

          {/* Advanced Settings */}
          {showAdvanced && (
            <div className="mb-8 p-6 bg-gray-50/80 rounded-xl border border-gray-200/60">
              <div className="space-y-6">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.excludeSimilar}
                    onChange={(e) => handleSettingChange('excludeSimilar', e.target.checked)}
                    className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-700">Exclude similar characters</span>
                    <p className="text-xs text-gray-500">Exclude l, 1, I, O, 0 to avoid confusion</p>
                  </div>
                </label>
                
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.excludeAmbiguous}
                    onChange={(e) => handleSettingChange('excludeAmbiguous', e.target.checked)}
                    className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-700">Exclude ambiguous characters</span>
                    <p className="text-xs text-gray-500">Exclude characters that look similar in different fonts</p>
                  </div>
                </label>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Custom characters to exclude
                  </label>
                  <input
                    type="text"
                    value={settings.customExclude}
                    onChange={(e) => handleSettingChange('customExclude', e.target.value)}
                    placeholder="e.g., @#$%"
                    className="modern-input"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Enter specific characters you want to exclude from the password
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={resetSettings}
              className="modern-btn modern-btn-secondary flex-1"
            >
              Reset to Default
            </button>
            <button
              onClick={generateNewPassword}
              className="modern-btn flex-1 bg-gradient-to-r from-purple-500 to-pink-600 text-white hover:from-purple-600 hover:to-pink-700 hover:shadow-lg hover:shadow-purple-500/25"
            >
              Generate New Password
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}; 