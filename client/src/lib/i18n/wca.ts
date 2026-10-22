import type { Dictionary } from "./index";

/** The WCA competition calendar page. */
export const wcaWords: Dictionary = {
  "wca.eyebrow": ["World Cube Association", "World Cube Association"],
  "wca.title": ["Lịch giải WCA", "WCA competition calendar"],
  "wca.description": [
    "Tìm các giải sắp diễn ra theo thời gian và quốc gia.",
    "Find the upcoming competitions by date and country.",
  ],
  "wca.openCalendar": ["Mở lịch WCA", "Open the WCA calendar"],
  "wca.filters": ["Bộ lọc lịch giải", "Calendar filters"],
  "wca.presets": ["Khoảng", "Period"],
  "wca.preset.30": ["30 ngày", "30 days"],
  "wca.preset.90": ["3 tháng", "3 months"],
  "wca.preset.365": ["1 năm", "1 year"],
  "wca.from": ["Từ ngày", "From"],
  "wca.to": ["Đến ngày", "To"],
  "wca.country": ["Quốc gia", "Country"],
  "wca.allCountries": ["Tất cả quốc gia", "All countries"],
  "wca.countriesLoading": ["Đang tải…", "Loading…"],
  "wca.search": ["Tìm giải", "Search"],
  "wca.searchPlaceholder": [
    "Tên giải, thành phố, địa điểm…",
    "Competition name, city, venue…",
  ],
  "wca.resultsCount": ["{count} giải", "{count} competitions"],
  "wca.resultsFiltered": [
    "{shown} trong {total} giải",
    "{shown} of {total} competitions",
  ],
  "wca.invalidRange": [
    "Ngày kết thúc cần sau hoặc bằng ngày bắt đầu.",
    "The end date must be on or after the start date.",
  ],
  "wca.invalidRangeHint": [
    "Hãy chọn lại khoảng thời gian ở phía trên.",
    "Pick another period above.",
  ],
  "wca.refreshing": ["Đang cập nhật lịch giải WCA", "Updating the WCA calendar"],
  "wca.loading": ["Đang tải lịch giải WCA", "Loading the WCA calendar"],
  "wca.loadFailed": ["Không thể tải dữ liệu WCA. Hãy thử lại.", "Could not load the WCA data. Please try again."],
  "wca.empty": [
    "Chưa có giải WCA phù hợp trong khoảng thời gian này.",
    "No WCA competition matches this period yet.",
  ],
  "wca.emptyHint": [
    "Hãy thử một khoảng thời gian dài hơn hoặc bỏ bộ lọc quốc gia.",
    "Try a longer period or drop the country filter.",
  ],
  "wca.searchEmpty": [
    "Không tìm thấy giải nào khớp với từ khoá.",
    "No competition matches that keyword.",
  ],
  "wca.clearSearch": ["Xoá tìm kiếm", "Clear the search"],
  "wca.listLabel": ["Danh sách giải WCA", "WCA competition list"],
  "wca.status.approved": ["Đã duyệt", "Approved"],
  "wca.status.cancelled": ["Đã hủy", "Cancelled"],
  "wca.locationUnknown": ["Địa điểm đang cập nhật", "Venue to be announced"],
  "wca.competitionPage": ["Trang giải WCA", "WCA competition page"],
  "wca.website": ["Website giải", "Competition website"],
  "wca.footer": [
    "Lịch lấy từ World Cube Association. Hãy kiểm tra trang giải WCA trước khi đăng ký vì lịch và điều kiện có thể thay đổi.",
    "The calendar comes from the World Cube Association. Check the competition page before registering, because the schedule and the conditions can change.",
  ],

  "wca.errorData": [
    "Không thể xử lý dữ liệu WCA.",
    "The WCA data could not be processed.",
  ],
  "wca.errorNotFound": [
    "Không tìm thấy WCA ID hoặc dữ liệu WCA.",
    "That WCA ID or the WCA data was not found.",
  ],
  "wca.errorUnavailable": [
    "WCA hiện chưa phản hồi dữ liệu. Hãy thử lại sau.",
    "WCA is not answering with data right now. Please try again later.",
  ],
  "wca.errorUnreachable": [
    "Không thể kết nối WCA lúc này. Hãy thử lại sau.",
    "WCA cannot be reached right now. Please try again later.",
  ],
  "wca.errorIdFormat": [
    "WCA ID cần theo dạng 2016ABCD01.",
    "A WCA ID has to look like 2016ABCD01.",
  ],
  "wca.errorProfileMissing": [
    "Không tìm thấy hồ sơ WCA này.",
    "This WCA profile was not found.",
  ],
  "wca.errorOAuthInvalidId": [
    "WCA không trả về WCA ID hợp lệ.",
    "WCA did not return a valid WCA ID.",
  ],
  "wca.errorOAuthNotConfigured": [
    "WCA OAuth chưa được cấu hình trên máy chủ.",
    "WCA OAuth is not configured on the server yet.",
  ],
  "wca.errorOAuthInvalidState": [
    "Liên kết WCA đã hết hạn hoặc không hợp lệ.",
    "The WCA link has expired or is not valid.",
  ],
  "wca.errorOAuthAccountMismatch": [
    "Phiên tài khoản CFOP không khớp với yêu cầu liên kết WCA.",
    "The CFOP account session does not match the WCA link request.",
  ],
  "wca.errorOAuthLinkFailed": [
    "Không thể xác minh tài khoản WCA. Hãy thử liên kết lại.",
    "The WCA account could not be verified. Please link it again.",
  ],
};
