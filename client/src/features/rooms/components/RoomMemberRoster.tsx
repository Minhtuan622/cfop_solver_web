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
      <div className="list-group list-group-flush">
        {members.map(member => (
          <div
            key={member.accountId}
            className="list-group-item px-0 d-flex flex-wrap justify-content-between align-items-center gap-2"
          >
            <span>
              {member.displayName}
              <small className="d-block text-body-secondary">
                {roleLabel(member.role)}
              </small>
            </span>
            <span className="d-flex gap-1">
              {host && member.role === "spectator" ? (
                <button
                  type="button"
                  className="btn btn-outline-primary btn-sm"
                  onClick={() => grant(member.accountId)}
                >
                  {t("rooms.member.grantModerator")}
                </button>
              ) : null}
              {host && member.role === "moderator" ? (
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => revoke(member.accountId)}
                >
                  {t("rooms.member.revokeModerator")}
                </button>
              ) : null}
              {(host || moderator) && member.role === "spectator" ? (
                <button
                  type="button"
                  className="btn btn-outline-danger btn-sm"
                  onClick={() => remove(member)}
                >
                  {t("rooms.member.remove")}
                </button>
              ) : null}
            </span>
          </div>
        ))}
      </div>
      <h3 className="h6 mt-4 mb-2">{t("rooms.member.watching", { count: onlineSpectators.length })}</h3>
      {onlineSpectators.length ? (
        <ol className="list-group list-group-numbered">
          {onlineSpectators.map(member => (
            <li
              key={member.accountId}
              className="list-group-item d-flex justify-content-between"
            >
              <span>{member.displayName}</span>
              <small className="text-body-secondary">
                {roleLabel(member.role)}
              </small>
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-body-secondary small mb-0">
          {t("rooms.member.noWatchers")}
        </p>
      )}
      {notice ? (
        <div className="alert alert-warning small mt-3 mb-0" role="status">
          {notice}
        </div>
      ) : null}
    </>
  );
}
