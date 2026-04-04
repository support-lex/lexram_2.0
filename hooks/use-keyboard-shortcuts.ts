import { useEffect } from 'react';

type ShortcutMap = {
  [key: string]: (e: KeyboardEvent) => void;
};

export function useKeyboardShortcuts(shortcuts: ShortcutMap) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      for (const [keyCombo, callback] of Object.entries(shortcuts)) {
        const keys = keyCombo.toLowerCase().split('+');
        
        const isCmdOrCtrl = keys.includes('cmd') || keys.includes('ctrl');
        const isShift = keys.includes('shift');
        const key = keys.find(k => k !== 'cmd' && k !== 'ctrl' && k !== 'shift');

        const cmdMatch = isCmdOrCtrl ? (e.metaKey || e.ctrlKey) : !(e.metaKey || e.ctrlKey);
        const shiftMatch = isShift ? e.shiftKey : !e.shiftKey;
        const keyMatch = key ? e.key.toLowerCase() === key : true;

        if (cmdMatch && shiftMatch && keyMatch) {
          e.preventDefault();
          callback(e);
          return; // Stop after first match
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
}
