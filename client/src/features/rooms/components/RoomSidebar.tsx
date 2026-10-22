import {
  competitionResultLabel,
  formatDescriptionKey,
  type RoomFormat,
} from "@/features/competition";
import { PendingButton } from "@/components/ui/BootstrapUI";
import type { TimerEventId } from "@/lib/timerEvents";
import { useLanguage } from "@/contexts/LanguageContext";
import { RoomMemberRoster } from "./RoomMemberRoster";
import type {
  RemovalTarget,
  RoomMember,
  RoomMessage,
  RoomModerationEntry,
  RoomStanding,
} from "../lib/roomTypes";

type Props = {
  eventId: TimerEventId;
  format: RoomFormat;
  standings: RoomStanding[];
  canManageSpectators: boolean;
  isHost: boolean;
  isModerator: boolean;
  members: RoomMember[];
  onlineSpectators: RoomMember[];
  moderationNotice: string | null;
  moderationLogs: RoomModerationEntry[];
  isSpectator: boolean;
  messages: RoomMessage[];
  chat: string;
  onChatChange: (value: string) => void;
  onSend: () => void;
  sendPending: boolean;
  /** True while a moderator grant or revoke is still running. */
  moderationPending: boolean;
  onGrantModerator: (accountId: number) => void;
  onRevokeModerator: (accountId: number) => void;
  onRemoveSpectator: (target: RemovalTarget) => void;
};

/** The right-hand column: standings, members, moderation log and chat. */
export function RoomSidebar({
  eventId,
  format,
  standings,
  canManageSpectators,
  isHost,
  isModerator,
  members,
  onlineSpectators,
  moderationNotice,
  moderationLogs,
  isSpectator,
  messages,
  chat,
  onChatChange,
  onSend,
  sendPending,
  moderationPending,
  onGrantModerator,
  onRevokeModerator,
  onRemoveSpectator,
}: Props) {
  const { language, t } = useLanguage();
  const isMultiBlind = eventId === "333mbf";
  return (
    <aside className="col-12 col-xl-4">
      <div className="card mb-4">
        <div className="card-body">
          <h2 className="h5">{t("rooms.sidebar.standings")}</h2>
          <p className="text-body-secondary small">
            {isMultiBlind
              ? t("rooms.sidebar.standingsRule")
              : t(formatDescriptionKey[format])}
          </p>
          {standings.length ? (
            <ol className="list-group list-group-numbered">
              {standings.map(player => (
                <li
                  key={player.accountId}
                  className="list-group-item d-flex justify-content-between"
                >
                  <span>{player.displayName}</span>
                  <strong>
                    {competitionResultLabel(player.lastResult, eventId, t)}
                  </strong>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-body-secondary mb-0">{t("rooms.sidebar.noResults")}</p>
          )}
        </div>
      </div>
      <div className="card mb-4">
        <div className="card-body">
          <h2 className="h5">{t("rooms.sidebar.members")}</h2>
          {canManageSpectators ? (
            <p className="text-body-secondary small">
              {isHost
                ? t("rooms.sidebar.manageHint")
                : t("rooms.sidebar.supportHint")}
            </p>
          ) : null}
          <RoomMemberRoster
            members={members}
            onlineSpectators={onlineSpectators}
            host={isHost}
            moderator={isModerator}
            grant={onGrantModerator}
            revoke={onRevokeModerator}
            remove={onRemoveSpectator}
            notice={moderationNotice}
            moderationPending={moderationPending}
          />
        </div>
      </div>
      {canManageSpectators ? (
        <div className="card mb-4">
          <div className="card-body">
            <h2 className="h5">{t("rooms.sidebar.moderationLog")}</h2>
            <p className="text-body-secondary small">
              {t("rooms.sidebar.moderationHint")}
            </p>
            {moderationLogs.length ? (
              <ol className="list-group list-group-numbered">
                {moderationLogs.map(entry => (
                  <li key={entry.id} className="list-group-item">
                    <strong>{entry.actorDisplayName}</strong> {t("rooms.sidebar.moderationVerb")}{" "}
                    <strong>{entry.targetDisplayName}</strong>
                    <small className="d-block text-body-secondary mt-1">
                      {t("rooms.sidebar.moderationReason", { reason: entry.reason })} ·{" "}
                      {new Date(entry.createdAt).toLocaleString(language === "vi" ? "vi-VN" : "en-US")}
                    </small>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-body-secondary small mb-0">
                {t("rooms.sidebar.noModeration")}
              </p>
            )}
          </div>
        </div>
      ) : null}
      {isSpectator ? (
        <div className="card">
          <div className="card-body text-body-secondary small">
            {t("rooms.sidebar.spectatorNote")}
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="card-body">
            <h2 className="h5">{t("rooms.sidebar.chat")}</h2>
            <div className="list-group list-group-flush mb-3">
              {messages.map(chatItem => (
                <div key={chatItem.id} className="list-group-item px-0">
                  <strong className="small">{chatItem.displayName}</strong>
                  <p className="mb-0 text-break">{chatItem.content}</p>
                </div>
              ))}
            </div>
            <form
              onSubmit={form => {
                form.preventDefault();
                onSend();
              }}
            >
              <textarea
                className="form-control"
                rows={2}
                value={chat}
                maxLength={500}
                onChange={input => onChatChange(input.target.value)}
                placeholder={t("rooms.sidebar.chatPlaceholder")}
              />
              <div className="text-end mt-2">
                <PendingButton
                  className="btn btn-primary btn-sm"
                  disabled={!chat.trim()}
                  pending={sendPending}
                >
                  {t("rooms.sidebar.send")}
                </PendingButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </aside>
  );
}
