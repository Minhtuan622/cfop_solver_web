import {
  competitionResultLabel,
  formatDescriptionKey,
  type RoomFormat,
} from "@/features/competition";
import { PendingButton } from "@/components/ui/StudioUI";
import { translateServerText } from "@/lib/apiError";
import type { TimerEventId } from "@/lib/timerEvents";
import { useLanguage } from "@/contexts/LanguageContext";
import { RoomMemberRoster } from "./RoomMemberRoster";
import { Input } from "@/components/ui/FormControls";
import { Select } from "@/components/ui/FormControls";
import { Textarea } from "@/components/ui/FormControls";
import { buttonClass } from "@/components/ui/Button";
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
    <aside className="col-span-12 xl:col-span-4">
      <div className="rounded-card border border-line/80 bg-surface shadow-soft mb-6">
        <div className="p-5 sm:p-6">
          <h2 className="text-base font-semibold tracking-tight">
            {t("rooms.sidebar.standings")}
          </h2>
          <p className="text-muted text-sm">
            {isMultiBlind
              ? t("rooms.sidebar.standingsRule")
              : t(formatDescriptionKey[format])}
          </p>
          {standings.length ? (
            <ol className="divide-y divide-line overflow-hidden rounded-panel border border-line bg-surface list-decimal pl-6">
              {standings.map(player => (
                <li
                  key={player.accountId}
                  className="block px-4 py-3 text-sm flex justify-between"
                >
                  <span>{player.displayName}</span>
                  <strong>
                    {competitionResultLabel(player.lastResult, eventId, t)}
                  </strong>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-muted mb-0">{t("rooms.sidebar.noResults")}</p>
          )}
        </div>
      </div>
      <div className="rounded-card border border-line/80 bg-surface shadow-soft mb-6">
        <div className="p-5 sm:p-6">
          <h2 className="text-base font-semibold tracking-tight">
            {t("rooms.sidebar.members")}
          </h2>
          {canManageSpectators ? (
            <p className="text-muted text-sm">
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
        <div className="rounded-card border border-line/80 bg-surface shadow-soft mb-6">
          <div className="p-5 sm:p-6">
            <h2 className="text-base font-semibold tracking-tight">
              {t("rooms.sidebar.moderationLog")}
            </h2>
            <p className="text-muted text-sm">
              {t("rooms.sidebar.moderationHint")}
            </p>
            {moderationLogs.length ? (
              <ol className="divide-y divide-line overflow-hidden rounded-panel border border-line bg-surface list-decimal pl-6">
                {moderationLogs.map(entry => (
                  <li key={entry.id} className="block px-4 py-3 text-sm">
                    <strong>{entry.actorDisplayName}</strong>{" "}
                    {t("rooms.sidebar.moderationVerb")}{" "}
                    <strong>{entry.targetDisplayName}</strong>
                    <small className="block text-muted mt-1">
                      {t("rooms.sidebar.moderationReason", {
                        reason: entry.reason,
                      })}{" "}
                      ·{" "}
                      {new Date(entry.createdAt).toLocaleString(
                        language === "vi" ? "vi-VN" : "en-US"
                      )}
                    </small>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-muted text-sm mb-0">
                {t("rooms.sidebar.noModeration")}
              </p>
            )}
          </div>
        </div>
      ) : null}
      {isSpectator ? (
        <div className="rounded-card border border-line/80 bg-surface shadow-soft">
          <div className="p-5 sm:p-6 text-muted text-sm">
            {t("rooms.sidebar.spectatorNote")}
          </div>
        </div>
      ) : (
        <div className="rounded-card border border-line/80 bg-surface shadow-soft">
          <div className="p-5 sm:p-6">
            <h2 className="text-base font-semibold tracking-tight">
              {t("rooms.sidebar.chat")}
            </h2>
            <div className="divide-y divide-line bg-transparent border-0 mb-4">
              {messages.map(chatItem => (
                <div key={chatItem.id} className="block px-4 py-3 text-sm px-0">
                  <strong className="text-sm">{chatItem.displayName}</strong>
                  <p className="mb-0 break-words">
                    {translateServerText(chatItem.content, t) ??
                      chatItem.content}
                  </p>
                </div>
              ))}
            </div>
            <form
              onSubmit={form => {
                form.preventDefault();
                onSend();
              }}
            >
              <Textarea
                rows={2}
                value={chat}
                maxLength={500}
                onChange={input => onChatChange(input.target.value)}
                placeholder={t("rooms.sidebar.chatPlaceholder")}
              />
              <div className="text-right mt-2">
                <PendingButton
                  className={`${buttonClass("primary", "sm")}`}
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
