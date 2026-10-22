import { useEffect, useRef, useState } from "react";
import { Translate } from "@/components/ui/BootstrapIcon";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Language } from "@/lib/i18n";

/** The two languages of the interface, each written the way its own speakers write it. */
const OPTIONS: { value: Language; labelKey: string }[] = [
  { value: "vi", labelKey: "language.vietnamese" },
  { value: "en", labelKey: "language.english" },
];

/** Lets the visitor pick the language the interface is written in. */
export function LanguageSwitcher() {
  const { language, setLanguage, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsidePointer);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  const current = OPTIONS.find(option => option.value === language) ?? OPTIONS[0];

  return (
    <div ref={menuRef} className="dropdown">
      <button
        type="button"
        className="btn btn-outline-secondary btn-sm dropdown-toggle d-inline-flex align-items-center justify-content-center"
        onClick={() => setOpen(value => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls="cfop-language-menu"
        aria-label={t("language.change")}
        title={t("language.change")}
      >
        <Translate className="fs-6 me-1" />
        <span className="d-none d-xxl-inline">{t(current.labelKey)}</span>
      </button>
      {open ? (
        <ul className="dropdown-menu dropdown-menu-end show mt-2" role="menu" id="cfop-language-menu" aria-label={t("language.label")}>
          {OPTIONS.map(option => {
            const active = option.value === language;
            return (
              <li key={option.value}>
                <button
                  type="button"
                  role="menuitemradio"
                  aria-checked={active}
                  className="dropdown-item py-2 d-flex align-items-center gap-2"
                  onClick={() => {
                    setLanguage(option.value);
                    setOpen(false);
                  }}
                >
                  <Translate className="fs-6" />
                  {t(option.labelKey)}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
