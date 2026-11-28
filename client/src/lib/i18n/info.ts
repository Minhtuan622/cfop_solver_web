import type { Dictionary } from "./index";

export const infoWords: Dictionary = {
  "nav.info": ["Thông tin", "Info"],
  "nav.infoLabel": ["Giới thiệu và hỗ trợ", "About and support"],
  "nav.records": ["Kỷ lục WCA", "WCA records"],
  "nav.about": ["Về chúng tôi", "About us"],
  "nav.donate": ["Ủng hộ", "Donate"],
  "nav.guide": ["Hướng dẫn sử dụng", "User guide"],

  "about.title": ["Về chúng tôi", "About us"],
  "about.subtitle": [
    "CFOP Solver Studio là ứng dụng web mã nguồn mở để giải, luyện tập, bấm giờ và thi đấu Rubik.",
    "CFOP Solver Studio is an open-source web app for solving, practising, timing and competing at the Rubik's Cube.",
  ],
  "about.mission.title": ["Mục tiêu", "Our goal"],
  "about.mission.body": [
    "Giúp người mới hiểu lời giải CFOP từng bước, và giúp người đã thạo có chỗ luyện tập, theo dõi tiến bộ và thi đấu với nhau, tất cả trong một nơi, miễn phí.",
    "To help beginners understand a CFOP solution step by step, and give experienced cubers one place to practise, track progress and compete — free of charge.",
  ],
  "about.features.title": ["Bạn có thể làm gì", "What you can do"],
  "about.features.solve": [
    "Giải khối 3×3 theo CFOP với báo cáo từng phase, khối 2D/3D và phát lại từng nước.",
    "Solve a 3×3 with CFOP, with a report for every phase, 2D/3D cube and move-by-move replay.",
  ],
  "about.features.timer": [
    "Bấm giờ nhiều event với scramble chuẩn WCA, thống kê và lịch sử lượt giải.",
    "Time many events with WCA-style scrambles, statistics and a solve history.",
  ],
  "about.features.study": [
    "Học thuật toán (OLL, PLL, ZBLL, BLD…) với lịch ôn tập lặp lại ngắt quãng.",
    "Learn algorithms (OLL, PLL, ZBLL, BLD…) with a spaced-repetition review schedule.",
  ],
  "about.features.compete": [
    "Thi đấu trong phòng, xem bảng xếp hạng và lịch giải WCA.",
    "Compete in rooms, follow the rankings and the WCA competition calendar.",
  ],
  "about.tech.title": ["Công nghệ", "Technology"],
  "about.tech.body": [
    "Bộ giải viết bằng Rust, biên dịch ra WebAssembly và chạy ngay trong trình duyệt của bạn, nên vẫn dùng được khi offline sau lần tải đầu. Dữ liệu cá nhân nằm trên máy bạn trừ khi bạn đăng nhập để đồng bộ.",
    "The solver is written in Rust, compiled to WebAssembly and runs in your own browser, so it keeps working offline after the first load. Your data stays on your device unless you sign in to sync it.",
  ],
  "about.open.title": ["Mã nguồn mở", "Open source"],
  "about.open.body": [
    "Dự án phát hành theo giấy phép MIT. Bạn có thể xem mã nguồn, báo lỗi, đề xuất tính năng hoặc đóng góp trực tiếp trên GitHub.",
    "The project is released under the MIT license. You can read the source, report bugs, suggest features or contribute directly on GitHub.",
  ],
  "about.open.link": ["Mở trên GitHub", "Open on GitHub"],

  "donate.title": ["Ủng hộ dự án", "Support the project"],
  "donate.subtitle": [
    "Ứng dụng miễn phí và không có quảng cáo. Mọi sự hỗ trợ, dù bằng tiền hay bằng công sức, đều giúp dự án đi tiếp.",
    "The app is free and has no ads. Every bit of support, in money or in effort, helps the project keep going.",
  ],
  "donate.money.title": ["Ủng hộ bằng tiền", "Donate money"],
  "donate.money.body": [
    "Khoản ủng hộ giúp chi trả máy chủ, tên miền và thời gian phát triển.",
    "Donations help pay for servers, the domain name and development time.",
  ],
  "donate.money.none": [
    "Hiện chưa có kênh nhận ủng hộ tiền. Khi có, các liên kết sẽ xuất hiện ở đây.",
    "There is no way to donate money yet. Links will appear here once there is.",
  ],
  "donate.free.title": ["Cách ủng hộ khác (miễn phí)", "Other ways to help (free)"],
  "donate.free.star": [
    "Tặng một sao cho kho mã nguồn trên GitHub.",
    "Give the repository a star on GitHub.",
  ],
  "donate.free.share": [
    "Chia sẻ ứng dụng cho bạn bè cùng chơi Rubik.",
    "Share the app with friends who cube.",
  ],
  "donate.free.report": [
    "Báo lỗi hoặc góp ý tính năng qua GitHub Issues.",
    "Report bugs or suggest features through GitHub Issues.",
  ],
  "donate.free.contribute": [
    "Đóng góp mã nguồn, bản dịch hoặc tài liệu.",
    "Contribute code, translations or documentation.",
  ],
  "donate.github": ["Mở GitHub", "Open GitHub"],
  "donate.thanks": ["Cảm ơn bạn đã đồng hành!", "Thank you for being with us!"],

  "guide.title": ["Hướng dẫn sử dụng", "User guide"],
  "guide.subtitle": [
    "Tóm tắt cách dùng từng trang. Bấm “Mở trang” để đi thẳng tới trang đó.",
    "A short tour of every page. Press “Open page” to jump straight to it.",
  ],
  "guide.open": ["Mở trang", "Open page"],
  "guide.solve.title": ["Giải khối", "Solve"],
  "guide.solve.body": [
    "Nhập scramble hoặc tô trạng thái sáu mặt (gõ tay hoặc quét bằng camera), chọn opening (Cross, XCross… hoặc Tự động) rồi bấm giải. Xem lời giải theo từng phase, trên khối 2D/3D và phát lại từng nước.",
    "Enter a scramble or colour all six faces (by hand or by camera), choose an opening (Cross, XCross… or Auto) and press solve. Read the solution phase by phase, on the 2D/3D cube, and replay it move by move.",
  ],
  "guide.timer.title": ["Bấm giờ", "Timer"],
  "guide.timer.body": [
    "Chọn event, làm theo scramble hiển thị rồi bấm giờ. Có inspection, +2/DNF, chế độ tập trung và hỗ trợ Smart Cube hoặc GAN Timer qua Bluetooth.",
    "Pick an event, follow the scramble shown, then start the timer. It has inspection, +2/DNF, a focus mode and support for Smart Cubes or GAN Timers over Bluetooth.",
  ],
  "guide.history.title": ["Kết quả", "History"],
  "guide.history.body": [
    "Xem lịch sử lượt giải, các chỉ số như PB, Ao5, Ao12 và biểu đồ xu hướng. Lọc theo event, nhập từ csTimer hoặc xuất JSON/CSV.",
    "Browse past solves, stats such as PB, Ao5 and Ao12, and the trend chart. Filter by event, import from csTimer or export JSON/CSV.",
  ],
  "guide.study.title": ["Học thêm", "Study"],
  "guide.study.body": [
    "Học các bộ thuật toán (OLL, PLL, ZBLL, 3-Style BLD và các khối khác). Hệ thống lên lịch ôn 7 ngày và theo dõi mục tiêu mỗi ngày.",
    "Learn algorithm sets (OLL, PLL, ZBLL, 3-Style BLD and other puzzles). A 7-day review schedule and a daily goal keep you on track.",
  ],
  "guide.play.title": ["Rubik ảo", "Virtual cube"],
  "guide.play.body": [
    "Xoay khối 3×3 bằng bàn phím hoặc nút trên màn hình, chơi tự do hoặc giải có tính giờ.",
    "Turn a 3×3 with the keyboard or on-screen buttons, in free play or against the clock.",
  ],
  "guide.rooms.title": ["Thi đấu", "Rooms"],
  "guide.rooms.body": [
    "Tạo hoặc vào phòng thi đấu bằng mã phòng để giải cùng bạn bè. Cần đăng nhập tài khoản.",
    "Create or join a room with a room code to solve together with friends. Signing in is required.",
  ],
  "guide.rankings.title": ["Xếp hạng", "Rankings"],
  "guide.rankings.body": [
    "Xem bảng xếp hạng theo tuần và tháng, và mở hồ sơ của từng người chơi.",
    "See the weekly and monthly leaderboards and open each player's profile.",
  ],
  "guide.wca.title": ["Giải WCA", "WCA"],
  "guide.wca.body": [
    "Theo dõi lịch các giải WCA và kỷ lục thế giới. Trang Kỷ lục WCA có kỷ lục thế giới, châu lục, quốc gia và các kỷ lục vừa bị phá. Tab \"Giải của tôi\" liệt kê giải bạn đã, đang và sẽ tham gia (cần liên kết WCA ID trong hồ sơ), kèm lịch thi, môn đăng ký và kết quả. Tab \"Giải gần bạn\" liệt kê giải sắp tới theo quốc gia (có thể xếp theo khoảng cách). Tab \"Tìm kiếm\" mở hồ sơ người thi và trang giải, nơi có kết quả từng vòng, psych sheet và lịch thi. Tab \"Delegate & đội ngũ\" liệt kê delegate WCA và phiên bản TNoodle hiện hành.",
    "Follow the WCA competition calendar and world records. The WCA records page has world, continental and national records plus the ones broken most recently. The \"My competitions\" tab lists the competitions you attended, are attending and will attend (link your WCA ID in your profile), with the schedule, registered events and results. \"Near you\" lists upcoming competitions by country (sortable by distance). \"Search\" opens competitor profiles and competition pages with round-by-round results, psych sheets and schedules. \"Delegates & teams\" lists WCA delegates and the current TNoodle version.",
  ],
  "guide.settings.title": ["Cài đặt", "Settings"],
  "guide.settings.body": [
    "Đổi ngôn ngữ, giao diện sáng/tối và màu sắc, độ sâu tìm kiếm của bộ giải, tuỳ chọn bấm giờ và mục tiêu học. Mọi thay đổi được lưu tự động.",
    "Change the language, light/dark theme and colours, the solver search depth, timer options and study goals. Changes save automatically.",
  ],
  "guide.account.title": ["Tài khoản và đồng bộ", "Account and sync"],
  "guide.account.body": [
    "Bạn dùng được phần lớn ứng dụng mà không cần tài khoản. Đăng nhập (biểu tượng người ở góc phải thanh điều hướng) để đồng bộ dữ liệu giữa các thiết bị, vào phòng thi đấu và lên bảng xếp hạng.",
    "You can use most of the app without an account. Sign in (the person icon at the right of the navbar) to sync data between devices, join rooms and appear in the rankings.",
  ],
};
