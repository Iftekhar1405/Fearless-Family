'use client';

import { useTheme } from '@/client/hooks/use-theme';
import { Moon, Sun } from 'lucide-react';
import { Button } from './ui/button';


interface ThemeToggleProps {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function ThemeToggle({ 
  variant = 'ghost', 
  size = 'md',
  showLabel = false 
}: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();

  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12'
  };

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };

  if (showLabel) {
    return (
      <Button
        variant={variant}
        onClick={toggleTheme}
        className="flex items-center gap-2 px-4 py-2"
      >
        {theme === 'light' ? (
          <>
            <Moon className={iconSizes[size]} />
            Dark
          </>
        ) : (
          <>
            <Sun className={iconSizes[size]} />
            Light
          </>
        )}
      </Button>
    );
  }

  return (
    <Button
      variant={variant}
      size="icon"
      onClick={toggleTheme}
      className={sizeClasses[size]}
    >
      {theme === 'light' ? (
        <Moon className={iconSizes[size]} />
      ) : (
        <Sun className={iconSizes[size]} />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}

// Alternative animated toggle component with smooth transitions
export function AnimatedThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="h-10 w-10 relative overflow-hidden"
    >
      <div className="relative w-5 h-5">
        <Sun 
          className={`h-5 w-5 absolute top-0 left-0 transition-all duration-300 transform ${
            theme === 'light' 
              ? 'rotate-0 scale-100 opacity-100' 
              : 'rotate-90 scale-0 opacity-0'
          }`} 
        />
        <Moon 
          className={`h-5 w-5 absolute top-0 left-0 transition-all duration-300 transform ${
            theme === 'dark' 
              ? 'rotate-0 scale-100 opacity-100' 
              : '-rotate-90 scale-0 opacity-0'
          }`} 
        />
      </div>
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}