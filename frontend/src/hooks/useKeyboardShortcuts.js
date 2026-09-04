import { useEffect } from 'react';
import { useApp } from '../store/AppContext.jsx';

export const useKeyboardShortcuts = () => {
  const { 
    drawerOpen, 
    closeReport, 
    openNextReport, 
    setCapaModalOpen, 
    setOverrideModalOpen,
    overrideModalOpen,
    capaModalOpen
  } = useApp();

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Do not trigger if typing inside input, textarea, or select
      const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
      if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') {
        return;
      }

      // Escape closes modal or drawer
      if (e.key === 'Escape') {
        if (overrideModalOpen) setOverrideModalOpen(false);
        else if (capaModalOpen) setCapaModalOpen(false);
        else if (drawerOpen) closeReport();
        return;
      }

      // Shortcuts E, O, J, K only trigger when report detail drawer is open
      if (!drawerOpen) return;

      if (e.key === 'e' || e.key === 'E') {
        e.preventDefault();
        setCapaModalOpen(true);
      } else if (e.key === 'o' || e.key === 'O') {
        e.preventDefault();
        setOverrideModalOpen(true);
      } else if (e.key === 'j' || e.key === 'J') {
        e.preventDefault();
        openNextReport();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [drawerOpen, overrideModalOpen, capaModalOpen, closeReport, openNextReport, setCapaModalOpen, setOverrideModalOpen]);
};
