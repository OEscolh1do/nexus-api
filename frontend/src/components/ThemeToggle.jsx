import { Moon, Sun } from 'lucide-react';
import useThemeStore from '../store/useThemeStore';
import { useEffect } from 'react';

function ThemeToggle() {
  const { theme, toggleTheme } = useThemeStore();

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  return (
    <button
      onClick={toggleTheme}
      className="flex items-center justify-between w-full px-4 py-3 rounded-lg bg-neo-surface-1 text-neo-text-sec hover:bg-neo-surface-2 hover:text-neo-text-primary transition-all border border-neo-surface-2/50 group"
      title={`Mudar para modo ${theme === 'dark' ? 'Claro' : 'Escuro'}`}
    >
      <span className="text-sm font-medium">
        Modo {theme === 'dark' ? 'Noturno' : 'Claro'}
      </span>
      <div className="relative w-8 h-8 flex items-center justify-center rounded-full bg-neo-bg-main group-hover:scale-110 transition-transform">
        {theme === 'dark' ? (
          <Moon size={18} className="text-neo-purple-light" />
        ) : (
          <Sun size={18} className="text-orange-400" />
        )}
      </div>
    </button>
  );
}

export default ThemeToggle;