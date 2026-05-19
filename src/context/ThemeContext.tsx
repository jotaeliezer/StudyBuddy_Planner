import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type ThemeId =
  | 'default' | 'cottagecore' | 'dark-academia' | 'y2k' | 'angel' | 'cherry' | 'noir'
  | 'forest' | 'ocean' | 'carbon' | 'ember';

export type FontId =
  | 'quicksand' | 'nunito' | 'playfair' | 'cormorant'
  | 'space-grotesk' | 'inter' | 'oswald' | 'roboto';

interface ThemeEntry {
  id: ThemeId;
  name: string;
  emoji: string;
  preview: string;   // hex for swatch bg
  cssClass: string;
  vibe: 'expressive' | 'bold';
  darkText?: boolean; // true = use white text on the swatch
}

interface FontEntry {
  id: FontId;
  name: string;
  label: string;
  cssValue: string;
  vibe: 'soft' | 'sharp';
}

export const THEMES: ThemeEntry[] = [
  // ── Expressive (originally feminine-coded) ──────────────────────────────
  { id: 'default',       name: 'Bubu Pink',      emoji: '🌸', preview: '#FFF9FB', cssClass: '',                   vibe: 'expressive' },
  { id: 'cottagecore',   name: 'Cottagecore',    emoji: '🌿', preview: '#f5f0e8', cssClass: 'theme-cottagecore',   vibe: 'expressive' },
  { id: 'dark-academia', name: 'Dark Academia',  emoji: '📚', preview: '#f2ead8', cssClass: 'theme-dark-academia', vibe: 'expressive' },
  { id: 'y2k',           name: 'Soft Y2K',       emoji: '✨', preview: '#fff0fa', cssClass: 'theme-y2k',           vibe: 'expressive' },
  { id: 'angel',         name: 'Angel Mode',     emoji: '👼', preview: '#f0f6ff', cssClass: 'theme-angel',         vibe: 'expressive' },
  { id: 'cherry',        name: 'Cherry Blossom', emoji: '🌺', preview: '#fff5f7', cssClass: 'theme-cherry',        vibe: 'expressive' },
  { id: 'noir',          name: 'Midnight Noir',  emoji: '🌙', preview: '#1a0a2e', cssClass: 'theme-noir',          vibe: 'expressive', darkText: true },
  // ── Bold & Minimal (masculine-coded) ────────────────────────────────────
  { id: 'forest',        name: 'Forest',         emoji: '🌲', preview: '#eef5ee', cssClass: 'theme-forest',        vibe: 'bold' },
  { id: 'ocean',         name: 'Deep Ocean',     emoji: '🌊', preview: '#dbeafe', cssClass: 'theme-ocean',         vibe: 'bold' },
  { id: 'carbon',        name: 'Carbon',         emoji: '⚡', preview: '#18202e', cssClass: 'theme-carbon',        vibe: 'bold', darkText: true },
  { id: 'ember',         name: 'Ember',          emoji: '🔥', preview: '#fff7ed', cssClass: 'theme-ember',         vibe: 'bold' },
];

export const FONTS: FontEntry[] = [
  // ── Soft & Expressive ───────────────────────────────────────────────────
  { id: 'quicksand',    name: 'Soft & Round',  label: 'Quicksand',          cssValue: '"Quicksand", ui-sans-serif, system-ui, sans-serif',      vibe: 'soft' },
  { id: 'nunito',       name: 'Friendly',      label: 'Nunito',             cssValue: '"Nunito", ui-sans-serif, system-ui, sans-serif',          vibe: 'soft' },
  { id: 'playfair',     name: 'Academic',      label: 'Playfair Display',   cssValue: '"Playfair Display", "Lato", ui-serif, serif',             vibe: 'soft' },
  { id: 'cormorant',    name: 'Dark Academia', label: 'Cormorant Garamond', cssValue: '"Cormorant Garamond", ui-serif, serif',                   vibe: 'soft' },
  // ── Bold & Clean ─────────────────────────────────────────────────────────
  { id: 'space-grotesk', name: 'Modern',    label: 'Space Grotesk', cssValue: '"Space Grotesk", ui-sans-serif, system-ui, sans-serif', vibe: 'sharp' },
  { id: 'inter',         name: 'Clean',     label: 'Inter',         cssValue: '"Inter", ui-sans-serif, system-ui, sans-serif',         vibe: 'sharp' },
  { id: 'oswald',        name: 'Strong',    label: 'Oswald',        cssValue: '"Oswald", ui-sans-serif, system-ui, sans-serif',        vibe: 'sharp' },
  { id: 'roboto',        name: 'Technical', label: 'Roboto',        cssValue: '"Roboto", ui-sans-serif, system-ui, sans-serif',        vibe: 'sharp' },
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
    THEMES.forEach(t => { if (t.cssClass) document.documentElement.classList.remove(t.cssClass); });
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
