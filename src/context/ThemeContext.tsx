import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type ThemeId = 'default' | 'cottagecore' | 'dark-academia' | 'y2k' | 'angel' | 'cherry' | 'noir';
export type FontId = 'quicksand' | 'playfair' | 'cormorant' | 'nunito';

interface ThemeEntry {
  id: ThemeId;
  name: string;
  emoji: string;
  preview: string; // hex color for swatch
  darkPreview?: string;
  cssClass: string;
}

interface FontEntry {
  id: FontId;
  name: string;
  label: string;
  cssValue: string;
}

export const THEMES: ThemeEntry[] = [
  { id: 'default', name: 'Bubu Pink', emoji: '🌸', preview: '#FFF9FB', cssClass: '' },
  { id: 'cottagecore', name: 'Cottagecore', emoji: '🌿', preview: '#f5f0e8', cssClass: 'theme-cottagecore' },
  { id: 'dark-academia', name: 'Dark Academia', emoji: '📚', preview: '#f2ead8', cssClass: 'theme-dark-academia' },
  { id: 'y2k', name: 'Soft Y2K', emoji: '✨', preview: '#fff0fa', cssClass: 'theme-y2k' },
  { id: 'angel', name: 'Angel Mode', emoji: '👼', preview: '#f0f6ff', cssClass: 'theme-angel' },
  { id: 'cherry', name: 'Cherry Blossom', emoji: '🌺', preview: '#fff5f7', cssClass: 'theme-cherry' },
  { id: 'noir', name: 'Midnight Noir', emoji: '🌙', preview: '#1a0a2e', cssClass: 'theme-noir' },
];

export const FONTS: FontEntry[] = [
  { id: 'quicksand', name: 'Soft & Round', label: 'Quicksand', cssValue: '"Quicksand", ui-sans-serif, system-ui, sans-serif' },
  { id: 'nunito', name: 'Friendly', label: 'Nunito', cssValue: '"Nunito", ui-sans-serif, system-ui, sans-serif' },
  { id: 'playfair', name: 'Academic', label: 'Playfair Display', cssValue: '"Playfair Display", "Lato", ui-serif, serif' },
  { id: 'cormorant', name: 'Dark Academia', label: 'Cormorant Garamond', cssValue: '"Cormorant Garamond", ui-serif, serif' },
];

interface ThemeContextValue {
  themeId: ThemeId;
  fontId: FontId;
  setTheme: (id: ThemeId) => void;
  setFont: (id: FontId) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeId, setThemeId] = useState<ThemeId>(() => {
    try { return (localStorage.getItem('planner_theme') as ThemeId) || 'default'; } catch { return 'default'; }
  });
  const [fontId, setFontId] = useState<FontId>(() => {
    try { return (localStorage.getItem('planner_font') as FontId) || 'quicksand'; } catch { return 'quicksand'; }
  });

  useEffect(() => {
    const theme = THEMES.find(t => t.id === themeId);
    // Remove all theme classes
    THEMES.forEach(t => { if (t.cssClass) document.documentElement.classList.remove(t.cssClass); });
    // Apply new theme class
    if (theme?.cssClass) document.documentElement.classList.add(theme.cssClass);
    try { localStorage.setItem('planner_theme', themeId); } catch {}
  }, [themeId]);

  useEffect(() => {
    const font = FONTS.find(f => f.id === fontId);
    if (font) document.documentElement.style.setProperty('--font-sans', font.cssValue);
    try { localStorage.setItem('planner_font', fontId); } catch {}
  }, [fontId]);

  return (
    <ThemeContext.Provider value={{ themeId, fontId, setTheme: setThemeId, setFont: setFontId }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
