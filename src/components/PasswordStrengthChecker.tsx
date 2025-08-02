import React from 'react';
import { Shield, AlertTriangle, CheckCircle } from 'lucide-react';
import { calculatePasswordStrength } from '@/lib/passwordGenerator';
import type { PasswordStrength } from '@/types/bookmark';

interface PasswordStrengthCheckerProps {
  password: string;
  showDetails?: boolean;
  className?: string;
}

export const PasswordStrengthChecker: React.FC<PasswordStrengthCheckerProps> = ({
  password,
  showDetails = true,
  className = ''
}) => {
  const strength: PasswordStrength = calculatePasswordStrength(password);

  const getStrengthColor = (level: string) => {
    switch (level) {
      case 'very-weak': return 'text-red-500 bg-red-50 border-red-200';
      case 'weak': return 'text-orange-500 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-500 bg-yellow-50 border-yellow-200';
      case 'strong': return 'text-blue-500 bg-blue-50 border-blue-200';
      case 'very-strong': return 'text-green-500 bg-green-50 border-green-200';
      default: return 'text-gray-500 bg-gray-50 border-gray-200';
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

  const getStrengthIcon = (level: string) => {
    switch (level) {
      case 'very-weak':
      case 'weak':
        return <AlertTriangle className="w-4 h-4" />;
      case 'medium':
        return <Shield className="w-4 h-4" />;
      case 'strong':
      case 'very-strong':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Shield className="w-4 h-4" />;
    }
  };

  if (!password) {
    return null;
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Strength Indicator */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">Password Strength</span>
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full border text-sm font-medium ${getStrengthColor(strength.level)}`}>
          {getStrengthIcon(strength.level)}
          {strength.level.replace('-', ' ').toUpperCase()}
        </div>
      </div>

      {/* Strength Bar */}
      <div className="w-full bg-muted rounded-full h-2">
        <div 
          className={`h-2 rounded-full transition-all duration-300 ${getStrengthBarColor(strength.level)}`}
          style={{ width: `${strength.score}%` }}
        />
      </div>

      {/* Details */}
      {showDetails && (
        <div className="space-y-2">
          {/* Metrics */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Score:</span>
              <span className="ml-2 font-medium">{strength.score}/100</span>
            </div>
            <div>
              <span className="text-muted-foreground">Entropy:</span>
              <span className="ml-2 font-medium">{Math.round(strength.entropy)} bits</span>
            </div>
            <div>
              <span className="text-muted-foreground">Time to crack:</span>
              <span className="ml-2 font-medium">{strength.timeToCrack}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Length:</span>
              <span className="ml-2 font-medium">{password.length} chars</span>
            </div>
          </div>

          {/* Feedback */}
          {strength.feedback.length > 0 && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium mb-1">Suggestions:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {strength.feedback.map((feedback, index) => (
                      <li key={index}>{feedback}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}; 