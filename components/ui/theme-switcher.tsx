'use client';

import React, { useState, useEffect } from 'react';
import { Palette, Check } from 'lucide-react';

export interface ThemeOption {
  id: string;
  name: string;
  rgb: string; // space-separated RGB: "0 0 247"
  hoverRgb: string;
  foregroundRgb: string;
  colorHex: string; // for UI swatches
}

export const THEME_PRESETS: ThemeOption[] = [
  {
    id: 'navy',
    name: 'STI Navy',
    rgb: '0 0 247',
    hoverRgb: '0 0 196',
    foregroundRgb: '255 255 255',
    colorHex: '#0000F7',
  },
  {
    id: 'emerald',
    name: 'Emerald Green',
    rgb: '5 150 105',
    hoverRgb: '4 120 87',
    foregroundRgb: '255 255 255',
    colorHex: '#059669',
  },
  {
    id: 'indigo',
    name: 'Royal Indigo',
    rgb: '79 70 229',
    hoverRgb: '67 56 202',
    foregroundRgb: '255 255 255',
    colorHex: '#4F46E5',
  },
  {
    id: 'crimson',
    name: 'Crimson Rose',
    rgb: '225 29 72',
    hoverRgb: '190 18 60',
    foregroundRgb: '255 255 255',
    colorHex: '#E11D48',
  },
  {
    id: 'slate',
    name: 'Slate Steel',
    rgb: '51 65 85',
    hoverRgb: '30 41 59',
    foregroundRgb: '255 255 255',
    colorHex: '#334155',
  },
  {
    id: 'ocean',
    name: 'Ocean Blue',
    rgb: '2 132 199',
    hoverRgb: '3 105 161',
    foregroundRgb: '255 255 255',
    colorHex: '#0284C7',
  },
];

export function applyTheme(theme: ThemeOption) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.style.setProperty('--color-primary', `rgb(${theme.rgb})`);
  root.style.setProperty('--color-primary-hover', `rgb(${theme.hoverRgb})`);
  root.style.setProperty('--color-primary-foreground', `rgb(${theme.foregroundRgb})`);
  root.style.setProperty('--color-primary-raw', theme.rgb);
  try {
    localStorage.setItem('app-theme-id', theme.id);
  } catch {
    // Ignore private browsing
  }
}

export function ThemeSwitcher() {
  const [activeThemeId, setActiveThemeId] = useState<string>('navy');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('app-theme-id');
      if (saved) {
        const found = THEME_PRESETS.find((t) => t.id === saved);
        if (found) {
          setActiveThemeId(found.id);
          applyTheme(found);
        }
      }
    } catch {
      // Ignore
    }

    const handleExternalChange = () => {
      try {
        const saved = localStorage.getItem('app-theme-id');
        if (saved) {
          const found = THEME_PRESETS.find((t) => t.id === saved);
          if (found) setActiveThemeId(found.id);
        }
      } catch {}
    };

    window.addEventListener('storage', handleExternalChange);
    return () => window.removeEventListener('storage', handleExternalChange);
  }, []);

  const handleSelect = (theme: ThemeOption) => {
    setActiveThemeId(theme.id);
    applyTheme(theme);
    setIsOpen(false);
  };

  const activeTheme = THEME_PRESETS.find((t) => t.id === activeThemeId) || THEME_PRESETS[0];

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-xs font-semibold text-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
        title="Switch color theme"
      >
        <div
          className="w-3.5 h-3.5 rounded-full border border-black/10 flex-shrink-0"
          style={{ backgroundColor: activeTheme.colorHex }}
        />
        <span className="hidden sm:inline font-medium">{activeTheme.name}</span>
        <Palette className="w-3.5 h-3.5 text-gray-400" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-48 rounded-xl border border-gray-200 bg-white p-2 z-50 animate-scale-in shadow-sm">
            <div className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-gray-400 border-b border-gray-100 mb-1">
              Select Theme Palette
            </div>
            <div className="space-y-0.5">
              {THEME_PRESETS.map((theme) => {
                const isSelected = theme.id === activeThemeId;
                return (
                  <button
                    key={theme.id}
                    onClick={() => handleSelect(theme)}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs transition-colors ${
                      isSelected
                        ? 'bg-primary/10 text-primary font-bold'
                        : 'text-gray-700 hover:bg-gray-100 font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-black/10 flex-shrink-0"
                        style={{ backgroundColor: theme.colorHex }}
                      />
                      <span>{theme.name}</span>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
