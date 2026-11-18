"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { LangCode, TRANSLATIONS } from "@/lib/i18n";

type ThemeMode = "light" | "dark";

interface PreferencesContextValue {
  lang: LangCode;
  setLang: (lang: LangCode) => void;
  t: (typeof TRANSLATIONS)[LangCode];
  theme: ThemeMode;
  toggleTheme: () => void;
}

const PreferencesContext = createContext<PreferencesContextValue>({
  lang: "EN",
  setLang: () => {},
  t: TRANSLATIONS.EN,
  theme: "light",
  toggleTheme: () => {},
});

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<LangCode>("EN");
  const [theme, setTheme] = useState<ThemeMode>("light");

  useEffect(() => {
    const savedLang = localStorage.getItem("ns_lang") as LangCode | null;
    if (savedLang && savedLang in TRANSLATIONS) {
      setLangState(savedLang);
    }

    const savedTheme = localStorage.getItem("ns_theme") as ThemeMode | null;
    const prefersDark =
      savedTheme === "dark" ||
      (!savedTheme && window.matchMedia("(prefers-color-scheme: dark)").matches);

    if (prefersDark) {
      setTheme("dark");
      document.documentElement.classList.add("dark");
    } else {
      setTheme("light");
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const setLang = (next: LangCode) => {
    setLangState(next);
    localStorage.setItem("ns_lang", next);
  };

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === "light" ? "dark" : "light";
      localStorage.setItem("ns_theme", next);
      if (next === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      return next;
    });
  };

  return (
    <PreferencesContext.Provider
      value={{
        lang,
        setLang,
        t: TRANSLATIONS[lang],
        theme,
        toggleTheme,
      }}
    >
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  return useContext(PreferencesContext);
}
