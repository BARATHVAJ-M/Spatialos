"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Sync with backend on theme change
  const handleThemeChange = async (newTheme: string) => {
    setTheme(newTheme);
    try {
      await apiFetch('/settings/users/me/preferences', {
        method: 'PATCH',
        body: JSON.stringify({ theme: newTheme })
      });
    } catch (e) {
      console.error("Failed to sync theme to backend", e);
    }
  };

  useEffect(() => {
    setMounted(true);
    const fetchTheme = async () => {
      try {
        const data = await apiFetch<any>('/settings/users/me');
        if (data?.preferences?.theme) {
          setTheme(data.preferences.theme);
        }
      } catch(e) {}
    };
    fetchTheme();
  }, [setTheme]);

  if (!mounted) {
    return <div className="w-9 h-9 rounded-md bg-slate-200 dark:bg-slate-800 animate-pulse"></div>;
  }

  const isDark = theme === "dark";

  return (
    <button
      onClick={() => handleThemeChange(isDark ? "light" : "dark")}
      className="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors duration-150 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 w-full"
      title="Toggle theme"
    >
      {isDark ? (
        <Sun className="w-5 h-5 shrink-0 text-amber-500" />
      ) : (
        <Moon className="w-5 h-5 shrink-0 text-indigo-500" />
      )}
      <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
    </button>
  );
}
