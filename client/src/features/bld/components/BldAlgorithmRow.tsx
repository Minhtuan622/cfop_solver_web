import { X } from "@/components/ui/Icon";
import { Input } from "@/components/ui/FormControls";
import { IconButton } from "@/components/ui/StudioUI";
import {
  preferenceKey,
  setPreferredAlgorithm,
  type BldProfile,
} from "../lib/bldProfile";

function algorithmText(
  algorithm: string | undefined,
  loading: boolean,
  failed: boolean,
  vi: boolean
) {
  return (
    algorithm ??
    (failed
      ? vi
        ? "Không tải được catalog runtime."
        : "Runtime catalog unavailable."
      : loading
        ? vi
          ? "Đang đối chiếu catalog…"
          : "Matching catalog…"
        : vi
          ? "Chưa có exact match trong catalog."
          : "No exact catalog match.")
  );
}

/**
 * Một dòng execution/special: key chính xác, thuật toán từ catalog hoặc thuật
 * toán ưu tiên trong hồ sơ, và ô sửa thuật toán ưu tiên.
 */
export function BldAlgorithmRow({
  type,
  label,
  exactKey,
  catalogAlgorithm,
  profile,
  onProfile,
  loading,
  failed,
  language,
}: {
  type: "edge" | "corner" | "parity" | "flip" | "twist";
  label: string;
  exactKey: string;
  catalogAlgorithm?: string;
  profile: BldProfile;
  onProfile: (profile: BldProfile) => void;
  loading: boolean;
  failed: boolean;
  language: "vi" | "en";
}) {
  const vi = language === "vi";
  const key = preferenceKey(type, exactKey);
  const preferred = profile.preferredAlgorithms[key]?.algorithm;
  const active = preferred ?? catalogAlgorithm;
  return (
    <article className="block px-4 py-3 text-sm">
      <div className="flex flex-wrap justify-between items-center gap-2">
        <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none tracking-wide bg-surface-3 text-ink">
          {label}
        </span>
        <strong className="font-mono break-words">{exactKey}</strong>
      </div>
      <p className="font-mono break-words text-sm mt-2 mb-2">
        {preferred ? (
          <>
            <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none tracking-wide bg-success text-on-success mr-1">
              Profile
            </span>
            {preferred}
          </>
        ) : (
          algorithmText(active, loading, failed, vi)
        )}
      </p>
      {catalogAlgorithm && (
        <div className="flex w-full items-stretch text-xs">
          <Input
            aria-label={`${label} preferred algorithm`}
            value={preferred ?? ""}
            onChange={event =>
              onProfile(setPreferredAlgorithm(profile, key, event.target.value))
            }
            placeholder={
              vi
                ? "Ưu tiên cá nhân (tùy chọn)"
                : "Personal preference (optional)"
            }
          />
          {preferred && (
            <IconButton
              label={vi ? "Xóa ưu tiên" : "Clear preference"}
              icon={<X className="text-base" />}
              onClick={() => onProfile(setPreferredAlgorithm(profile, key, ""))}
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold leading-none transition focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 bg-transparent text-danger hover:bg-danger-soft"
            />
          )}
        </div>
      )}
    </article>
  );
}
