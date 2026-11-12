/* Xưởng Cơ Khí Tốc Độ — a compact local record sheet for portable BLD preferences. */
import { Download, FileUp } from "@/components/ui/Icon";
import { IconButton } from "@/components/ui/StudioUI";
import { useRef, useState, type ChangeEvent } from "react";
import { buttonClass } from "@/components/ui/Button";
import {
  importBldProfile,
  profileExport,
  type BldProfile,
} from "@/features/bld";

function downloadProfile(profile: BldProfile) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(profileExport(profile), null, 2)], {
      type: "application/json",
    })
  );
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "cfop-bld-profile.json";
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function BldProfilePanel({
  profile,
  onProfile,
  language,
}: {
  profile: BldProfile;
  onProfile: (profile: BldProfile) => void;
  language: "vi" | "en";
}) {
  const vi = language === "vi";
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const onImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      onProfile(importBldProfile(JSON.parse(await file.text())));
      setError("");
    } catch {
      setError(
        vi
          ? "File profile BLD không hợp lệ."
          : "This BLD profile file is invalid."
      );
    } finally {
      event.target.value = "";
    }
  };
  return (
    <section className="rounded-card bg-surface h-full">
      <div className="p-5 sm:p-6">
        <p className="text-sm uppercase tracking-wide font-semibold text-muted mb-1">
          BLD · {vi ? "Hồ sơ cá nhân" : "Personal profile"}
        </p>
        <p className="text-sm text-muted">
          {vi
            ? `${Object.keys(profile.preferredAlgorithms).length} algorithm ưa thích · ${Object.keys(profile.memoRecords).length} memo đã ghi SRS`
            : `${Object.keys(profile.preferredAlgorithms).length} preferred algorithms · ${Object.keys(profile.memoRecords).length} SRS memo records`}
        </p>
        <div className="flex items-center gap-2 mt-4">
          <input
            id="bld-audio-prompt"
            className="h-4 w-4 rounded accent-primary"
            type="checkbox"
            checked={profile.audioEnabled}
            onChange={() =>
              onProfile({ ...profile, audioEnabled: !profile.audioEnabled })
            }
          />
          <label className="text-sm text-ink" htmlFor="bld-audio-prompt">
            {vi ? "Âm thanh đọc memo" : "Memo audio prompt"}
          </label>
        </div>
        <div className="flex gap-2 mt-4">
          <input
            ref={input}
            onChange={onImport}
            accept="application/json,.json"
            type="file"
            className="hidden"
          />
          <IconButton
            label={vi ? "Nhập hồ sơ" : "Import profile"}
            icon={<FileUp className="text-base" />}
            onClick={() => input.current?.click()}
            className={`${buttonClass("secondary", "md")}`}
          />
          <IconButton
            label={vi ? "Xuất hồ sơ" : "Export profile"}
            icon={<Download className="text-base" />}
            onClick={() => downloadProfile(profile)}
            className={`${buttonClass("secondary", "md")}`}
          />
        </div>
        {error && (
          <div className="rounded-panel px-4 py-3 text-sm bg-danger-soft text-ink mt-4 mb-0">
            {error}
          </div>
        )}
      </div>
    </section>
  );
}
