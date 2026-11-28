export const REPOSITORY_URL = "https://github.com/Minhtuan622/cfop_solver_web";
export const ISSUES_URL = `${REPOSITORY_URL}/issues`;

export type DonateLink = { id: string; label: string; href: string };

// Kênh nhận ủng hộ tiền. Để trống cho tới khi chủ dự án có kênh thật; trang
// Ủng hộ chỉ hiện các mục có ở đây và tự báo "chưa có kênh" khi danh sách rỗng.
// Ví dụ: { id: "kofi", label: "Ko-fi", href: "https://ko-fi.com/<tên>" }
export const DONATE_LINKS: readonly DonateLink[] = [];

export type DonateQr = {
  id: string;
  /** Tên kênh hiện trên thẻ, ví dụ "Ngân hàng" hoặc "MoMo". */
  label: string;
  /** Dòng phụ: tên người nhận, ngân hàng hoặc ví. */
  note: string;
  /** Ảnh QR, đặt trong client/public/donate/ rồi ghi đường dẫn, ví dụ "/donate/bank.png". */
  image: string;
  /** Số tài khoản hoặc số ví; có thì hiện nút "Sao chép số tài khoản". */
  copyText?: string;
};

// Mã QR cá nhân để người dùng quét ủng hộ. Để trống cho tới khi có ảnh thật; trang
// Ủng hộ sẽ hiện ô "Chưa có ảnh QR" khi danh sách rỗng, và thanh chọn kênh khi có
// từ hai mục trở lên.
// Ví dụ: { id: "bank", label: "Ngân hàng", note: "Nguyễn Văn A · Vietcombank", image: "/donate/bank.png", copyText: "0123456789" }
export const DONATE_QR: readonly DonateQr[] = [];
