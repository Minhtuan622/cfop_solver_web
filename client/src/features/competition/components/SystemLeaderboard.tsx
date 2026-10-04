import { useMemo, useState } from "react";
import { Link } from "wouter";
import { CompetitionLeaderboardFilters, type CompetitionPeriod } from "@/features/competitionLeaderboardFilters";
import { LoadingTransition, RefreshIndicator, SkeletonList } from "@/components/ui/BootstrapUI";
import { trpc } from "@/lib/trpc";
import { type TimerEventId } from "@/lib/timerEvents";

export function SystemLeaderboard() {
  const [period, setPeriod] = useState<CompetitionPeriod>("week");
  const [eventId, setEventId] = useState<TimerEventId | "all">("all");
  const input = useMemo(() => ({ period, eventId: eventId === "all" ? null : eventId }), [period, eventId]);
  const leaderboardQuery = trpc.competition.leaderboard.useQuery(input, { retry: false });
  return <section className="card mt-4"><div className="card-body"><div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3"><div><h2 className="h5 mb-1">Bảng xếp hạng toàn hệ thống</h2><p className="text-body-secondary small mb-0">Chọn bộ môn để xem điểm từ các phòng đã hoàn tất của riêng event đó.</p></div><CompetitionLeaderboardFilters period={period} onPeriodChange={setPeriod} eventId={eventId} onEventChange={setEventId} idPrefix="rooms-leaderboard" /></div>{leaderboardQuery.isFetching && leaderboardQuery.data ? <div className="mb-2 text-end"><RefreshIndicator label="Đang cập nhật" /></div> : null}{leaderboardQuery.isLoading ? <SkeletonList rows={3} label="Đang tải bảng xếp hạng" /> : leaderboardQuery.isError ? <div className="alert alert-danger mb-0" role="alert">Không thể tải bảng xếp hạng. Hãy thử lại sau.</div> : leaderboardQuery.data?.players.length ? <LoadingTransition><ol className="list-group list-group-numbered">{leaderboardQuery.data.players.slice(0, 10).map((player) => <li key={player.accountId} className="list-group-item d-flex justify-content-between align-items-center gap-2"><Link href={`/competition/player/${player.accountId}`} className="text-truncate text-decoration-none"><strong>{player.displayName}</strong><small className="d-block text-body-secondary">{player.wins} chiến thắng · {player.rooms} phòng đã tính</small></Link><span className="badge text-bg-primary rounded-pill">{player.points} điểm</span></li>)}</ol></LoadingTransition> : <p className="text-body-secondary mb-0">Chưa có đủ phòng hoàn tất với từ hai người chơi trong khoảng thời gian này.</p>}<div className="mt-3"><Link href="/competition" className="btn btn-outline-secondary btn-sm">Xem bảng đầy đủ</Link></div></div></section>;
}
