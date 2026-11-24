import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/Button";
import { Dices, Timer } from "@/components/ui/Icon";
import { useLanguage } from "@/contexts/LanguageContext";
import type { TimerEventId } from "@/lib/timerEvents";
import { buildTimerPath } from "@/lib/timerLink";

const AUF = ["", "U ", "U2 ", "U' "] as const;

export function withRandomAuf(scramble: string, random: () => number = Math.random) {
  const pre = AUF[Math.floor(random() * AUF.length)];
  const post = AUF[Math.floor(random() * AUF.length)];
  return `${pre}${scramble} ${post}`.replace(/\s+/g, " ").trim();
}

export type CasePractice = {
  eventId: TimerEventId;
  scramble: string;
};

export function CaseScrambleRow({ eventId, scramble }: CasePractice) {
  const { t } = useLanguage();
  const [, navigate] = useLocation();
  const [auf, setAuf] = useState(false);
  const [roll, setRoll] = useState(0);
  const [copied, setCopied] = useState(false);
  const canAuf = eventId === "333";
  const text = useMemo(
    () => (auf && canAuf ? withRandomAuf(scramble) : scramble),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [scramble, auf, canAuf, roll]
  );
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1_500);
    } catch {
      window.prompt(t("caseScramble.manual"), text);
    }
  };
  return (
    <div className="mt-4 rounded-xl bg-surface-2 p-3" data-testid="case-scramble">
      <p className="mb-1 text-xs font-semibold tracking-[0.12em] text-muted uppercase">
        {t("caseScramble.title")}
      </p>
      <p
        data-testid="case-scramble-text"
        className="mb-2 break-words font-mono text-sm text-ink"
      >
        {text}
      </p>
      <p className="mb-3 text-xs text-muted">{t("caseScramble.hint")}</p>
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="soft" size="sm" onClick={() => void copy()}>
          {copied ? t("caseScramble.copied") : t("caseScramble.copy")}
        </Button>
        <Button
          variant="soft"
          size="sm"
          onClick={() => navigate(buildTimerPath(eventId, text))}
        >
          <Timer className="mr-1 text-base" aria-hidden="true" />
          {t("caseScramble.openTimer")}
        </Button>
        {canAuf ? (
          <>
            <Button
              variant={auf ? "primary" : "soft"}
              size="sm"
              aria-pressed={auf}
              onClick={() => setAuf(value => !value)}
            >
              {t("caseScramble.auf")}
            </Button>
            {auf ? (
              <Button
                variant="soft"
                size="sm"
                onClick={() => setRoll(value => value + 1)}
              >
                <Dices className="mr-1 text-base" aria-hidden="true" />
                {t("caseScramble.aufAgain")}
              </Button>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );
}
