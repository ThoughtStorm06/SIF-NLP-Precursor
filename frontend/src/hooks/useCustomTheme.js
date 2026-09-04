import { useApp } from '../store/AppContext.jsx';

export const useCustomTheme = () => {
  const { theme, setTheme, mode, setMode } = useApp();

  const toggleTheme = () => {
    setTheme(prev => prev === 'oceanic' ? 'warm-terra' : 'oceanic');
  };

  const toggleMode = () => {
    setMode(prev => prev === 'light' ? 'dark' : 'light');
  };

  return { theme, mode, toggleTheme, toggleMode };
};
