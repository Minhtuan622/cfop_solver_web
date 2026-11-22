/**
 * Dải gọn "Top 3 tuần này" cho trang Thi đấu: thay cho bảng xếp hạng đầy đủ
 * (đã có ở trang Xếp hạng), kèm liên kết sang đó.
 */
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

export function LeaderboardTeaser({ className }: { className?: string }) {
  const { t } = useLanguage();
  const query = trpc.competition.leaderboard.useQuery(
    { period: "week", eventId: null },
    { retry: false }
  );
  const top = query.data?.players.slice(0, 3) ?? [];
  return (
    <section
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 rounded-card bg-surface px-5 py-4 sm:px-6",
        className
      )}
      aria-label={t("competition.teaser.title")}
    >
      <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2">
        <h2 className="mb-0 text-sm font-semibold tracking-tight text-ink">
          {t("competition.teaser.title")}
        </h2>
        {query.isLoading ? (
          <span className="text-sm text-muted">{t("competition.loading")}</span>
        ) : top.length ? (
          <ol className="mb-0 flex flex-wrap items-center gap-2">
            {top.map((player, index) => (
              <li key={player.accountId}>
                <Link
                  href={`/competition/player/${player.accountId}`}
                  className="inline-flex items-center gap-2 rounded-full bg-surface-2 py-1 pl-1 pr-3 text-sm text-ink no-underline transition-colors hover:bg-surface-3"
                >
                  <span
                    className={cn(
                      "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold",
                      index === 0 ? "bg-primary text-on-primary" : "bg-surface text-muted"
                    )}
                  >
                    {index + 1}
                  </span>
                  <span className="max-w-[10rem] truncate font-semibold">{player.displayName}</span>
                  <span className="text-xs tabular-nums text-muted">
                    {t("competition.filter.points", { points: player.points })}
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        ) : (
          <span className="text-sm text-muted">{t("competition.teaser.empty")}</span>
        )}
      </div>
      <Link
        href="/competition"
        className="rounded-full px-3 py-1.5 text-sm font-semibold text-primary no-underline transition-colors hover:bg-primary-soft"
      >
        {t("competition.teaser.viewAll")}
      </Link>
    </section>
  );
}
