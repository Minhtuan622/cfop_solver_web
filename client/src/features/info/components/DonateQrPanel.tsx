import { useEffect, useRef, useState } from "react";
import { Button, buttonClass } from "@/components/ui/Button";
import { ClipboardCopy, Download, QrCode } from "@/components/ui/Icon";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import type { DonateQr } from "../lib/links";

// Khu vực mã QR ủng hộ: một mã lớn ở giữa, thanh chọn kênh khi có từ hai mã trở lên,
// ô xám "Chưa có ảnh QR" khi danh sách rỗng. Ảnh và số tài khoản khai báo ở DONATE_QR.
export function DonateQrPanel({ items }: { items: readonly DonateQr[] }) {
  const { t } = useLanguage();
  const [activeId, setActiveId] = useState(items[0]?.id ?? "");
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const active = items.find(item => item.id === activeId) ?? items[0];

  const copy = async () => {
    if (!active?.copyText) return;
    try {
      await navigator.clipboard.writeText(active.copyText);
      setCopied(true);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-5 rounded-panel bg-surface-2 p-6">
      {items.length > 1 ? (
        <div
          role="tablist"
          aria-label={t("donate.qr.channels")}
          className="inline-flex max-w-full flex-wrap justify-center gap-1 rounded-full bg-surface p-1"
        >
          {items.map(item => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={item.id === active?.id}
              onClick={() => setActiveId(item.id)}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                item.id === active?.id ? "bg-surface-3 text-ink" : "text-muted hover:text-ink"
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : null}

      {active ? (
        <>
          <img
            src={active.image}
            alt={t("donate.qr.alt", { label: active.label })}
            width={224}
            height={224}
            className="size-56 rounded-2xl bg-white object-contain p-1"
          />
          <div className="text-center">
            <p className="m-0 text-sm font-semibold text-ink">{active.note}</p>
            <p className="m-0 text-xs text-muted">{t("donate.qr.scan")}</p>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {active.copyText ? (
              <Button
                variant="secondary"
                icon={<ClipboardCopy aria-hidden="true" />}
                onClick={copy}
              >
                <span role="status">{copied ? t("donate.qr.copied") : t("donate.qr.copy")}</span>
              </Button>
            ) : null}
            <a
              href={active.image}
              download
              className={buttonClass("secondary", "md")}
            >
              <Download aria-hidden="true" />
              {t("donate.qr.download")}
            </a>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center gap-3 py-2 text-center">
          <div className="grid size-56 place-items-center rounded-2xl bg-surface text-muted">
            <div className="flex flex-col items-center gap-2 px-6">
              <QrCode className="size-8" aria-hidden="true" />
              <span className="text-xs font-semibold">{t("donate.qr.empty")}</span>
            </div>
          </div>
          <p className="m-0 text-sm text-muted">{t("donate.qr.emptyHint")}</p>
        </div>
      )}
    </div>
  );
}
