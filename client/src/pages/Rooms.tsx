import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { SolveTimer, type TimerCompletion } from "@/components/SolveTimer";
import { PuzzleScramblePreview } from "@/components/PuzzleScramblePreview";
import { formatSolveTime } from "@/lib/solveHistory";
import { DEFAULT_TIMER_EVENT, TIMER_EVENTS, isTimerEventId, timerEventLabel, type TimerEventId } from "@/lib/timerEvents";
import { formatMultiBlindTime, multiBlindResult } from "@/lib/multiBlind";
import { trpc } from "@/lib/trpc";
import { SystemLeaderboard } from "@/components/SystemLeaderboard";

type RoomFormat = "best_of_3" | "ao5" | "ao12";
type CompetitionPenalty = "none" | "+2" | "DNF";
type PendingSolve = Pick<TimerCompletion, "elapsedMs" | "inspectionMs" | "automaticPenalty">;

const formatLabels: Record<RoomFormat, string> = { best_of_3: "Best of 3", ao5: "Ao5", ao12: "Ao12" };
const formatDescriptions: Record<RoomFormat, string> = { best_of_3: "3 lượt · lấy single tốt nhất", ao5: "5 lượt · bỏ nhanh nhất và chậm nhất", ao12: "12 lượt · bỏ nhanh nhất và chậm nhất" };

function errorMessage(error: unknown) { return error instanceof Error ? error.message : "Không thể hoàn tất. Hãy thử lại."; }
function eventLabel(eventId: unknown) { return timerEventLabel(isTimerEventId(eventId) ? eventId : DEFAULT_TIMER_EVENT, "vi"); }
function resultLabel(result: { elapsedMs: number; penalty: CompetitionPenalty; multiBlindScore?: number | null; multiBlindSolved?: number | null; multiBlindAttempted?: number | null } | null | undefined, eventId: unknown) {
  if (!result) return "—";
  if (result.penalty === "DNF") return "DNF";
  if (eventId === "333mbf" && typeof result.multiBlindScore === "number") return `${result.multiBlindScore} điểm · ${formatMultiBlindTime(result.elapsedMs)}`;
  return `${formatSolveTime(result.elapsedMs + (result.penalty === "+2" ? 2_000 : 0))}${result.penalty === "+2" ? " +2" : ""}`;
}
function scoreLabel(value: number | null | undefined, eventId: unknown) { return value === undefined ? "—" : value === null ? "DNF" : eventId === "333mbf" ? `${value} điểm` : formatSolveTime(value); }
function messageTime(value: Date | string) { return new Date(value).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }); }

function CompetitionHistory() {
  const accountQuery = trpc.cfopAccount.me.useQuery(undefined, { staleTime: 30_000, retry: false });
  const historyQuery = trpc.competition.history.useQuery(undefined, { enabled: Boolean(accountQuery.data), retry: false });
  if (historyQuery.isLoading) return <div className="placeholder-glow mt-4"><span className="placeholder col-6" /></div>;
  if (!historyQuery.data?.length) return <SystemLeaderboard />;
  return <><SystemLeaderboard /><section className="card mt-4"><div className="card-body"><h2 className="h5">Lịch sử thi đấu</h2><div className="list-group list-group-flush">{historyQuery.data.map((entry) => <Link key={entry.room.id} href={`/rooms/${entry.room.code}`} className="list-group-item list-group-item-action px-0"><strong className="d-block">{entry.room.name}</strong><small className="text-body-secondary">{eventLabel(entry.room.eventId)} · {formatLabels[entry.room.format]} · Hạng {entry.myRank ?? "—"} · {scoreLabel(entry.myScore, entry.room.eventId)}</small></Link>)}</div></div></section></>;
}

export default function Rooms() {
  const [location, setLocation] = useLocation();
  const code = location.match(/^\/rooms\/([A-Z0-9]+)/i)?.[1]?.toUpperCase() ?? "";
  const utils = trpc.useUtils();
  const accountQuery = trpc.cfopAccount.me.useQuery(undefined, { staleTime: 30_000, retry: false });
  const [roomName, setRoomName] = useState("");
  const [eventId, setEventId] = useState<TimerEventId>(DEFAULT_TIMER_EVENT);
  const [multiBlindCubes, setMultiBlindCubes] = useState(2);
  const [maxPlayers, setMaxPlayers] = useState(8);
  const [format, setFormat] = useState<RoomFormat>("ao5");
  const [joinCode, setJoinCode] = useState("");
  const [chatContent, setChatContent] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pendingMultiBlind, setPendingMultiBlind] = useState<PendingSolve | null>(null);
  const [multiBlindSolved, setMultiBlindSolved] = useState(0);
  const lastMessageIdRef = useRef<number | null>(null);
  const roomInput = useMemo(() => ({ code }), [code]);
  const mineQuery = trpc.competition.listMine.useQuery(undefined, { enabled: Boolean(accountQuery.data), retry: false });
  const roomQuery = trpc.competition.state.useQuery(roomInput, { enabled: Boolean(accountQuery.data && code), refetchInterval: code ? 2_500 : false, retry: false });

  const refreshRoom = async () => { if (code) await utils.competition.state.invalidate(roomInput); await utils.competition.listMine.invalidate(); await utils.competition.history.invalidate(); };
  const createRoom = trpc.competition.create.useMutation({ onSuccess: (room) => { void utils.competition.listMine.invalidate(); setLocation(`/rooms/${room.code}`); }, onError: (next) => setError(errorMessage(next)) });
  const joinRoom = trpc.competition.join.useMutation({ onSuccess: (room) => { void utils.competition.listMine.invalidate(); setLocation(`/rooms/${room.code}`); }, onError: (next) => setError(errorMessage(next)) });
  const startRound = trpc.competition.startRound.useMutation({ onSuccess: async () => { setMessage("Đã mở lượt mới với scramble chung."); await refreshRoom(); }, onError: (next) => setError(errorMessage(next)) });
  const finishRoom = trpc.competition.finish.useMutation({ onSuccess: async () => { setMessage("Đã chốt bảng xếp hạng."); await refreshRoom(); }, onError: (next) => setError(errorMessage(next)) });
  const rematch = trpc.competition.rematch.useMutation({ onSuccess: async (room) => { await utils.competition.listMine.invalidate(); await utils.competition.history.invalidate(); setLocation(`/rooms/${room.code}`); }, onError: (next) => setError(errorMessage(next)) });
  const leaveRoom = trpc.competition.leave.useMutation({ onSuccess: async () => { setLocation("/rooms"); await utils.competition.listMine.invalidate(); }, onError: (next) => setError(errorMessage(next)) });
  const submit = trpc.competition.submit.useMutation({ onSuccess: async () => { setPendingMultiBlind(null); setMessage("Đã nộp kết quả vào bảng phòng. Lịch sử Timer cá nhân không thay đổi."); await refreshRoom(); }, onError: (next) => setError(errorMessage(next)) });
  const sendMessage = trpc.competition.sendMessage.useMutation({ onSuccess: async () => { setChatContent(""); await refreshRoom(); }, onError: (next) => setError(errorMessage(next)) });

  useEffect(() => { setPendingMultiBlind(null); setMultiBlindSolved(0); }, [roomQuery.data?.activeRound?.id]);
  useEffect(() => {
    const newest = roomQuery.data?.messages.at(-1);
    if (!newest || newest.id === lastMessageIdRef.current) return;
    lastMessageIdRef.current = newest.id;
  }, [roomQuery.data?.messages]);

  if (accountQuery.isLoading) return <div className="container"><div className="placeholder-glow"><span className="placeholder col-5" /></div></div>;
  if (!accountQuery.data) return <div className="container"><SystemLeaderboard /><section className="alert alert-secondary mt-4"><h1 className="h4">Phòng thi đấu</h1><p className="mb-0">Đăng nhập tài khoản CFOP để tạo phòng hoặc tham gia thi đấu cùng bạn bè.</p></section></div>;

  if (!code) return <div className="container"><div className="row g-4"><section className="col-12 col-xl-7"><div className="card h-100"><div className="card-body"><h1 className="h3">Phòng thi đấu</h1><p className="text-body-secondary">Mỗi phòng chốt một event và phát chung scramble đúng bộ môn cho mọi thành viên.</p><form onSubmit={(event) => { event.preventDefault(); setError(""); createRoom.mutate({ name: roomName, eventId, multiBlindCubes, maxPlayers, format }); }}><label className="form-label w-100">Tên phòng<input required minLength={2} maxLength={80} className="form-control mt-1" value={roomName} onChange={(event) => setRoomName(event.target.value)} /></label><div className="row g-3 mt-1"><label className="col-12 col-md-4 form-label">Loại khối<select className="form-select mt-1" value={eventId} onChange={(event) => setEventId(event.target.value as TimerEventId)}>{TIMER_EVENTS.map((item) => <option key={item.id} value={item.id}>{item.labelVi}</option>)}</select></label><label className="col-12 col-md-4 form-label">Thể thức<select className="form-select mt-1" value={format} onChange={(event) => setFormat(event.target.value as RoomFormat)}>{Object.entries(formatLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label className="col-12 col-md-4 form-label">Tối đa<select className="form-select mt-1" value={maxPlayers} onChange={(event) => setMaxPlayers(Number(event.target.value))}>{[2, 4, 6, 8, 12, 16].map((value) => <option key={value} value={value}>{value} người</option>)}</select></label>{eventId === "333mbf" ? <label className="col-12 col-md-4 form-label">Số khối MBLD<input type="number" min={2} max={99} value={multiBlindCubes} onChange={(event) => setMultiBlindCubes(Math.max(2, Math.min(99, Number(event.target.value) || 2)))} className="form-control mt-1" /></label> : null}</div><button className="btn btn-primary mt-3" disabled={createRoom.isPending}>{createRoom.isPending ? "Đang tạo…" : "Tạo phòng"}</button></form></div></div></section><aside className="col-12 col-xl-5"><div className="card h-100"><div className="card-body"><h2 className="h5">Tham gia bằng mã</h2><form onSubmit={(event) => { event.preventDefault(); joinRoom.mutate({ code: joinCode }); }}><label className="form-label w-100">Mã phòng<input required minLength={4} maxLength={10} className="form-control mt-1 text-uppercase" value={joinCode} onChange={(event) => setJoinCode(event.target.value.toUpperCase())} /></label><button className="btn btn-outline-primary mt-3" disabled={joinRoom.isPending}>Tham gia phòng</button></form><h2 className="h6 mt-4">Phòng của bạn</h2>{mineQuery.data?.length ? <div className="list-group list-group-flush">{mineQuery.data.map(({ room }) => <Link key={room.id} href={`/rooms/${room.code}`} className="list-group-item list-group-item-action px-0"><strong className="d-block">{room.name}</strong><small className="text-body-secondary">{room.code} · {eventLabel(room.eventId)} · {formatLabels[room.format]}</small></Link>)}</div> : <p className="text-body-secondary small mb-0">Bạn chưa tham gia phòng nào.</p>}</div></div></aside></div><CompetitionHistory />{error ? <div className="alert alert-danger mt-4">{error}</div> : null}</div>;

  const room = roomQuery.data;
  if (roomQuery.isLoading) return <div className="container"><div className="placeholder-glow"><span className="placeholder col-5" /></div></div>;
  if (!room) return <div className="container"><div className="alert alert-secondary"><h1 className="h4">Tham gia phòng {code}</h1><button type="button" className="btn btn-primary" onClick={() => joinRoom.mutate({ code })}>Tham gia phòng</button></div></div>;

  const event = isTimerEventId(room.room.eventId) ? room.room.eventId : DEFAULT_TIMER_EVENT;
  const isMultiBlind = event === "333mbf";
  const activeRound = room.activeRound;
  const accountId = accountQuery.data?.id;
  const myPlayer = room.players.find((player) => player.accountId === accountId);
  const submitted = Boolean(myPlayer?.currentResult);
  const multiBlindState = pendingMultiBlind ? multiBlindResult({ attempted: room.room.multiBlindCubes, solved: multiBlindSolved }, pendingMultiBlind.elapsedMs) : null;
  const onComplete = (completion: TimerCompletion) => {
    if (isMultiBlind) { setPendingMultiBlind(completion); setMultiBlindSolved(0); return; }
    submit.mutate({ code, roundId: activeRound!.id, elapsedMs: completion.elapsedMs, inspectionMs: completion.inspectionMs, penalty: completion.automaticPenalty });
  };
  const shareInvite = () => void navigator.clipboard?.writeText(`${window.location.origin}/rooms/${room.room.code}`).then(() => setMessage("Đã sao chép link mời."));

  return <div className="container"><div className="d-flex flex-wrap justify-content-between align-items-end gap-3 mb-4"><div><p className="text-body-secondary small mb-1">{eventLabel(event)} · {formatLabels[room.room.format]} · lượt {room.room.currentRound}/{room.roundLimit}</p><h1 className="h3 mb-1">{room.room.name}</h1><p className="font-monospace fs-5 mb-0">{room.room.code}</p></div><div className="d-flex gap-2"><button type="button" className="btn btn-outline-primary btn-sm" onClick={shareInvite}>Sao chép link mời</button>{!room.isHost ? <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => leaveRoom.mutate({ code })}>Rời phòng</button> : null}<Link href="/rooms" className="btn btn-outline-secondary btn-sm">Danh sách phòng</Link></div></div><div className="row g-4"><section className="col-12 col-xl-8"><div className="card"><div className="card-body">{room.room.status === "finished" ? <div className="alert alert-success mb-0"><h2 className="h5">Đã hoàn tất {eventLabel(event)} · {formatLabels[room.room.format]}</h2>{room.isHost ? <button type="button" className="btn btn-success mt-2" onClick={() => rematch.mutate({ code })}>Đấu lại</button> : null}</div> : activeRound ? <><div className="d-flex flex-wrap justify-content-between gap-3"><div><p className="text-body-secondary small mb-1">Lượt {activeRound.sequence}/{room.roundLimit} · Scramble chung</p>{isMultiBlind ? <div><p className="mb-2">Bundle MBLD · {activeRound.scrambleBundle.length} khối · giới hạn {formatMultiBlindTime(multiBlindResult({ attempted: room.room.multiBlindCubes, solved: 0 }, 0).timeLimitMs)}</p><ol className="list-group list-group-numbered">{activeRound.scrambleBundle.map((scramble, index) => <li key={`${index}-${scramble}`} className="list-group-item font-monospace small text-break">{scramble}</li>)}</ol></div> : <p className="fs-4 fw-bold text-break mb-0">{activeRound.scramble}</p>}</div>{room.isHost && activeRound.sequence < room.roundLimit ? <button type="button" className="btn btn-outline-primary align-self-start" onClick={() => startRound.mutate({ code })}>Lượt tiếp</button> : null}</div><hr />{isMultiBlind ? <div className="row g-3 align-items-stretch"><div className="col-12 col-lg-7">{submitted ? <div className="alert alert-success">Đã nộp: {resultLabel(myPlayer?.currentResult, event)}</div> : pendingMultiBlind ? <div className="card bg-body-tertiary"><div className="card-body"><h2 className="h6">Kết quả Multi-Blind</h2><label className="form-label">Số khối giải đúng<input type="number" min={0} max={room.room.multiBlindCubes} className="form-control mt-1" value={multiBlindSolved} onChange={(input) => setMultiBlindSolved(Math.max(0, Math.min(room.room.multiBlindCubes, Number(input.target.value) || 0)))} /></label><p className="mb-2">Score: <strong>{multiBlindState?.score ?? 0}</strong> · Unsolved: {multiBlindState?.unsolved ?? room.room.multiBlindCubes}</p>{multiBlindState && !multiBlindState.valid ? <p className="text-danger small">Kết quả sẽ DNF: cần ít nhất 2 khối đúng, score không âm và trong giới hạn thời gian.</p> : null}<button type="button" className="btn btn-primary" disabled={submit.isPending} onClick={() => submit.mutate({ code, roundId: activeRound.id, elapsedMs: pendingMultiBlind.elapsedMs, inspectionMs: pendingMultiBlind.inspectionMs, penalty: pendingMultiBlind.automaticPenalty, multiBlind: { attempted: room.room.multiBlindCubes, solved: multiBlindSolved } })}>Nộp score MBLD</button></div></div> : <SolveTimer key={activeRound.id} onComplete={onComplete} soundEnabled />}</div><div className="col-12 col-lg-5"><div className="alert alert-secondary h-100 mb-0"><strong>MBLD không hiển thị cube 3D.</strong><br /><span className="small">Hãy ghi nhớ bundle scramble độc lập, chạy timer, sau đó nhập số khối giải đúng để hệ thống tính score.</span></div></div></div> : <div className="row g-3 align-items-stretch"><div className="col-12 col-lg-7">{submitted ? <div className="alert alert-success">Đã nộp kết quả: {resultLabel(myPlayer?.currentResult, event)}</div> : <SolveTimer key={activeRound.id} onComplete={onComplete} soundEnabled />}</div><div className="col-12 col-lg-5"><PuzzleScramblePreview eventId={event} scramble={activeRound.scramble} language="vi" /></div></div>}</> : <div className="alert alert-secondary mb-0"><h2 className="h5">Đang chờ lượt</h2><p className="mb-0">{room.isHost ? "Bắt đầu để phát scramble chung cho cả phòng." : "Đợi chủ phòng bắt đầu lượt giải."}</p>{room.isHost ? <div className="d-flex gap-2 mt-3"><button type="button" className="btn btn-primary" onClick={() => startRound.mutate({ code })} disabled={startRound.isPending || room.room.currentRound >= room.roundLimit}>Bắt đầu lượt</button>{room.room.currentRound ? <button type="button" className="btn btn-outline-success" onClick={() => finishRoom.mutate({ code })}>Hoàn tất thể thức</button> : null}</div> : null}</div>}</div></div></section><aside className="col-12 col-xl-4"><div className="card mb-4"><div className="card-body"><h2 className="h5">Bảng xếp hạng</h2><p className="text-body-secondary small">{isMultiBlind ? "Xếp theo score → thời gian → số khối chưa giải." : formatDescriptions[room.room.format]}</p>{room.standings.length ? <ol className="list-group list-group-numbered">{room.standings.map((player) => <li key={player.accountId} className="list-group-item d-flex justify-content-between align-items-center"><span className="text-truncate">{player.displayName}<small className="d-block text-body-secondary">{resultLabel(player.lastResult, event)}</small></span><strong>#{player.rank}</strong></li>)}</ol> : <p className="text-body-secondary mb-0">Chưa có kết quả.</p>}</div></div><div className="card"><div className="card-body"><h2 className="h5">Chat phòng</h2><div className="list-group list-group-flush mb-3">{room.messages.length ? room.messages.map((chat) => <div key={chat.id} className="list-group-item px-0"><div className="d-flex justify-content-between"><strong className="small">{chat.displayName}</strong><small className="text-body-secondary">{messageTime(chat.createdAt)}</small></div><p className="mb-0 text-break">{chat.content}</p></div>) : <p className="text-body-secondary small mb-0">Chưa có tin nhắn.</p>}</div><form onSubmit={(form) => { form.preventDefault(); sendMessage.mutate({ code, content: chatContent }); }}><textarea className="form-control" rows={2} maxLength={500} value={chatContent} onChange={(input) => setChatContent(input.target.value)} placeholder="Nhắn với mọi người" /><div className="d-flex justify-content-end mt-2"><button className="btn btn-primary btn-sm" disabled={sendMessage.isPending || !chatContent.trim()}>Gửi</button></div></form></div></div></aside></div>{message ? <div className="alert alert-success mt-4">{message}</div> : null}{error ? <div className="alert alert-danger mt-4">{error}</div> : null}</div>;
}
