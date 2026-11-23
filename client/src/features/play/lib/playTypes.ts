/** Chế độ của trang Chơi: tự do hoặc đua (đồng hồ + lịch sử riêng). */
export type PlayMode = "free" | "race";
/** Trạng thái một lượt đua: chờ, đang inspection, sẵn sàng (không inspection), đang giải. */
export type RaceStatus = "idle" | "inspection" | "armed" | "solving";
