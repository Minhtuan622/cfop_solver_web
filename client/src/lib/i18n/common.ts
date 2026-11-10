import type { Dictionary } from "./index";

/** Words shared by more than one feature: dialog buttons, retries, loading. */
export const commonWords: Dictionary = {
  "common.close": ["Đóng", "Close"],
  "common.cancel": ["Hủy", "Cancel"],
  "common.loading": ["Đang tải…", "Loading…"],

  "common.error.unknown": ["Không thể hoàn tất. Hãy thử lại.", "Something went wrong. Please try again."],
  "common.error.server": [
    "Máy chủ đang gặp sự cố. Vui lòng thử lại sau ít phút.",
    "The server hit a problem. Please try again in a moment.",
  ],
  "common.error.internal": [
    "Có lỗi xảy ra, vui lòng thử lại.",
    "An error occurred. Please try again.",
  ],
  "common.error.invalidData": ["Dữ liệu không hợp lệ:", "Invalid details:"],
  "common.error.payloadTooLarge": [
    "Dữ liệu gửi lên quá lớn.",
    "The details you are sending are too large.",
  ],
  "common.error.notFound": ["Không tìm thấy.", "Not found."],
  "common.error.passwordTooShort": [
    "Mật khẩu cần ít nhất 10 ký tự.",
    "The password needs at least 10 characters.",
  ],
  "common.error.passwordTooLong": ["Mật khẩu quá dài.", "The password is too long."],
  "common.error.emailInvalid": ["Email không hợp lệ.", "That email address is not valid."],
  "common.error.displayNameTooShort": [
    "Tên hiển thị cần ít nhất 2 ký tự.",
    "The display name needs at least 2 characters.",
  ],
  "common.error.bioTooLong": ["Giới thiệu tối đa 280 ký tự.", "The bio holds at most 280 characters."],
  "common.error.goalTooSmall": ["Mục tiêu cần ít nhất 1 giây.", "The goal needs to be at least 1 second."],
  "common.error.goalTooLarge": ["Mục tiêu tối đa 60 phút.", "The goal holds at most 60 minutes."],
  "common.error.roomNameTooShort": [
    "Tên phòng cần ít nhất 2 ký tự.",
    "The room name needs at least 2 characters.",
  ],
  "common.error.messageEmpty": ["Tin nhắn không được để trống.", "The message cannot be empty."],
  "common.error.messageTooLong": ["Tin nhắn tối đa 500 ký tự.", "The message holds at most 500 characters."],
  "common.error.removalReasonTooShort": [
    "Hãy nêu lý do loại người xem (ít nhất 3 ký tự).",
    "Give a reason for removing the spectator (at least 3 characters).",
  ],
  "common.error.removalReasonTooLong": ["Lý do tối đa 280 ký tự.", "The reason holds at most 280 characters."],
  "common.error.dateFormat": ["Ngày phải theo YYYY-MM-DD.", "The date must use the YYYY-MM-DD format."],
  "common.error.dateRange": [
    "Ngày kết thúc phải sau ngày bắt đầu.",
    "The end date must come after the start date.",
  ],
  "common.error.solveTooFast": [
    "Thời gian giải quá ngắn để có thể thật.",
    "The solve time is too short to be genuine.",
  ],
  "common.error.solveTooShort": [
    "Thời gian giải không thể ngắn hơn thời gian quan sát.",
    "The solve time cannot be shorter than the inspection time.",
  ],
};
