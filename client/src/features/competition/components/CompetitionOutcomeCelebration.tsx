import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";

/**
 * The server reports a moderation removal with this exact Vietnamese prefix
 * (`server/routers/competitionShared.ts`), so it stays a protocol constant
 * rather than a translatable string.
 */
const REMOVAL_PREFIX = "Bạn đã bị quản trị viên loại khỏi phòng. Lý do: ";

function playCelebrationTone() {
  try {
    const AudioCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtor) return;
    const context = new AudioCtor();
    [0, 0.12, 0.24].forEach((offset, index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.frequency.value = [660, 880, 1040][index];
      gain.gain.setValueAtTime(0.06, context.currentTime + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + offset + 0.16);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start(context.currentTime + offset);
      oscillator.stop(context.currentTime + offset + 0.16);
    });
    window.setTimeout(() => void context.close(), 520);
  } catch { /* Visual feedback stays available if browser audio is blocked. */ }
}

export function CompetitionOutcomeCelebration() {
  const { t } = useLanguage();
  const [location, setLocation] = useLocation();
  const code = location.match(/^\/rooms\/([A-Z0-9]+)/i)?.[1]?.toUpperCase() ?? "";
  const input = useMemo(() => ({ code }), [code]);
  const accountQuery = trpc.cfopAccount.me.useQuery(undefined, { staleTime: 30_000, retry: false });
  const roomQuery = trpc.competition.state.useQuery(input, { enabled: Boolean(code && accountQuery.data), refetchInterval: code ? 2_500 : false, retry: false });
  const [kind, setKind] = useState<"winner" | "record" | null>(null);
  // The removal notice is announced once per message; the guard keeps a
  // re-render of the query from repeating the toast.
  const announcedRemoval = useRef("");
  useEffect(() => {
    const message = roomQuery.error?.message ?? "";
    if (!code || !message.startsWith(REMOVAL_PREFIX)) {
      announcedRemoval.current = "";
      return;
    }
    if (announcedRemoval.current === message) return;
    announcedRemoval.current = message;
    const reason = message.slice(REMOVAL_PREFIX.length).trim() || t("competition.outcome.reasonMissing");
    toast.error(t("competition.outcome.removed"), {
      description: `${t("competition.outcome.removedDetail")} ${t("competition.outcome.reason")}: ${reason}`,
      duration: 6000,
    });
    setLocation("/rooms");
  }, [code, roomQuery.error, setLocation, t]);
  useEffect(() => {
    const room = roomQuery.data;
    const account = accountQuery.data;
    if (!room || !account || room.room.status !== "finished") return;
    const player = room.standings.find((entry) => entry.accountId === account.id);
    if (!player || player.score === undefined || player.score === null) return;
    const seenKey = `cfop-competition-celebrated-${room.room.id}`;
    if (localStorage.getItem(seenKey)) return;
    const recordKey = `cfop-competition-best-${room.room.format}`;
    const previous = Number(localStorage.getItem(recordKey));
    const record = !Number.isFinite(previous) || player.score < previous;
    if (record) localStorage.setItem(recordKey, String(player.score));
    const outcome = player.rank === 1 ? "winner" : record ? "record" : null;
    if (!outcome) return;
    localStorage.setItem(seenKey, "1");
    setKind(outcome);
    playCelebrationTone();
  }, [accountQuery.data, roomQuery.data]);
  useEffect(() => { if (!kind) return; const timer = window.setTimeout(() => setKind(null), 5_500); return () => window.clearTimeout(timer); }, [kind]);
  return <>{kind ? <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3 bg-dark bg-opacity-50 z-3" role="dialog" aria-modal="true" aria-label={t("competition.outcome.closeLabel")}><i className="bi bi-stars text-warning position-absolute top-0 start-0 m-4 fs-1 spinner-grow" aria-hidden="true" /><i className="bi bi-stars text-info position-absolute top-0 end-0 m-4 fs-1 spinner-grow" aria-hidden="true" /><i className="bi bi-stars text-danger position-absolute bottom-0 start-50 translate-middle-x mb-4 fs-1 spinner-grow" aria-hidden="true" /><div className="alert alert-warning text-center mb-0"><i className="bi bi-trophy-fill d-block fs-1 mb-2" aria-hidden="true" /><h2 className="h4">{kind === "winner" ? t("competition.outcome.winner") : t("competition.outcome.record")}</h2><p className="mb-3">{t("competition.outcome.detail")}</p><button type="button" className="btn btn-dark" onClick={() => setKind(null)}>{t("competition.outcome.dismiss")}</button></div></div> : null}</>;
}
