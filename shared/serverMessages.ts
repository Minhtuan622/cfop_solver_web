/**
 * Every sentence the server can send to the client, mapped to the key that
 * holds the same wording in the bilingual dictionary.
 *
 * The server writes in Vietnamese, so without this table an English visitor
 * would read Vietnamese every time an action failed. The client looks the
 * message up here and shows the sentence in the language of the interface; a
 * message that is not listed is never shown raw.
 *
 * `server/serverMessages.test.ts` reads the server sources and fails when a
 * sentence is missing from this table, so the two never drift apart.
 */
export const serverMessageKeys: Record<string, string> = {
  // Lỗi chung
  "Có lỗi xảy ra, vui lòng thử lại.": "common.error.internal",
  "Dữ liệu không hợp lệ:": "common.error.invalidData",
  "Dữ liệu gửi lên quá lớn.": "common.error.payloadTooLarge",
  "Không tìm thấy.": "common.error.notFound",

  // Tài khoản
  "Email này đã có tài khoản CFOP.": "account.error.emailTaken",
  "Email hoặc mật khẩu không đúng.": "account.error.invalidCredentials",
  "Mật khẩu hiện tại không đúng.": "profile.errorCurrentPassword",
  "Bạn đã thử quá nhiều lần. Vui lòng thử lại sau.": "account.error.rateLimited",
  "Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.": "account.error.resetLinkInvalid",
  "CFOP_ACCOUNT_REQUIRED": "account.error.required",

  // Hồ sơ
  "Ảnh đại diện không đúng định dạng.": "profile.errorAvatarFormat",
  "Ảnh đại diện phải nhỏ hơn 2 MB.": "profile.errorAvatarTooLarge",
  "Nội dung ảnh không khớp định dạng đã chọn.": "profile.errorAvatarMismatch",
  "Dữ liệu đồng bộ quá lớn. Hãy xuất backup cục bộ trước.": "profile.errorSyncTooLarge",

  // Kiểm tra dữ liệu
  "Mật khẩu cần ít nhất 10 ký tự.": "common.error.passwordTooShort",
  "Mật khẩu quá dài.": "common.error.passwordTooLong",
  "Email không hợp lệ.": "common.error.emailInvalid",
  "Tên hiển thị cần ít nhất 2 ký tự.": "common.error.displayNameTooShort",
  "Giới thiệu tối đa 280 ký tự.": "common.error.bioTooLong",
  "Mục tiêu cần ít nhất 1 giây.": "common.error.goalTooSmall",
  "Mục tiêu tối đa 60 phút.": "common.error.goalTooLarge",
  "Tên phòng cần ít nhất 2 ký tự.": "common.error.roomNameTooShort",
  "Tin nhắn không được để trống.": "common.error.messageEmpty",
  "Tin nhắn tối đa 500 ký tự.": "common.error.messageTooLong",
  "Hãy nêu lý do loại người xem (ít nhất 3 ký tự).": "common.error.removalReasonTooShort",
  "Lý do tối đa 280 ký tự.": "common.error.removalReasonTooLong",
  "Ngày phải theo YYYY-MM-DD.": "common.error.dateFormat",
  "Ngày kết thúc phải sau ngày bắt đầu.": "common.error.dateRange",

  // Phòng thi đấu
  "Không tìm thấy phòng thi đấu này.": "rooms.error.roomMissing",
  "Bạn chưa tham gia phòng này.": "rooms.error.notMember",
  "Bạn đã bị quản trị viên loại khỏi phòng.": "rooms.error.removed",
  "Bạn đã bị quản trị viên loại khỏi phòng. Lý do:": "rooms.error.removedWithReason",
  "Không có lý do được lưu.": "rooms.error.noReason",
  "Phòng đã bắt đầu; không thể tham gia lượt này.": "rooms.error.roomStarted",
  "Phòng đã đủ người chơi.": "rooms.error.roomFull",
  "Chỉ chủ phòng được cấp quyền moderator.": "rooms.error.hostOnlyGrant",
  "Chỉ chủ phòng được gỡ quyền moderator.": "rooms.error.hostOnlyRevoke",
  "Chỉ spectator có thể được nâng lên moderator.": "rooms.error.spectatorOnlyPromote",
  "Thành viên này không phải moderator.": "rooms.error.notModerator",
  "Chỉ chủ phòng hoặc moderator được quản lý khán giả.": "rooms.error.moderatorOnly",
  "Chỉ có thể loại spectator.": "rooms.error.spectatorOnlyRemove",
  "Chủ phòng không thể rời phòng. Hãy tạo phòng mới nếu cần.": "rooms.error.hostCannotLeave",
  "Chỉ chủ phòng được bắt đầu lượt mới.": "rooms.error.hostOnlyStart",
  "Thể thức này đã kết thúc. Hãy tạo phòng mới để thi tiếp.": "rooms.error.formatFinished",
  "Cần ít nhất 2 người thi trong phòng để bắt đầu thi đấu.": "rooms.error.needTwoPlayers",
  "Đã đủ số lượt của thể thức này. Hãy hoàn tất phòng để chốt bảng xếp hạng.": "rooms.error.roundLimitReached",
  "Người xem chỉ có thể theo dõi, không thể nộp kết quả.": "rooms.error.spectatorCannotSubmit",
  "Phòng chưa có lượt thi đấu đang mở.": "rooms.error.noOpenRound",
  "Lượt thi đấu đã chuyển. Hãy đồng bộ lại phòng trước khi nộp kết quả.": "rooms.error.roundChanged",
  "Bạn đã nộp kết quả cho lượt này.": "rooms.error.alreadySubmitted",
  "Cần nhập số khối MBLD giải đúng.": "rooms.error.multiBlindCount",
  "Số khối MBLD không khớp bundle của phòng.": "rooms.error.multiBlindMismatch",
  "Người xem không thể gửi chat trong phòng này.": "rooms.error.spectatorCannotChat",
  "Chỉ chủ phòng được xóa phòng.": "rooms.error.hostOnlyDelete",
  "Không thể xóa khi phòng đang thi. Hãy hoàn tất thể thức trước.": "rooms.error.cannotDeleteActive",
  "Chỉ chủ phòng được hoàn tất thể thức.": "rooms.error.hostOnlyFinish",
  "Chỉ chủ phòng được tạo Đấu lại.": "rooms.error.hostOnlyRematch",
  "Chỉ có thể Đấu lại sau khi phòng kết thúc.": "rooms.error.rematchAfterFinish",
  "Không thể tạo mã phòng. Hãy thử lại.": "rooms.error.createCodeFailed",
  "Không thể tạo phòng Đấu lại. Hãy thử lại.": "rooms.error.rematchFailed",
  "[system] Moderator đã loại một người xem khỏi phòng.": "rooms.error.systemRemoved",

  // WCA
  "Không thể xử lý dữ liệu WCA.": "wca.errorData",
  "Không tìm thấy WCA ID hoặc dữ liệu WCA.": "wca.errorNotFound",
  "WCA hiện chưa phản hồi dữ liệu. Hãy thử lại sau.": "wca.errorUnavailable",
  "Không thể kết nối WCA lúc này. Hãy thử lại sau.": "wca.errorUnreachable",
  "WCA ID cần theo dạng 2016ABCD01.": "wca.errorIdFormat",
  "Không tìm thấy hồ sơ WCA này.": "wca.errorProfileMissing",
  "WCA không trả về WCA ID hợp lệ.": "wca.errorOAuthInvalidId",
  "WCA OAuth chưa được cấu hình trên máy chủ.": "wca.errorOAuthNotConfigured",
  "Liên kết WCA đã hết hạn hoặc không hợp lệ.": "wca.errorOAuthInvalidState",
  "Phiên tài khoản CFOP không khớp với yêu cầu liên kết WCA.": "wca.errorOAuthAccountMismatch",
  "Không thể xác minh tài khoản WCA. Hãy thử liên kết lại.": "wca.errorOAuthLinkFailed",
};
