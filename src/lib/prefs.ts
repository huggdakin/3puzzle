import { useEffect, useState } from "react";
import type { Lang } from "./i18n";

export type Theme = "light" | "dark";

const THEME_KEY = "tilopia-theme-lumen";

function readTheme(): Theme {
  try {
    const value = window.localStorage.getItem(THEME_KEY);
    if (value === "light" || value === "dark") return value;
  } catch {
    // ignore
  }
  return "dark";
}

function readLang(): Lang {
  try {
    const value = window.localStorage.getItem("tilopia-lang");
    if (value === "ru" || value === "en") return value;
  } catch {
    // ignore
  }
  if (
    typeof navigator !== "undefined" &&
    navigator.language?.toLowerCase().startsWith("en")
  ) {
    return "en";
  }
  return "ru";
}

export function usePrefs() {
  const [theme, setTheme] = useState<Theme>(readTheme);
  const [lang, setLang] = useState<Lang>(readLang);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      window.localStorage.setItem(THEME_KEY, theme);
    } catch {
      // ignore
    }
  }, [theme]);

  useEffect(() => {
    document.documentElement.lang = lang;
    try {
      window.localStorage.setItem("tilopia-lang", lang);
    } catch {
      // ignore
    }
  }, [lang]);

  return { theme, setTheme, lang, setLang };
}
