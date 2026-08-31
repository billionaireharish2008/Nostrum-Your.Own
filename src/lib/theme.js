import { useEffect, useState } from "react";

const KEY = "nostrum-theme";
const DEFAULT = "dark";

function apply(theme) {
  const root = document.documentElement;
  if (theme === "dark") root.classList.add("dark");
  else root.classList.remove("dark");
}

export function useTheme() {
  const [theme, setTheme] = useState(() => {
    if (typeof window === "undefined") return DEFAULT;
    return localStorage.getItem(KEY) || DEFAULT;
  });

  useEffect(() => {
    apply(theme);
    try {
      localStorage.setItem(KEY, theme);
    } catch (e) {
      // ignore storage errors
    }
  }, [theme]);

  const toggle = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  return { theme, setTheme, toggle };
}