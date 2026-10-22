/** The bilingual vocabulary of the CFOP Solver Studio interface. */
import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { translate, type Language, type WordParams } from "@/lib/i18n";

export type { Language };

type LanguageValue = {
  language: Language;
  /** Shorthand for the many places that still branch on a single language. */
  vi: boolean;
  setLanguage: (value: Language) => void;
  /** Reads a `namespace.key` entry, optionally filling its `{placeholders}`. */
  t: (key: string, params?: WordParams) => string;
};

const Context = createContext<LanguageValue>({
  language: "vi",
  vi: true,
  setLanguage: () => undefined,
  t: (key, params) => translate("vi", key, params),
});

const STORAGE_KEY = "cfop-language";

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === "en" ? "en" : "vi";
  });
  const value = useMemo<LanguageValue>(
    () => ({
      language,
      vi: language === "vi",
      setLanguage: (next: Language) => {
        localStorage.setItem(STORAGE_KEY, next);
        setLanguageState(next);
      },
      t: (key: string, params?: WordParams) => translate(language, key, params),
    }),
    [language],
  );
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useLanguage() {
  return useContext(Context);
}

export function simplePhase(name: string, language: Language) {
  if (name.startsWith("xxxxcross_")) {
    return "XXXXCross · Full F2L";
  }
  if (name.startsWith("xxxcross_")) {
    return "XXXCross · 3 F2L";
  }
  if (name.startsWith("xxcross_")) {
    return "XXCross · 2 F2L";
  }
  if (name.startsWith("xcross_")) {
    return "XCross · 1 F2L";
  }
  const values: Record<string, [string, string]> = {
    cross: ["Cross", "Cross"],
    f2l_FR: ["F2L 1", "F2L 1"], f2l_FL: ["F2L 2", "F2L 2"],
    f2l_BL: ["F2L 3", "F2L 3"], f2l_BR: ["F2L 4", "F2L 4"],
    oll: ["OLL", "OLL"], pll: ["PLL", "PLL"],
    zbll: ["ZBLL", "ZBLL"],
    "1lll": ["1LLL", "1LLL"],
  };
  return values[name]?.[language === "vi" ? 0 : 1] ?? name;
}
