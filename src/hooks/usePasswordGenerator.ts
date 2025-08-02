import { useState, useCallback } from 'react';
import type { PasswordGeneratorSettings, GeneratedPassword } from '@/types/bookmark';
import { generateSecurePassword, copyToClipboard, DEFAULT_PASSWORD_SETTINGS } from '@/lib/passwordGenerator';

export const usePasswordGenerator = () => {
  const [settings, setSettings] = useState<PasswordGeneratorSettings>(DEFAULT_PASSWORD_SETTINGS);
  const [generatedPassword, setGeneratedPassword] = useState<GeneratedPassword | null>(null);
  const [copied, setCopied] = useState(false);

  const generatePassword = useCallback(() => {
    try {
      const newPassword = generateSecurePassword(settings);
      setGeneratedPassword(newPassword);
      setCopied(false);
      return newPassword;
    } catch (error) {
      console.error('Failed to generate password:', error);
      return null;
    }
  }, [settings]);

  const updateSettings = useCallback((newSettings: Partial<PasswordGeneratorSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    
    // Regenerate password with new settings
    setTimeout(() => {
      try {
        const newPassword = generateSecurePassword(updatedSettings);
        setGeneratedPassword(newPassword);
        setCopied(false);
      } catch (error) {
        console.error('Failed to regenerate password:', error);
      }
    }, 100);
  }, [settings]);

  const copyPassword = useCallback(async () => {
    if (!generatedPassword) return false;
    
    const success = await copyToClipboard(generatedPassword.password);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
    return success;
  }, [generatedPassword]);

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_PASSWORD_SETTINGS);
    generatePassword();
  }, [generatePassword]);

  return {
    settings,
    generatedPassword,
    copied,
    generatePassword,
    updateSettings,
    copyPassword,
    resetSettings
  };
}; 