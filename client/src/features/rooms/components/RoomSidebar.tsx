import {
  competitionResultLabel,
  formatDescriptions,
  type RoomFormat,
} from "@/features/competition";
import type { TimerEventId } from "@/lib/timerEvents";
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
  onGrantModerator,
  onRevokeModerator,
  onRemoveSpectator,
}: Props) {
  const isMultiBlind = eventId === "333mbf";
  return (
    <aside className="col-12 col-xl-4">
      <div className="card mb-4">
        <div className="card-body">
          <h2 className="h5">Bảng xếp hạng</h2>
          <p className="text-body-secondary small">
            {isMultiBlind
              ? "Score → thời gian → unsolved"
              : formatDescriptions[format]}
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
                    {competitionResultLabel(player.lastResult, eventId)}
                  </strong>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-body-secondary mb-0">Chưa có kết quả.</p>
          )}
        </div>
      </div>
      <div className="card mb-4">
        <div className="card-body">
          <h2 className="h5">Thành viên</h2>
          {canManageSpectators ? (
            <p className="text-body-secondary small">
              {isHost
                ? "Cấp/gỡ moderator và loại spectator khi cần."
                : "Bạn có thể loại spectator để hỗ trợ chủ phòng."}
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
          />
        </div>
      </div>
      {canManageSpectators ? (
        <div className="card mb-4">
          <div className="card-body">
            <h2 className="h5">Nhật ký kiểm duyệt</h2>
            <p className="text-body-secondary small">
              Chỉ chủ phòng và moderator xem được lịch sử này.
            </p>
            {moderationLogs.length ? (
              <ol className="list-group list-group-numbered">
                {moderationLogs.map(entry => (
                  <li key={entry.id} className="list-group-item">
                    <strong>{entry.actorDisplayName}</strong> đã loại{" "}
                    <strong>{entry.targetDisplayName}</strong>
                    <small className="d-block text-body-secondary mt-1">
                      Lý do: {entry.reason} ·{" "}
                      {new Date(entry.createdAt).toLocaleString("vi-VN")}
                    </small>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-body-secondary small mb-0">
                Chưa có thao tác kiểm duyệt.
              </p>
            )}
          </div>
        </div>
      ) : null}
      {isSpectator ? (
        <div className="card">
          <div className="card-body text-body-secondary small">
            Khán giả và moderator không tham gia chat để kênh trao đổi của người
            thi luôn gọn.
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="card-body">
            <h2 className="h5">Chat phòng</h2>
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
                placeholder="Nhắn với người chơi"
              />
              <div className="text-end mt-2">
                <button
                  className="btn btn-primary btn-sm"
                  disabled={!chat.trim() || sendPending}
                >
                  Gửi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </aside>
  );
}
