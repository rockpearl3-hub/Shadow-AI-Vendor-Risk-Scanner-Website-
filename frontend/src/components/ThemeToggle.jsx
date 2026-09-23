import { Sun, Moon } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function ThemeToggle({ collapsed = false }) {
  const [dark, setDark] = useState(
    () => document.documentElement.classList.contains('dark')
  );

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
  };

  return (
    <button
      onClick={toggle}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:text-yellow-400 hover:bg-slate-800 transition-all duration-200"
      title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {dark ? (
        <Sun size={18} className="shrink-0" />
      ) : (
        <Moon size={18} className="shrink-0" />
      )}
      {!collapsed && (
        <span className="text-sm font-medium">
          {dark ? 'Light Mode' : 'Dark Mode'}
        </span>
      )}
    </button>
  );
}
