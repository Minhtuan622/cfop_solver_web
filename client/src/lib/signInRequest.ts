/**
 * Mở hộp đăng nhập CFOP từ bất kỳ trang nào. Hộp đăng nhập nằm trong menu tài
 * khoản trên thanh điều hướng; trang chỉ phát sự kiện, menu lắng nghe và mở.
 */
export const SIGN_IN_EVENT = "cfop:open-sign-in";

export function requestSignIn() {
  window.dispatchEvent(new Event(SIGN_IN_EVENT));
}
