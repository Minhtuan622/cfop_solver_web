import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

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
  const [location] = useLocation();
  const code = location.match(/^\/rooms\/([A-Z0-9]+)/i)?.[1]?.toUpperCase() ?? "";
  const input = useMemo(() => ({ code }), [code]);
  const accountQuery = trpc.cfopAccount.me.useQuery(undefined, { staleTime: 30_000, retry: false });
  const roomQuery = trpc.competition.state.useQuery(input, { enabled: Boolean(code && accountQuery.data), refetchInterval: code ? 2_500 : false, retry: false });
  const [kind, setKind] = useState<"winner" | "record" | null>(null);
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
  if (!kind) return null;
  return <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3 bg-dark bg-opacity-50 z-3" role="dialog" aria-modal="true" aria-label="Chúc mừng"><i className="bi bi-stars text-warning position-absolute top-0 start-0 m-4 fs-1 spinner-grow" aria-hidden="true" /><i className="bi bi-stars text-info position-absolute top-0 end-0 m-4 fs-1 spinner-grow" aria-hidden="true" /><i className="bi bi-stars text-danger position-absolute bottom-0 start-50 translate-middle-x mb-4 fs-1 spinner-grow" aria-hidden="true" /><div className="alert alert-warning text-center mb-0"><i className="bi bi-trophy-fill d-block fs-1 mb-2" aria-hidden="true" /><h2 className="h4">{kind === "winner" ? "Bạn đã vô địch phòng!" : "Kỷ lục thi đấu mới!"}</h2><p className="mb-3">Thành tích này đã được ghi nhận trong kết quả phòng.</p><button type="button" className="btn btn-dark" onClick={() => setKind(null)}>Tuyệt vời</button></div></div>;
}
