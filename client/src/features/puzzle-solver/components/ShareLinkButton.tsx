import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ClipboardCopy } from "@/components/ui/Icon";
import { useLanguage } from "@/contexts/LanguageContext";

/** Sao chép link chia sẻ của trang Giải; khoá khi chưa có đầu vào hợp lệ. */
export function ShareLinkButton({ url }: { url: string | null }) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1_500);
    } catch {
      // Trình duyệt chặn clipboard: hiện link để người dùng tự chọn và chép.
      window.prompt(t("share.manual"), url);
    }
  };
  return (
    <Button
      variant="soft"
      size="sm"
      disabled={!url}
      onClick={() => void copy()}
      data-share-url={url ?? undefined}
    >
      <ClipboardCopy className="mr-1 text-base" aria-hidden="true" />
      {copied ? t("share.copied") : t("share.copy")}
    </Button>
  );
}
