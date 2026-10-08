import { useEffect, useState } from "react";
import type { GirlhoodLanguage } from "../types";
const KEY = "sgc-girlhood-language";
function initial(): GirlhoodLanguage {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved === "en" || saved === "fr") return saved;
  } catch {
    /* Storage may be disabled. */
  }
  return navigator.language.toLowerCase().startsWith("fr") ? "fr" : "en";
}
export function useGirlhoodLanguage() {
  const [language, setLanguageState] = useState<GirlhoodLanguage>(initial);
  useEffect(() => {
    const receive = (event: Event) =>
      setLanguageState((event as CustomEvent<GirlhoodLanguage>).detail);
    window.addEventListener(KEY, receive);
    return () => window.removeEventListener(KEY, receive);
  }, []);
  const setLanguage = (value: GirlhoodLanguage) => {
    try {
      localStorage.setItem(KEY, value);
    } catch {
      /* Continue without persistence. */
    }
    setLanguageState(value);
    window.dispatchEvent(new CustomEvent(KEY, { detail: value }));
  };
  return { language, setLanguage };
}
