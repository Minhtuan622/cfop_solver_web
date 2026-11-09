import { PendingButton } from "@/components/ui/StudioUI";
import { useLanguage } from "@/contexts/LanguageContext";
import type { RemovalTarget, RoomMember } from "../lib/roomTypes";

type Props = {
  members: RoomMember[];
  onlineSpectators: RoomMember[];
  host: boolean;
  moderator: boolean;
  grant: (accountId: number) => void;
  revoke: (accountId: number) => void;
  remove: (member: RemovalTarget) => void;
  notice: string | null;
  /** True while a moderation action is still running. */
  moderationPending: boolean;
};

export function RoomMemberRoster({
  members,
  onlineSpectators,
  host,
  moderator,
  grant,
  revoke,
  remove,
  notice,
  moderationPending,
}: Props) {
  const { t } = useLanguage();
  const roleLabel = (role: RoomMember["role"]) =>
    role === "player"
      ? t("rooms.member.role.player")
      : role === "moderator"
        ? t("rooms.member.role.moderator")
        : t("rooms.member.role.spectator");
  return (
    <>
      <div className="divide-y divide-line bg-transparent border-0">
        {members.map(member => (
          <div
            key={member.accountId}
            className="block px-4 py-3 text-sm px-0 flex flex-wrap justify-between items-center gap-2"
          >
            <span>
              {member.displayName}
              <small className="block text-muted">
                {roleLabel(member.role)}
              </small>
            </span>
            <span className="flex gap-1">
              {host && member.role === "spectator" ? (
                <PendingButton
                  type="button"
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold leading-none outline-none transition focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 border-primary/35 bg-transparent text-primary hover:bg-primary-soft px-3 py-1.5 text-xs"
                  pending={moderationPending}
                  onClick={() => grant(member.accountId)}
                >
                  {t("rooms.member.grantModerator")}
                </PendingButton>
              ) : null}
              {host && member.role === "moderator" ? (
                <PendingButton
                  type="button"
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold leading-none outline-none transition focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 border-line bg-surface text-ink hover:bg-surface-2 px-3 py-1.5 text-xs"
                  pending={moderationPending}
                  onClick={() => revoke(member.accountId)}
                >
                  {t("rooms.member.revokeModerator")}
                </PendingButton>
              ) : null}
              {(host || moderator) && member.role === "spectator" ? (
                <button
                  type="button"
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold leading-none outline-none transition focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 border-danger/35 bg-transparent text-danger hover:bg-danger-soft px-3 py-1.5 text-xs"
                  onClick={() => remove(member)}
                >
                  {t("rooms.member.remove")}
                </button>
              ) : null}
            </span>
          </div>
        ))}
      </div>
      <h3 className="text-sm font-semibold tracking-tight mt-6 mb-2">
        {t("rooms.member.watching", { count: onlineSpectators.length })}
      </h3>
      {onlineSpectators.length ? (
        <ol className="divide-y divide-line overflow-hidden rounded-panel border border-line bg-surface list-decimal pl-6">
          {onlineSpectators.map(member => (
            <li
              key={member.accountId}
              className="block px-4 py-3 text-sm flex justify-between"
            >
              <span>{member.displayName}</span>
              <small className="text-muted">{roleLabel(member.role)}</small>
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-muted text-sm mb-0">
          {t("rooms.member.noWatchers")}
        </p>
      )}
      {notice ? (
        <div
          className="rounded-panel border px-4 py-3 text-sm border-warning/25 bg-warning-soft text-ink mt-4 mb-0"
          role="status"
        >
          {notice}
        </div>
      ) : null}
    </>
  );
}
