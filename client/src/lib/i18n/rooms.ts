import type { Dictionary } from "./index";

/** The rooms section: the lobby, the round panel, the sidebar and moderation. */
export const roomsWords: Dictionary = {
  "rooms.title": ["Phòng thi đấu", "Competition rooms"],
  "rooms.roomTitle": ["Phòng {code}", "Room {code}"],
  "rooms.loadingAccount": ["Đang tải tài khoản", "Loading your account"],
  "rooms.loadingRoom": ["Đang tải phòng thi đấu", "Loading the competition room"],
  "rooms.signInHint": [
    "Đăng nhập tài khoản CFOP để tạo, thi hoặc theo dõi phòng.",
    "Sign in with a CFOP account to create, compete in or spectate a room.",
  ],
  "rooms.pickRole": ["Chọn vai trò trước khi vào phòng.", "Pick a role before entering the room."],
  "rooms.join": ["Tham gia thi", "Join the competition"],
  "rooms.spectate": ["Theo dõi trực tiếp", "Spectate live"],
  "rooms.round": ["lượt {current}/{limit}", "round {current}/{limit}"],
  "rooms.refreshing": ["Đang cập nhật phòng", "Refreshing the room"],
  "rooms.spectatorCount": ["{count} người xem trực tuyến", "{count} watching live"],
  "rooms.copyInvite": ["Sao chép link mời", "Copy invite link"],
  "rooms.rematch": ["Đấu lại", "Rematch"],
  "rooms.delete": ["Xóa phòng", "Delete room"],
  "rooms.leave": ["Rời phòng", "Leave room"],
  "rooms.roundOpened": ["Đã mở lượt mới.", "A new round is open."],
  "rooms.roundFinished": ["Đã hoàn tất thể thức.", "The format is complete."],
  "rooms.resultSubmitted": ["Đã nộp kết quả.", "Result submitted."],
  "rooms.spectatorNoticePrefix": [
    "Bạn đang theo dõi với vai trò",
    "You are watching as",
  ],
  "rooms.spectatorNoticeAction": [
    "Bạn xem được diễn biến trực tiếp;",
    "You can follow the action live;",
  ],
  "rooms.role.moderator": ["moderator", "moderator"],
  "rooms.role.spectator": ["khán giả", "spectator"],
  "rooms.ability.moderator": ["bạn có thể loại khán giả.", "you can remove spectators."],
  "rooms.ability.spectator": [
    "bạn không thể chat hoặc nộp kết quả.",
    "you cannot chat or submit results.",
  ],
  "rooms.deleteConfirmTitle": ["Xóa phòng này?", "Delete this room?"],
  "rooms.deleteConfirmDetail": [
    "Toàn bộ lượt, chat và kết quả phòng sẽ bị xóa.",
    "Every round, chat message and result of the room will be removed.",
  ],
  "rooms.deleteConfirmAction": ["Xóa phòng", "Delete room"],

  "rooms.lobby.title": ["Phòng thi đấu", "Competition rooms"],
  "rooms.lobby.intro": [
    "Chọn event, tạo scramble chung hoặc chia sẻ link để người khác thi và theo dõi.",
    "Pick an event, create a shared scramble or share a link so others can compete and follow along.",
  ],
  "rooms.lobby.nameLabel": ["Tên phòng", "Room name"],
  "rooms.lobby.eventLabel": ["Loại khối", "Puzzle type"],
  "rooms.lobby.formatLabel": ["Thể thức", "Format"],
  "rooms.lobby.maxPlayersLabel": ["Tối đa", "Maximum"],
  "rooms.lobby.playerCount": ["{count} người", "{count} players"],
  "rooms.lobby.mbldLabel": ["Số khối MBLD", "MBLD cube count"],
  "rooms.lobby.create": ["Tạo phòng", "Create room"],
  "rooms.lobby.joinByCode": ["Vào bằng mã", "Join by code"],
  "rooms.lobby.codeLabel": ["Mã phòng", "Room code"],
  "rooms.lobby.join": ["Tham gia thi", "Join the competition"],
  "rooms.lobby.myRooms": ["Phòng của bạn", "Your rooms"],
  "rooms.lobby.loadingRooms": ["Đang tải phòng của bạn", "Loading your rooms"],
  "rooms.lobby.emptyTitle": ["Chưa có phòng.", "No rooms yet."],
  "rooms.lobby.emptyDetail": [
    "Tạo phòng mới ở ô bên cạnh hoặc tham gia bằng mã để bắt đầu lượt thi.",
    "Create a room in the panel next to this one, or join by code to start a round.",
  ],

  "rooms.round.bundle": [
    "Bundle MBLD · {count} khối · giới hạn {limit}",
    "MBLD bundle · {count} cubes · limit {limit}",
  ],
  "rooms.round.waitingHost": ["Đang chờ chủ phòng bắt đầu lượt.", "Waiting for the host to start the round."],
  "rooms.round.finished": ["Phòng đã hoàn tất.", "The room is complete."],
  "rooms.round.finishedHost": ["Bạn có thể Đấu lại hoặc Xóa phòng.", "You can rematch or delete the room."],
  "rooms.round.counter": ["Lượt {current}/{limit} · Scramble chung", "Round {current}/{limit} · Shared scramble"],
  "rooms.round.next": ["Lượt tiếp", "Next round"],
  "rooms.round.spectating": [
    "Chế độ xem trực tiếp đang hoạt động. Kết quả sẽ tự cập nhật.",
    "Live view is on. Results update automatically.",
  ],
  "rooms.round.submitted": ["Đã nộp: {result}", "Submitted: {result}"],
  "rooms.round.mbldTitle": ["Kết quả Multi-Blind", "Multi-Blind result"],
  "rooms.round.mbldSolved": ["Số khối giải đúng", "Cubes solved"],
  "rooms.round.mbldScore": ["Score: {score} · Unsolved: {unsolved}", "Score: {score} · Unsolved: {unsolved}"],
  "rooms.round.mbldSubmit": ["Nộp score MBLD", "Submit MBLD score"],
  "rooms.round.waitingTitle": ["Đang chờ lượt", "Waiting for the round"],
  "rooms.round.start": ["Bắt đầu lượt", "Start the round"],
  "rooms.round.finish": ["Hoàn tất thể thức", "Finish the format"],
  "rooms.round.waitingHostShort": ["Đợi chủ phòng bắt đầu lượt.", "Wait for the host to start the round."],

  "rooms.sidebar.standings": ["Bảng xếp hạng", "Standings"],
  "rooms.sidebar.standingsRule": ["Score → thời gian → unsolved", "Score → time → unsolved"],
  "rooms.sidebar.noResults": ["Chưa có kết quả.", "No results yet."],
  "rooms.sidebar.members": ["Thành viên", "Members"],
  "rooms.sidebar.manageHint": [
    "Cấp/gỡ moderator và loại spectator khi cần.",
    "Grant or revoke moderators and remove spectators when needed.",
  ],
  "rooms.sidebar.supportHint": [
    "Bạn có thể loại spectator để hỗ trợ chủ phòng.",
    "You can remove spectators to support the host.",
  ],
  "rooms.sidebar.moderationLog": ["Nhật ký kiểm duyệt", "Moderation log"],
  "rooms.sidebar.moderationHint": [
    "Chỉ chủ phòng và moderator xem được lịch sử này.",
    "Only the host and the moderators can see this log.",
  ],
  "rooms.sidebar.moderationReason": ["Lý do: {reason}", "Reason: {reason}"],
  "rooms.sidebar.moderationNotice": [
    "{actor} đã loại {target}. Lý do: {reason}",
    "{actor} removed {target}. Reason: {reason}",
  ],
  "rooms.sidebar.moderationVerb": ["đã loại", "removed"],
  "rooms.sidebar.noModeration": ["Chưa có thao tác kiểm duyệt.", "No moderation actions yet."],
  "rooms.sidebar.spectatorNote": [
    "Khán giả và moderator không tham gia chat để kênh trao đổi của người thi luôn gọn.",
    "Spectators and moderators stay out of the chat so the competitors keep a clear channel.",
  ],
  "rooms.sidebar.chat": ["Chat phòng", "Room chat"],
  "rooms.sidebar.chatPlaceholder": ["Nhắn với người chơi", "Message the players"],
  "rooms.sidebar.send": ["Gửi", "Send"],

  "rooms.member.role.player": ["Người thi", "Player"],
  "rooms.member.role.moderator": ["Moderator", "Moderator"],
  "rooms.member.role.spectator": ["Khán giả", "Spectator"],
  "rooms.member.grantModerator": ["Cấp moderator", "Make moderator"],
  "rooms.member.revokeModerator": ["Gỡ quyền", "Revoke"],
  "rooms.member.remove": ["Loại", "Remove"],
  "rooms.member.watching": ["Đang xem ({count})", "Watching ({count})"],
  "rooms.member.noWatchers": ["Chưa có người xem trực tuyến.", "Nobody is watching live."],

  "rooms.moderation.removeTitle": ["Loại {name}", "Remove {name}"],
  "rooms.moderation.removeDetail": [
    "Ghi rõ lý do để người xem nhận được thông báo và phòng có nhật ký kiểm duyệt.",
    "Give a reason so the viewer is notified and the room keeps a moderation log.",
  ],
  "rooms.moderation.reasonLabel": ["Lý do loại người xem", "Reason for removing the viewer"],
  "rooms.moderation.reasonPlaceholder": [
    "Ví dụ: Spam trong tên hiển thị hoặc làm gián đoạn phòng.",
    "For example: spam in the display name or disrupting the room.",
  ],
  "rooms.moderation.reasonHint": [
    "Lý do sẽ hiển thị trong toast của spectator và nhật ký kiểm duyệt.",
    "The reason shows in the spectator toast and in the moderation log.",
  ],
  "rooms.moderation.cancel": ["Hủy", "Cancel"],
  "rooms.moderation.confirm": ["Xác nhận loại", "Confirm removal"],

  "rooms.error.roomMissing": [
    "Không tìm thấy phòng thi đấu này.",
    "This competition room does not exist.",
  ],
  "rooms.error.notMember": ["Bạn chưa tham gia phòng này.", "You are not in this room."],
  "rooms.error.removed": [
    "Bạn đã bị quản trị viên loại khỏi phòng.",
    "A moderator removed you from the room.",
  ],
  "rooms.error.removedWithReason": [
    "Bạn đã bị quản trị viên loại khỏi phòng. Lý do:",
    "A moderator removed you from the room. Reason:",
  ],
  "rooms.error.noReason": ["Không có lý do được lưu.", "No reason was given."],
  "rooms.error.roomStarted": [
    "Phòng đã bắt đầu; không thể tham gia lượt này.",
    "The room has already started; you cannot join this round.",
  ],
  "rooms.error.roomFull": ["Phòng đã đủ người chơi.", "The room is full."],
  "rooms.error.hostOnlyGrant": [
    "Chỉ chủ phòng được cấp quyền moderator.",
    "Only the host can make someone a moderator.",
  ],
  "rooms.error.hostOnlyRevoke": [
    "Chỉ chủ phòng được gỡ quyền moderator.",
    "Only the host can take the moderator role away.",
  ],
  "rooms.error.spectatorOnlyPromote": [
    "Chỉ spectator có thể được nâng lên moderator.",
    "Only a spectator can be made a moderator.",
  ],
  "rooms.error.notModerator": [
    "Thành viên này không phải moderator.",
    "This member is not a moderator.",
  ],
  "rooms.error.moderatorOnly": [
    "Chỉ chủ phòng hoặc moderator được quản lý khán giả.",
    "Only the host or a moderator can manage the spectators.",
  ],
  "rooms.error.spectatorOnlyRemove": ["Chỉ có thể loại spectator.", "Only a spectator can be removed."],
  "rooms.error.hostCannotLeave": [
    "Chủ phòng không thể rời phòng. Hãy tạo phòng mới nếu cần.",
    "The host cannot leave the room. Create a new one instead.",
  ],
  "rooms.error.hostOnlyStart": [
    "Chỉ chủ phòng được bắt đầu lượt mới.",
    "Only the host can start a new round.",
  ],
  "rooms.error.formatFinished": [
    "Thể thức này đã kết thúc. Hãy tạo phòng mới để thi tiếp.",
    "This format is over. Create a new room to keep competing.",
  ],
  "rooms.error.needTwoPlayers": [
    "Cần ít nhất 2 người thi trong phòng để bắt đầu thi đấu.",
    "At least 2 competitors are needed in the room to start.",
  ],
  "rooms.error.roundLimitReached": [
    "Đã đủ số lượt của thể thức này. Hãy hoàn tất phòng để chốt bảng xếp hạng.",
    "This format has run all its rounds. Finish the room to settle the standings.",
  ],
  "rooms.error.spectatorCannotSubmit": [
    "Người xem chỉ có thể theo dõi, không thể nộp kết quả.",
    "Spectators can watch, but cannot submit a result.",
  ],
  "rooms.error.noOpenRound": [
    "Phòng chưa có lượt thi đấu đang mở.",
    "The room has no open round right now.",
  ],
  "rooms.error.roundChanged": [
    "Lượt thi đấu đã chuyển. Hãy đồng bộ lại phòng trước khi nộp kết quả.",
    "The round moved on. Sync the room again before submitting.",
  ],
  "rooms.error.alreadySubmitted": [
    "Bạn đã nộp kết quả cho lượt này.",
    "You already submitted a result for this round.",
  ],
  "rooms.error.multiBlindCount": [
    "Cần nhập số khối MBLD giải đúng.",
    "Enter the right number of MBLD cubes you solved.",
  ],
  "rooms.error.multiBlindMismatch": [
    "Số khối MBLD không khớp bundle của phòng.",
    "The MBLD count does not match the room bundle.",
  ],
  "rooms.error.spectatorCannotChat": [
    "Người xem không thể gửi chat trong phòng này.",
    "Spectators cannot chat in this room.",
  ],
  "rooms.error.hostOnlyDelete": ["Chỉ chủ phòng được xóa phòng.", "Only the host can delete the room."],
  "rooms.error.cannotDeleteActive": [
    "Không thể xóa khi phòng đang thi. Hãy hoàn tất thể thức trước.",
    "The room cannot be deleted while it is running. Finish the format first.",
  ],
  "rooms.error.hostOnlyFinish": [
    "Chỉ chủ phòng được hoàn tất thể thức.",
    "Only the host can finish the format.",
  ],
  "rooms.error.hostOnlyRematch": [
    "Chỉ chủ phòng được tạo Đấu lại.",
    "Only the host can start a rematch.",
  ],
  "rooms.error.rematchAfterFinish": [
    "Chỉ có thể Đấu lại sau khi phòng kết thúc.",
    "A rematch is only possible once the room is over.",
  ],
  "rooms.error.createCodeFailed": [
    "Không thể tạo mã phòng. Hãy thử lại.",
    "The room code could not be created. Please try again.",
  ],
  "rooms.error.rematchFailed": [
    "Không thể tạo phòng Đấu lại. Hãy thử lại.",
    "The rematch room could not be created. Please try again.",
  ],
  "rooms.error.systemRemoved": [
    "[system] Moderator đã loại một người xem khỏi phòng.",
    "[system] A moderator removed a spectator from the room.",
  ],
};
