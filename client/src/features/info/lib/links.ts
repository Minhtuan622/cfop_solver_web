export const REPOSITORY_URL = "https://github.com/Minhtuan622/cfop_solver_web";
export const ISSUES_URL = `${REPOSITORY_URL}/issues`;

export type DonateLink = { id: string; label: string; href: string };

// Kênh nhận ủng hộ tiền. Để trống cho tới khi chủ dự án có kênh thật; trang
// Ủng hộ chỉ hiện các mục có ở đây và tự báo "chưa có kênh" khi danh sách rỗng.
// Ví dụ: { id: "kofi", label: "Ko-fi", href: "https://ko-fi.com/<tên>" }
export const DONATE_LINKS: readonly DonateLink[] = [];
