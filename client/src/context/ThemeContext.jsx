import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext({});

const THEME_VARS = [
  ['primary', '--primary'],
  ['primaryDark', '--primary-dark'],
  ['secondary', '--secondary'],
  ['accent', '--accent'],
  ['bgPrimary', '--bg-primary'],
  ['bgSecondary', '--bg-secondary'],
  ['bgCard', '--bg-card'],
  ['textPrimary', '--text-primary'],
  ['textSecondary', '--text-secondary'],
  ['gradient', '--gradient'],
  ['gradientBg', '--gradient-bg'],
  ['glow', '--glow'],
];

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadActiveTheme(); }, []);

  const applyTheme = (config) => {
    const root = document.documentElement;
    THEME_VARS.forEach(([key, cssVar]) => {
      if (config[key]) root.style.setProperty(cssVar, config[key]);
    });
  };

  const loadActiveTheme = async () => {
    try {
      const res = await fetch('/api/themes/active');
      const data = await res.json();
      if (data.config) {
        applyTheme(data.config);
        setTheme(data);
      }
    } catch {
      // keep default CSS var values
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, loading, loadActiveTheme, applyTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
