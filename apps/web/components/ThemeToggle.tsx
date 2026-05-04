"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "./ThemeProvider";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const dark = theme === "dark";

  return (
    <button className="theme-toggle" onClick={toggleTheme} aria-label={dark ? "Açık moda geç" : "Koyu moda geç"} title={dark ? "Açık Mod" : "Koyu Mod"}>
      {dark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
