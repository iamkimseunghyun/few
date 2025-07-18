"use client";

import { useEffect, useState } from "react";
import { useTheme } from "../context/ThemeContext";
import { Sun, Moon, Monitor } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="relative">
        <button className="p-2 rounded-lg text-muted-foreground transition-colors" aria-label="Toggle theme">
          <div className="h-5 w-5" />
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => {
          const themes: Array<"light" | "dark" | "system"> = ["light", "dark", "system"];
          const currentIndex = themes.indexOf(theme);
          const nextIndex = (currentIndex + 1) % themes.length;
          setTheme(themes[nextIndex]);
        }}
        className="p-2 rounded-lg text-muted-foreground hover:text-foreground transition-all duration-200 hover:bg-muted"
        aria-label="Toggle theme"
      >
        <div className="relative h-5 w-5">
          {theme === "system" ? (
            <Monitor className="h-5 w-5 transition-all duration-200" />
          ) : resolvedTheme === "dark" ? (
            <Moon className="h-5 w-5 transition-all duration-200" />
          ) : (
            <Sun className="h-5 w-5 transition-all duration-200" />
          )}
        </div>
      </button>
    </div>
  );
}