import type { Dictionary } from "./index";

/** Navigation, footer, theme switcher, account menu and the fallback pages. */
export const shellWords: Dictionary = {
  "nav.brand": ["Giải Rubik", "Rubik Solver"],
  "nav.brandLabel": ["Giải Rubik — Trang chủ", "Rubik Solver — Home"],
  "nav.toggle": ["Mở điều hướng", "Toggle navigation"],
  "nav.main": ["Điều hướng chính", "Main navigation"],
  "nav.solve": ["Giải", "Solve"],
  "nav.timer": ["Bấm giờ", "Timer"],
  "nav.history": ["Kết quả", "History"],
  "nav.study": ["Học thêm", "Study"],
  "nav.rooms": ["Thi đấu", "Rooms"],
  "nav.rankings": ["Xếp hạng", "Rankings"],
  "nav.wca": ["Giải WCA", "WCA"],
  "nav.settings": ["Cài đặt", "Settings"],
  "nav.more": ["Thêm", "More"],
  "nav.moreLabel": ["Các mục khác", "More pages"],
  "nav.skip": ["Bỏ qua điều hướng", "Skip to navigation"],

  "footer.tagline": [
    "Giải Rubik 3x3, bấm giờ và luyện tập — miễn phí, dễ dùng cho người mới.",
    "Solve 3x3 cubes, time your solves and practise — free and beginner friendly.",
  ],
  "footer.links": ["Liên kết nhanh", "Quick links"],

  "theme.change": ["Đổi giao diện sáng tối", "Change the light and dark theme"],
  "theme.label": ["Giao diện", "Theme"],
  "theme.light": ["Sáng", "Light"],
  "theme.dark": ["Tối", "Dark"],
  "theme.system": ["Hệ thống", "System"],

  "account.signIn": ["Đăng nhập", "Sign in"],
  "account.register": ["Đăng ký", "Create account"],
  "account.profile": ["Hồ sơ", "Profile"],
  "account.logout": ["Đăng xuất", "Sign out"],
  "account.avatarAlt": ["Ảnh đại diện của {name}", "Avatar of {name}"],
  "account.initialsLabel": ["Chữ cái đầu của {name}", "Initials of {name}"],
  "account.dialog.loginTitle": ["Đăng nhập CFOP Solver", "Sign in to CFOP Solver"],
  "account.dialog.registerTitle": ["Tạo tài khoản CFOP Solver", "Create a CFOP Solver account"],
  "account.dialog.description": [
    "Tài khoản này riêng cho CFOP Solver Studio, không liên quan đến tài khoản Manus.",
    "This account belongs to CFOP Solver Studio only and is unrelated to Manus accounts.",
  ],
  "account.dialog.actionLabel": ["Chọn thao tác tài khoản", "Choose an account action"],
  "account.dialog.displayName": ["Tên hiển thị", "Display name"],
  "account.dialog.email": ["Email", "Email"],
  "account.dialog.password": ["Mật khẩu", "Password"],
  "account.dialog.passwordHint": [
    "Dùng ít nhất 10 ký tự. Mật khẩu được băm trên server; ứng dụng không lưu mật khẩu dạng chữ thường.",
    "Use at least 10 characters. The password is hashed on the server; the app never stores it in plain text.",
  ],
  "account.dialog.cancel": ["Hủy", "Cancel"],
  "account.dialog.pending": ["Đang xử lý…", "Working…"],
  "account.dialog.close": ["Đóng", "Close"],
  "account.dialog.createAccount": ["Tạo tài khoản", "Create account"],
  "account.error.emailTaken": [
    "Email này đã có tài khoản CFOP.",
    "This email already has a CFOP account.",
  ],
  "account.error.invalidCredentials": [
    "Email hoặc mật khẩu không đúng.",
    "The email or the password is wrong.",
  ],
  "account.error.rateLimited": [
    "Bạn đã thử quá nhiều lần. Vui lòng thử lại sau.",
    "Too many attempts. Please try again later.",
  ],
  "account.error.invalidInput": [
    "Thông tin bạn nhập chưa hợp lệ. Vui lòng kiểm tra lại.",
    "Some of the details you entered are not valid. Please check them again.",
  ],
  "account.error.resetLinkInvalid": [
    "Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.",
    "That password reset link is invalid or has expired.",
  ],
  "account.error.required": [
    "Bạn cần đăng nhập để thực hiện việc này.",
    "You need to sign in to do this.",
  ],

  "language.change": ["Đổi ngôn ngữ", "Change the language"],
  "language.label": ["Ngôn ngữ", "Language"],
  "language.vietnamese": ["Tiếng Việt", "Vietnamese"],
  "language.english": ["Tiếng Anh", "English"],

  "notFound.title": ["Không tìm thấy trang", "Page Not Found"],
  "notFound.detail": [
    "Rất tiếc, trang bạn tìm không tồn tại. Có thể nó đã được chuyển hoặc xóa.",
    "Sorry, the page you are looking for does not exist. It may have been moved or deleted.",
  ],
  "notFound.home": ["Về trang chủ", "Go home"],

  "error.title": ["Đã xảy ra lỗi không mong muốn.", "An unexpected error occurred."],
  "error.detail": ["Tải lại trang để khôi phục ứng dụng.", "Reload the page to restore the application."],
  "error.reload": ["Tải lại trang", "Reload page"],
};
