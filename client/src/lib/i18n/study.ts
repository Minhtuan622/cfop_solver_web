import type { Dictionary } from "./index";

/** The study lane: Last Layer SRS drills and the 3-Style BLD learning path. */
export const studyWords: Dictionary = {
  "study.eyebrow": ["Học tập", "Study"],
  "study.title": ["Học thêm", "Study"],
  "study.description.lastLayer": [
    "Ôn Last Layer theo case, giữ nhịp SRS và luyện đúng phần còn yếu.",
    "Review Last Layer case by case, keep an SRS rhythm, and practise what is weakest.",
  ],
  "study.description.bld": [
    "Luyện toàn bộ công thức 3-Style (cạnh, góc, đặc biệt) theo SRS.",
    "Drill every 3-Style algorithm — edge, corner and special cases — with SRS.",
  ],
  "study.description.twoByTwo": [
    "Luyện 2×2 CLL và PBL theo SRS: tính giờ từng case và để hàng đợi tự chọn phần yếu nhất.",
    "Practise 2×2 CLL and PBL with SRS: time each case and let the queue pick what is weakest.",
  ],
  "study.description.cfop": [
    "Luyện F2L, OLL và PLL theo SRS: tính giờ từng case và để hàng đợi tự chọn phần yếu nhất.",
    "Practise F2L, OLL and PLL with SRS: time each case and let the queue pick what is weakest.",
  ],

  "study.laneLabel": ["Loại luyện tập", "Practice type"],
  "study.laneLastLayer": ["Last Layer", "Last Layer"],
  "study.laneBld": ["3-Style BLD", "3-Style BLD"],
  "study.laneCfop": ["CFOP", "CFOP"],
  "study.laneTwoByTwo": ["2×2", "2×2"],

  "cfop.laneSummary": [
    "F2L {f2l} (41 × 4 hướng) · OLL {oll} · PLL {pll} case",
    "F2L {f2l} (41 × 4-way) · OLL {oll} · PLL {pll} cases",
  ],
  "cfop.catalogTitle": ["Danh mục CFOP 3×3", "CFOP 3×3 catalog"],
  "cfop.catalogHint": [
    "{count} case hiển thị · bấm vào case để luyện",
    "{count} cases shown · click a case to practise",
  ],
  "cfop.catalogLabel": ["Danh mục công thức CFOP", "CFOP algorithm catalog"],
  "cfop.searchPlaceholder": ["Tìm case hoặc alg…", "Search case or alg…"],
  "cfop.filterLabel": ["Lọc theo nhóm", "Filter by group"],
  "cfop.filterAll": ["Tất cả", "All"],
  "cfop.showMore": ["Hiển thị thêm {count} case", "Show {count} more cases"],
  "cfop.emptyCases": ["Không tìm thấy case nào.", "No cases found."],

  "twoByTwo.caseLabel": ["Case 2×2 đang học", "Active 2×2 case"],
  "twoByTwo.loading3d": ["Đang tải 3D…", "Loading 3D…"],
  "twoByTwo.setLabel": ["Bộ thuật toán 2×2", "2×2 algorithm set"],
  "twoByTwo.setCll": ["CLL · {count}", "CLL · {count}"],
  "twoByTwo.setPbl": ["PBL · {count}", "PBL · {count}"],
  "twoByTwo.laneSummaryCll": [
    "{count} CLL case (Antisune · H · L · Pi · Sune · T · U)",
    "{count} CLL cases (Antisune · H · L · Pi · Sune · T · U)",
  ],
  "twoByTwo.laneSummaryPbl": [
    "{count} PBL case (Adj · Diag)",
    "{count} PBL cases (Adj · Diag)",
  ],
  "twoByTwo.catalogTitle": ["Danh mục 2×2", "2×2 catalog"],
  "twoByTwo.catalogHint": [
    "{count} case hiển thị · bấm vào case để luyện",
    "{count} cases shown · click a case to practise",
  ],
  "twoByTwo.catalogLabel": ["Danh mục công thức 2×2", "2×2 algorithm catalog"],
  "twoByTwo.searchPlaceholder": ["Tìm case hoặc alg…", "Search case or alg…"],
  "twoByTwo.filterLabel": ["Lọc theo nhóm", "Filter by subset"],
  "twoByTwo.emptyCases": ["Không tìm thấy case nào.", "No cases found."],

  "study.goalLabel": ["Mục tiêu hôm nay", "Today's goal"],
  "study.goalProgress": ["Tiến độ mục tiêu hôm nay", "Today's goal progress"],
  "study.reviewedUnit": ["case đã ôn", "cases reviewed"],
  "study.goalHint": [
    "{count} case trong hàng đợi ưu tiên · chỉnh mục tiêu trong Cài đặt",
    "{count} priority cases in queue · change the goal in Settings",
  ],

  "study.importProgress": ["Nhập tiến độ", "Import progress"],
  "study.exportBackup": ["Xuất backup", "Export backup"],
  "study.importErrorTitle": [
    "Không thể nhập tiến độ",
    "Could not import progress",
  ],
  "study.importError": [
    "Không thể đọc backup tiến độ này.",
    "This study backup could not be read.",
  ],

  "study.statToday": ["Hôm nay", "Today"],
  "study.statQueue": ["Hàng đợi", "Queue"],
  "study.statCatalog": ["Catalog", "Catalog"],
  "study.statMastered": ["Đã thuộc", "Mastered"],
  "study.statReviews": ["lượt đã ôn", "reviews completed"],
  "study.statPriority": ["case ưu tiên", "priority cases"],
  "study.statCases": ["case Last Layer", "Last Layer cases"],
  "study.statMasteredUnit": ["case đã thuộc", "cases mastered"],

  "study.queueLabel": ["Hàng đợi ưu tiên", "Priority queue"],
  "study.caseLabel": ["Case đang học", "Active study case"],
  "study.scheduleLabel": ["Lịch ôn", "Review plan"],
  "study.chooseNext": ["Chọn case tiếp theo", "Choose next case"],
  "study.weakest": ["Ôn case yếu nhất", "Review weakest case"],
  "study.weakCases": ["Case yếu cần ưu tiên", "Weak cases to prioritize"],
  "study.next7Days": ["7 ngày tới", "Next 7 days"],
  "study.due": ["cần ôn", "due"],
  "study.goalComplete": ["Hoàn thành mục tiêu hôm nay", "Daily goal complete"],
  "study.dismiss": ["Đóng thông báo", "Dismiss notification"],

  "study.viewLabel": ["Chế độ xem cube", "Cube view"],
  "study.viewRecallTime": [
    "Xem, nhớ, rồi bấm giờ",
    "View, recall, then time it",
  ],
  "study.showAlgorithm": ["Xem công thức", "Show algorithm"],
  "study.hideAlgorithm": ["Ẩn công thức", "Hide algorithm"],
  "study.markMastered": ["Đánh dấu đã thuộc", "Mark mastered"],
  "study.unmarkMastered": ["Bỏ đánh dấu", "Unmark mastered"],
  "study.mastered": ["Đã thuộc", "Mastered"],
  "study.learning": ["Đang học", "Learning"],

  "study.recallTitle": ["Luyện nhớ", "Recall drill"],
  "study.timeThisCase": ["Bấm giờ case này", "Time this case"],
  "study.recallHint": [
    "Dừng timer rồi tự chấm mức nhớ để SRS lên lịch lần gặp lại.",
    "Stop the timer, then grade your recall so SRS can schedule the next review.",
  ],
  "study.stopToGrade": [
    "Dừng timer để tự đánh giá",
    "Stop timer to self-grade",
  ],
  "study.result": ["Kết quả", "Result"],
  "study.gradeAgain": ["Quên", "Again"],
  "study.gradeHard": ["Khó", "Hard"],
  "study.gradeGood": ["Nhớ", "Good"],
  "study.gradeEasy": ["Dễ", "Easy"],

  "study.noCasesTitle": ["Chưa có case phù hợp", "No matching cases"],
  "study.noCasesHint": [
    "Thử chọn một family để tiếp tục học.",
    "Choose a family to continue studying.",
  ],
  "study.familyLabel": ["Chọn family học", "Choose study family"],
  "study.loadingCases": ["Đang nạp case…", "Loading cases…"],
  "study.loadingCatalog": ["Đang nạp catalog…", "Loading catalog…"],
  "study.emptyCases": ["Hết case", "No cases"],

  "study.catalogTitle": ["Last Layer · Catalog", "Last Layer · Catalog"],
  "study.catalogHint": ["Tra cứu & chọn case", "Browse & select cases"],
  "study.catalogSummary": [
    "{cases} case trong {groups} nhóm",
    "{cases} cases in {groups} groups",
  ],
  "study.familySelect": ["Loại case", "Case family"],
  "study.groupSelect": ["Nhóm case", "Case group"],
  "study.allGroups": ["Tất cả nhóm", "All groups"],
  "study.searchCases": ["Tìm case", "Search cases"],
  "study.searchPlaceholder": [
    "Tìm ID, nhóm, công thức",
    "Search ID, group, algorithm",
  ],
  "study.allCases": ["Tất cả case", "All cases"],
  "study.unmasteredOnly": ["Chỉ chưa thuộc", "Unmastered"],
  "study.unmasteredCount": ["chưa thuộc", "unmastered"],
  "study.randomPractice": ["Luyện ngẫu nhiên", "Random practice"],
  "study.collapseCases": ["Thu gọn danh sách case", "Collapse case cards"],
  "study.openCases": ["Mở để xem từng case", "Open to view each case"],
  "study.studyThisCase": ["Học case này", "Study this case"],
  "study.noCasesMatch": [
    "Không có case phù hợp bộ lọc.",
    "No cases match this filter.",
  ],
  "study.previewTitle": ["Xem trước", "Preview"],
  "study.previewOf": ["Xem trước {label}", "Preview {label}"],
  "study.enlargePreview": [
    "Phóng to preview {label}",
    "Enlarge preview {label}",
  ],
  "study.previewFace": ["{label}: mặt U 3×3", "{label}: 3×3 U face"],
  "study.previewHint": [
    "Đây là mặt U đại diện của case.",
    "This shows the representative U face of the case.",
  ],
  "study.previewHint2x2": [
    "Đây là lưới net đại diện của case 2×2.",
    "This shows the representative net of the 2×2 case.",
  ],
  "study.previewHintCase": [
    "Đây là net đại diện của case.",
    "This shows the representative net of the case.",
  ],
  "study.bldCatalogTitle": ["Danh mục 3-Style", "3-Style library"],
  "study.bldLaneSummary": [
    "{edge} cạnh · {corner} góc · {special} case đặc biệt",
    "{edge} edge · {corner} corner · {special} special cases",
  ],
  "study.bldFilterAll": ["Tất cả · Cạnh + Góc + Đặc biệt", "All · Edge + Corner + Special"],
  "study.bldFilterEdge": ["Cạnh", "Edges"],
  "study.bldFilterCorner": ["Góc", "Corners"],
  "study.bldFilterSpecial": ["Đặc biệt", "Special"],
  "study.closePreview": ["Đóng preview", "Close preview"],
  "study.close": ["Đóng", "Close"],

  "study.bulkSelect": ["Chọn nhiều", "Select multiple"],
  "study.bulkSelected": [
    "Đã chọn {count}/{total}",
    "{count} of {total} selected",
  ],
  "study.bulkSelectAll": ["Chọn tất cả", "Select all"],
  "study.bulkClear": ["Bỏ chọn", "Clear selection"],
  "study.bulkMark": [
    "Đánh dấu đã thuộc ({count})",
    "Mark as learned ({count})",
  ],
  "study.bulkUnmark": ["Bỏ đánh dấu ({count})", "Unmark ({count})"],
  "study.bulkDone": ["Xong", "Done"],
};
