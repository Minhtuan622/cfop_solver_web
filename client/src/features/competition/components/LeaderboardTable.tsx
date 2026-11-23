import { Link } from "wouter";
import { LoadingTransition } from "@/components/ui/StudioUI";
import { PersonCircle } from "@/components/ui/Icon";
import { useLanguage } from "@/contexts/LanguageContext";

export type LeaderboardPlayer = {
  accountId: number;
  displayName: string;
  avatarUrl: string | null;
  points: number;
  wins: number;
  rooms: number;
  rank: number;
};

function PlayerAvatar({ player, size }: { player: LeaderboardPlayer; size: number }) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-3"
      style={{ width: size, height: size }}
    >
      {player.avatarUrl ? (
        <img src={player.avatarUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        <PersonCircle className="text-muted" />
      )}
    </span>
  );
}

/**
 * Bảng xếp hạng: ba người dẫn đầu là ba ô lớn (phẳng, không huy chương),
 * những người còn lại là danh sách gọn mỗi người một dòng.
 */
export function LeaderboardTable({ players }: { players: LeaderboardPlayer[] }) {
  const { t } = useLanguage();
  const podium = players.slice(0, 3);
  const rest = players.slice(3);
  return (
    <LoadingTransition>
      <ol
        className="grid grid-cols-1 gap-3 sm:grid-cols-3"
        aria-label={t("competition.podium.label")}
      >
        {podium.map(player => (
          <li key={player.accountId}>
            <Link
              href={`/competition/player/${player.accountId}`}
              className={
                "flex h-full flex-col gap-3 rounded-panel p-4 no-underline transition-colors " +
                (player.rank === 1
                  ? "bg-primary-soft hover:bg-surface-3"
                  : "bg-surface-2 hover:bg-surface-3")
              }
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  className={
                    "inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold " +
                    (player.rank === 1 ? "bg-primary text-on-primary" : "bg-surface text-ink")
                  }
                >
                  {player.rank}
                </span>
                <span className="text-xs text-muted">
                  {t("competition.filter.winsRooms", { wins: player.wins, rooms: player.rooms })}
                </span>
              </div>
              <div className="flex min-w-0 items-center gap-2">
                <PlayerAvatar player={player} size={36} />
                <span className="truncate text-base font-semibold text-ink">
                  {player.displayName}
                </span>
              </div>
              <span className="text-2xl font-semibold tabular-nums tracking-tight text-ink">
                {t("competition.filter.points", { points: player.points })}
              </span>
            </Link>
          </li>
        ))}
      </ol>
      {rest.length ? (
        <ol className="mt-4 flex flex-col gap-1" start={4}>
          {rest.map(player => (
            <li key={player.accountId}>
              <Link
                href={`/competition/player/${player.accountId}`}
                className="flex items-center gap-3 rounded-panel px-3 py-2.5 text-sm no-underline transition-colors hover:bg-surface-2"
              >
                <span className="w-6 text-center font-semibold tabular-nums text-muted">
                  {player.rank}
                </span>
                <PlayerAvatar player={player} size={28} />
                <span className="min-w-0 flex-1 truncate font-semibold text-ink">
                  {player.displayName}
                </span>
                <span className="hidden text-xs text-muted sm:inline">
                  {t("competition.filter.winsRooms", { wins: player.wins, rooms: player.rooms })}
                </span>
                <span className="w-20 text-right font-semibold tabular-nums text-ink">
                  {t("competition.filter.points", { points: player.points })}
                </span>
              </Link>
            </li>
          ))}
        </ol>
      ) : null}
    </LoadingTransition>
  );
}
