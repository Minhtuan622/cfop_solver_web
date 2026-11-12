/* Xưởng Cơ Khí Tốc Độ — memo recall is a measured relay: prompt, conceal, self-grade, then schedule. */
import { Eye, EyeOff, RotateCcw, Volume2, VolumeX } from "@/components/ui/Icon";
import { IconButton } from "@/components/ui/StudioUI";
import { useEffect, useMemo, useState } from "react";
import {
  dueMemoRecords,
  gradeMemo,
  reviewedToday,
  type BldGrade,
  type BldMemoRecord,
  type BldProfile,
} from "@/features/bld";
import type { BldResult } from "@/lib/solverRuntime";

type Prompt = Pick<BldMemoRecord, "key" | "memo" | "kind">;
function textForSpeech(memo: string, language: "vi" | "en") {
  return memo
    .split("")
    .filter(letter => letter !== "•")
    .join(language === "vi" ? ", " : " ");
}

export function BldMemoLab({
  result,
  profile,
  onProfile,
  language,
}: {
  result: BldResult | null;
  profile: BldProfile;
  onProfile: (profile: BldProfile) => void;
  language: "vi" | "en";
}) {
  const vi = language === "vi";
  const [cursor, setCursor] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [audioError, setAudioError] = useState("");
  const prompts = useMemo<Prompt[]>(() => {
    const source: Prompt[] = result
      ? [
          {
            kind: "edge",
            key: `edge:${result.analysis.edges.memo.join("-")}`,
            memo: result.analysis.edges.memo.join(" "),
          },
          {
            kind: "corner",
            key: `corner:${result.analysis.corners.memo.join("-")}`,
            memo: result.analysis.corners.memo.join(" "),
          },
        ]
      : [];
    const fromResult = source.filter(item => item.memo);
    const due: Prompt[] = dueMemoRecords(profile).map((record): Prompt => ({
      key: record.key,
      memo: record.memo,
      kind: record.kind,
    }));
    const unique = new Map<string, Prompt>();
    [...due, ...fromResult].forEach(item => unique.set(item.key, item));
    return Array.from(unique.values());
  }, [profile, result]);
  useEffect(() => {
    setCursor(0);
    setRevealed(false);
  }, [result?.initial_state, prompts.length]);
  const prompt = prompts[cursor % Math.max(1, prompts.length)];
  const speak = () => {
    if (!prompt) return;
    if (!("speechSynthesis" in window)) {
      setAudioError(
        vi
          ? "Thiết bị chưa hỗ trợ Web Speech."
          : "Web Speech is unavailable on this device."
      );
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(
      textForSpeech(prompt.memo, language)
    );
    utterance.lang = vi ? "vi-VN" : "en-US";
    utterance.rate = 0.78;
    window.speechSynthesis.speak(utterance);
    setAudioError("");
  };
  const grade = (value: BldGrade) => {
    if (!prompt) return;
    onProfile(gradeMemo(profile, prompt, value));
    setRevealed(false);
    setCursor(current => current + 1);
  };
  const today = reviewedToday(profile);
  const due = dueMemoRecords(profile).length;
  return (
    <section className="rounded-card border border-line/80 bg-surface shadow-soft h-full">
      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-wide font-semibold text-muted mb-1">
              BLD · Memo SRS
            </p>
            <p className="text-sm text-muted mb-0">
              {today}/{profile.dailyGoal}{" "}
              {vi ? "đã ôn hôm nay" : "reviewed today"} · {due}{" "}
              {vi ? "đến hạn" : "due"}
            </p>
          </div>
          <IconButton
            label={vi ? "Bật hoặc tắt audio prompt" : "Toggle audio prompt"}
            icon={
              profile.audioEnabled ? (
                <Volume2 className="text-base" />
              ) : (
                <VolumeX className="text-base" />
              )
            }
            onClick={() =>
              onProfile({ ...profile, audioEnabled: !profile.audioEnabled })
            }
            className={
              profile.audioEnabled
                ? "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold leading-none outline-none transition focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 bg-primary text-white shadow-sm shadow-primary/25 hover:bg-primary-hover px-3 py-1.5 text-xs"
                : "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold leading-none outline-none transition focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 border-line bg-surface text-ink hover:bg-surface-2 px-3 py-1.5 text-xs"
            }
          />
        </div>
        {prompt ? (
          <div className="rounded-card border border-line/80 bg-surface shadow-soft bg-surface-2 mt-4">
            <div className="p-5 sm:p-6">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-muted">
                  {prompt.kind.toUpperCase()} ·{" "}
                  {revealed
                    ? vi
                      ? "Đáp án"
                      : "Answer"
                    : vi
                      ? "Ghi nhớ"
                      : "Recall"}
                </span>
                <IconButton
                  label={
                    revealed
                      ? vi
                        ? "Ẩn đáp án"
                        : "Hide answer"
                      : vi
                        ? "Xem đáp án"
                        : "Reveal answer"
                  }
                  icon={
                    revealed ? (
                      <EyeOff className="text-base" />
                    ) : (
                      <Eye className="text-base" />
                    )
                  }
                  onClick={() => {
                    setRevealed(value => !value);
                    if (!revealed && profile.audioEnabled) speak();
                  }}
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold leading-none outline-none transition focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 border-line bg-surface text-ink hover:bg-surface-2 px-3 py-1.5 text-xs"
                />
              </div>
              <div
                className={
                  revealed
                    ? "font-mono text-xl font-bold text-center py-4 mt-4 bg-surface border border-line rounded-xl"
                    : "font-mono text-xl font-bold text-center py-4 mt-4 bg-surface border border-line rounded-xl text-muted"
                }
              >
                {revealed ? prompt.memo : "••  ••  ••"}
              </div>
              {profile.audioEnabled && (
                <IconButton
                  label={vi ? "Đọc letter" : "Speak letters"}
                  icon={<Volume2 className="text-base" />}
                  onClick={speak}
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold leading-none outline-none transition focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 border-line bg-surface text-ink hover:bg-surface-2 px-3 py-1.5 text-xs mt-2"
                />
              )}
              {audioError && (
                <div className="rounded-panel border px-4 py-3 text-sm border-danger/20 bg-danger-soft text-ink py-2 mt-2 mb-0">
                  {audioError}
                </div>
              )}
              {revealed ? (
                <div
                  className="inline-flex flex-wrap items-center gap-1 w-full mt-4"
                  role="group"
                >
                  <GradeButton
                    label={vi ? "Lại" : "Again"}
                    tone="red"
                    onClick={() => grade("again")}
                  />
                  <GradeButton
                    label={vi ? "Khó" : "Hard"}
                    tone="ink"
                    onClick={() => grade("hard")}
                  />
                  <GradeButton
                    label={vi ? "Nhớ" : "Good"}
                    tone="mint"
                    onClick={() => grade("good")}
                  />
                  <GradeButton
                    label={vi ? "Dễ" : "Easy"}
                    tone="mint"
                    onClick={() => grade("easy")}
                  />
                </div>
              ) : (
                <p className="text-sm text-muted mt-4 mb-0">
                  {vi
                    ? "Nhẩm letter pair, sau đó reveal và tự chấm để lịch SRS cập nhật."
                    : "Recall the letter pairs, then reveal and self-grade to update the SRS schedule."}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="rounded-panel border px-4 py-3 text-sm border-line bg-surface-2 text-ink mt-4 mb-0">
            {vi
              ? "Tạo memo 3-Style trong Studio hoặc nhập hồ sơ có mục đến hạn để bắt đầu ôn."
              : "Build a 3-Style memo in Studio or import a profile with due prompts to begin."}
          </div>
        )}
        <IconButton
          label={vi ? "Prompt kế" : "Next prompt"}
          icon={<RotateCcw className="text-base" />}
          onClick={() => {
            setRevealed(false);
            setCursor(current => current + 1);
          }}
          disabled={!prompts.length}
          className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold leading-none outline-none transition focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 border-line bg-surface text-ink hover:bg-surface-2 px-3 py-1.5 text-xs mt-4"
        />
      </div>
    </section>
  );
}
function GradeButton({
  label,
  tone,
  onClick,
}: {
  label: string;
  tone: "red" | "ink" | "mint";
  onClick: () => void;
}) {
  const className =
    tone === "red"
      ? "inline-flex items-center justify-center gap-2 rounded-full border border-danger/35 bg-transparent px-3 py-1.5 text-xs font-semibold text-danger transition hover:bg-danger-soft"
      : tone === "mint"
        ? "inline-flex items-center justify-center gap-2 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-white shadow-sm shadow-primary/25 transition hover:bg-primary-hover"
        : "inline-flex items-center justify-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-ink transition hover:bg-surface-2";
  return (
    <button type="button" onClick={onClick} className={className}>
      {label}
    </button>
  );
}
