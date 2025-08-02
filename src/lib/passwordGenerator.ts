import type { PasswordGeneratorSettings, PasswordStrength, GeneratedPassword } from '@/types/bookmark';

// Character sets for password generation
const CHARACTER_SETS = {
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  numbers: '0123456789',
  symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?',
  similar: 'l1IO0', // Characters that look similar
  ambiguous: '{}[]()/\\\'"`~,;:.<>' // Ambiguous characters
};

// Secure random number generator using crypto API
function getSecureRandomInt(min: number, max: number): number {
  const range = max - min + 1;
  const bytesNeeded = Math.ceil(Math.log2(range) / 8);
  const maxNum = Math.pow(256, bytesNeeded);
  const maxValidNum = maxNum - (maxNum % range);
  
  let randomValue: number;
  do {
    const randomBytes = new Uint8Array(bytesNeeded);
    crypto.getRandomValues(randomBytes);
    randomValue = randomBytes.reduce((acc, byte) => (acc << 8) + byte, 0);
  } while (randomValue >= maxValidNum);
  
  return min + (randomValue % range);
}

// Generate a secure random password based on settings
export function generatePassword(settings: PasswordGeneratorSettings): string {
  let availableChars = '';
  let requiredChars = '';
  
  // Build character set based on settings
  if (settings.includeUppercase) {
    availableChars += CHARACTER_SETS.uppercase;
    requiredChars += CHARACTER_SETS.uppercase[getSecureRandomInt(0, CHARACTER_SETS.uppercase.length - 1)];
  }
  
  if (settings.includeLowercase) {
    availableChars += CHARACTER_SETS.lowercase;
    requiredChars += CHARACTER_SETS.lowercase[getSecureRandomInt(0, CHARACTER_SETS.lowercase.length - 1)];
  }
  
  if (settings.includeNumbers) {
    availableChars += CHARACTER_SETS.numbers;
    requiredChars += CHARACTER_SETS.numbers[getSecureRandomInt(0, CHARACTER_SETS.numbers.length - 1)];
  }
  
  if (settings.includeSymbols) {
    availableChars += CHARACTER_SETS.symbols;
    requiredChars += CHARACTER_SETS.symbols[getSecureRandomInt(0, CHARACTER_SETS.symbols.length - 1)];
  }
  
  // Remove excluded characters
  if (settings.excludeSimilar) {
    availableChars = availableChars.split('').filter(char => !CHARACTER_SETS.similar.includes(char)).join('');
  }
  
  if (settings.excludeAmbiguous) {
    availableChars = availableChars.split('').filter(char => !CHARACTER_SETS.ambiguous.includes(char)).join('');
  }
  
  if (settings.customExclude) {
    availableChars = availableChars.split('').filter(char => !settings.customExclude.includes(char)).join('');
  }
  
  // Ensure we have enough characters
  if (availableChars.length === 0) {
    throw new Error('No characters available for password generation. Please adjust your settings.');
  }
  
  // Generate the password
  let password = '';
  const remainingLength = settings.length - requiredChars.length;
  
  // Add required characters first
  password = requiredChars;
  
  // Fill the rest with random characters
  for (let i = 0; i < remainingLength; i++) {
    const randomIndex = getSecureRandomInt(0, availableChars.length - 1);
    password += availableChars[randomIndex];
  }
  
  // Shuffle the password to avoid predictable patterns
  return shuffleString(password);
}

// Fisher-Yates shuffle algorithm
function shuffleString(str: string): string {
  const chars = str.split('');
  for (let i = chars.length - 1; i > 0; i--) {
    const j = getSecureRandomInt(0, i);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}

// Calculate password strength and provide feedback
export function calculatePasswordStrength(password: string): PasswordStrength {
  let score = 0;
  const feedback: string[] = [];
  
  // Length scoring
  if (password.length < 8) {
    feedback.push('Password is too short (minimum 8 characters)');
  } else if (password.length >= 12) {
    score += 25;
  } else if (password.length >= 10) {
    score += 20;
  } else {
    score += 15;
  }
  
  // Character variety scoring
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSymbols = /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password);
  
  if (hasUppercase) score += 10;
  if (hasLowercase) score += 10;
  if (hasNumbers) score += 10;
  if (hasSymbols) score += 15;
  
  // Feedback for missing character types
  if (!hasUppercase) feedback.push('Add uppercase letters');
  if (!hasLowercase) feedback.push('Add lowercase letters');
  if (!hasNumbers) feedback.push('Add numbers');
  if (!hasSymbols) feedback.push('Add symbols');
  
  // Entropy calculation
  let charsetSize = 0;
  if (hasUppercase) charsetSize += 26;
  if (hasLowercase) charsetSize += 26;
  if (hasNumbers) charsetSize += 10;
  if (hasSymbols) charsetSize += 32; // Approximate symbol count
  
  const entropy = Math.log2(Math.pow(charsetSize, password.length));
  
  // Bonus for length and complexity
  if (password.length >= 16) score += 10;
  if (entropy >= 128) score += 10;
  else if (entropy >= 64) score += 5;
  
  // Penalty for common patterns
  if (/(.)\1{2,}/.test(password)) {
    score -= 10;
    feedback.push('Avoid repeated characters');
  }
  
  if (/^(.)\1+$/.test(password)) {
    score -= 20;
    feedback.push('Avoid using the same character repeatedly');
  }
  
  // Sequential patterns
  if (/abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz/i.test(password)) {
    score -= 10;
    feedback.push('Avoid sequential characters');
  }
  
  // Ensure score is within bounds
  score = Math.max(0, Math.min(100, score));
  
  // Determine strength level
  let level: PasswordStrength['level'];
  if (score >= 80) level = 'very-strong';
  else if (score >= 60) level = 'strong';
  else if (score >= 40) level = 'medium';
  else if (score >= 20) level = 'weak';
  else level = 'very-weak';
  
  // Estimate time to crack (very rough approximation)
  const timeToCrack = estimateTimeToCrack(entropy);
  
  return {
    score,
    level,
    feedback,
    entropy,
    timeToCrack
  };
}

// Rough estimation of time to crack based on entropy
function estimateTimeToCrack(entropy: number): string {
  // Assuming 1 billion attempts per second (modern GPU)
  const attemptsPerSecond = 1e9;
  const totalAttempts = Math.pow(2, entropy);
  const seconds = totalAttempts / attemptsPerSecond;
  
  if (seconds < 1) return 'Instantly';
  if (seconds < 60) return `${Math.round(seconds)} seconds`;
  if (seconds < 3600) return `${Math.round(seconds / 60)} minutes`;
  if (seconds < 86400) return `${Math.round(seconds / 3600)} hours`;
  if (seconds < 31536000) return `${Math.round(seconds / 86400)} days`;
  if (seconds < 31536000000) return `${Math.round(seconds / 31536000)} years`;
  return `${Math.round(seconds / 31536000000)} centuries`;
}

// Generate a complete password with strength analysis
export function generateSecurePassword(settings: PasswordGeneratorSettings): GeneratedPassword {
  const password = generatePassword(settings);
  const strength = calculatePasswordStrength(password);
  
  return {
    password,
    strength,
    timestamp: new Date(),
    settings
  };
}

// Copy password to clipboard
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for non-secure contexts
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const result = document.execCommand('copy');
      document.body.removeChild(textArea);
      return result;
    }
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}

// Default password generator settings
export const DEFAULT_PASSWORD_SETTINGS: PasswordGeneratorSettings = {
  length: 16,
  includeUppercase: true,
  includeLowercase: true,
  includeNumbers: true,
  includeSymbols: true,
  excludeSimilar: false,
  excludeAmbiguous: false,
  customExclude: ''
}; 