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
    "Luyện 2×2 CLL, PBL, EG-1 và EG-2 theo SRS: tính giờ từng case và để hàng đợi tự chọn phần yếu nhất.",
    "Practise 2×2 CLL, PBL, EG-1 and EG-2 with SRS: time each case and let the queue pick what is weakest.",
  ],
  "study.description.cfop": [
    "Luyện F2L, OLL, PLL, COLL và OLLCP theo SRS: tính giờ từng case và để hàng đợi tự chọn phần yếu nhất.",
    "Practise F2L, OLL, PLL, COLL and OLLCP with SRS: time each case and let the queue pick what is weakest.",
  ],
  "study.description.pyraminx": [
    "Luyện Pyraminx Last Layer và L4E theo SRS: tính giờ từng case và để hàng đợi tự chọn phần yếu nhất.",
    "Practise Pyraminx Last Layer and L4E with SRS: time each case and let the queue pick what is weakest.",
  ],
  "study.description.skewb": [
    "Luyện Skewb bằng phương pháp Sarah (Intermediate và Advanced) theo SRS: tính giờ từng case và để hàng đợi tự chọn phần yếu nhất.",
    "Practise Skewb with the Sarah method (Intermediate and Advanced) with SRS: time each case and let the queue pick what is weakest.",
  ],
  "study.description.sq1": [
    "Luyện Square-1 (CP, CS, CSP, EO, EP, OBL) theo SRS: tính giờ từng case và để hàng đợi tự chọn phần yếu nhất.",
    "Practise Square-1 (CP, CS, CSP, EO, EP, OBL) with SRS: time each case and let the queue pick what is weakest.",
  ],
  "study.description.parity": [
    "Luyện 4×4 PLL Parity theo SRS: tính giờ từng case và để hàng đợi tự chọn phần yếu nhất.",
    "Practise 4×4 PLL parity with SRS: time each case and let the queue pick what is weakest.",
  ],

  "study.description.l2e": [
    "Luyện 5×5 Last Two Edges (15 case, cả parity và không parity) theo SRS.",
    "Practise 5×5 Last Two Edges (15 cases, parity and no-parity) with SRS.",
  ],
  "study.description.l3t": [
    "Luyện FTO 3-Look L3T (17 case theo bộ PF → TL → LT) theo SRS.",
    "Practise FTO 3-Look L3T (17 cases, PF → TL → LT) with SRS.",
  ],
  "study.laneLabel": ["Loại luyện tập", "Practice type"],
  "study.laneLastLayer": ["Last Layer", "Last Layer"],
  "study.laneBld": ["3-Style BLD", "3-Style BLD"],
  "study.laneCfop": ["CFOP", "CFOP"],
  "study.laneTwoByTwo": ["2×2", "2×2"],
  "study.lanePyraminx": ["Pyraminx", "Pyraminx"],
  "study.laneSkewb": ["Skewb", "Skewb"],
  "study.laneSq1": ["Square-1", "Square-1"],
  "study.laneParity": ["4×4 Parity", "4×4 Parity"],

  "study.laneL2E": ["5×5 L2E", "5×5 L2E"],
  "study.laneL3T": ["FTO L3T", "FTO L3T"],
  "cfop.laneSummary": [
    "F2L {f2l} (41 × 4 hướng) · OLL {oll} · PLL {pll} · COLL {coll} · OLLCP {ollcp} case",
    "F2L {f2l} (41 × 4-way) · OLL {oll} · PLL {pll} · COLL {coll} · OLLCP {ollcp} cases",
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
  "twoByTwo.setEg1": ["EG-1 · {count}", "EG-1 · {count}"],
  "twoByTwo.setEg2": ["EG-2 · {count}", "EG-2 · {count}"],
  "twoByTwo.laneSummaryCll": [
    "{count} CLL case (Antisune · H · L · Pi · Sune · T · U)",
    "{count} CLL cases (Antisune · H · L · Pi · Sune · T · U)",
  ],
  "twoByTwo.laneSummaryEg1": [
    "{count} EG-1 case (Antisune · H · L · Pi · Sune · T · U)",
    "{count} EG-1 cases (Antisune · H · L · Pi · Sune · T · U)",
  ],
  "twoByTwo.laneSummaryEg2": [
    "{count} EG-2 case (Antisune · H · L · Pi · Sune · T · U)",
    "{count} EG-2 cases (Antisune · H · L · Pi · Sune · T · U)",
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

  "pyraminx.caseLabel": ["Case Pyraminx đang học", "Active Pyraminx case"],
  "pyraminx.loading3d": ["Đang tải 3D…", "Loading 3D…"],
  "pyraminx.setLabel": ["Bộ thuật toán Pyraminx", "Pyraminx algorithm set"],
  "pyraminx.setLl": ["Last Layer · {count}", "Last Layer · {count}"],
  "pyraminx.setL4e": ["L4E · {count}", "L4E · {count}"],
  "pyraminx.laneSummaryLl": [
    "{count} Last Layer case (down edge solved)",
    "{count} Last Layer cases (down edge solved)",
  ],
  "pyraminx.laneSummaryL4e": [
    "{count} L4E case (DES · DEF · UES · UEF · NP)",
    "{count} L4E cases (DES · DEF · UES · UEF · NP)",
  ],
  "pyraminx.catalogTitle": ["Danh mục Pyraminx", "Pyraminx catalog"],

  "skewb.caseLabel": ["Case Skewb đang học", "Active Skewb case"],
  "skewb.loading3d": ["Đang tải 3D…", "Loading 3D…"],
  "skewb.setLabel": ["Bộ thuật toán Skewb", "Skewb algorithm set"],
  "skewb.setSarahIntermediate": [
    "Sarah Int · {count}",
    "Sarah Int · {count}",
  ],
  "skewb.setSarahAdvanced": [
    "Sarah Adv · {count}",
    "Sarah Adv · {count}",
  ],
  "skewb.laneSummarySarahIntermediate": [
    "{count} Sarah Intermediate trigger (1T · 2T · 3T)",
    "{count} Sarah Intermediate triggers (1T · 2T · 3T)",
  ],
  "skewb.laneSummarySarahAdvanced": [
    "{count} Sarah Advanced case (16 nhóm)",
    "{count} Sarah Advanced cases (16 subsets)",
  ],
  "skewb.catalogTitle": ["Danh mục Skewb", "Skewb catalog"],

  "sq1.caseLabel": ["Case Square-1 đang học", "Active Square-1 case"],
  "sq1.loading2d": ["Đang tải 2D…", "Loading 2D…"],
  "sq1.setLabel": ["Bộ thuật toán Square-1", "Square-1 algorithm set"],
  "sq1.setCp": ["CP · {count}", "CP · {count}"],
  "sq1.setCs": ["CS · {count}", "CS · {count}"],
  "sq1.setCsp": ["CSP · {count}", "CSP · {count}"],
  "sq1.setEo": ["EO · {count}", "EO · {count}"],
  "sq1.setEp": ["EP · {count}", "EP · {count}"],
  "sq1.setObl": ["OBL · {count}", "OBL · {count}"],
  "sq1.laneSummaryCp": [
    "{count} CP case (Top Adj · Top Opp · Top Solved)",
    "{count} CP cases (Top Adj · Top Opp · Top Solved)",
  ],
  "sq1.laneSummaryCs": [
    "{count} Cube Shape case (1–7 Slashes)",
    "{count} Cube Shape cases (1–7 Slashes)",
  ],
  "sq1.laneSummaryCsp": [
    "{count} CSP case (1–7 Slashes)",
    "{count} CSP cases (1–7 Slashes)",
  ],
  "sq1.laneSummaryEo": [
    "{count} EO case (edge orientation)",
    "{count} EO cases (edge orientation)",
  ],
  "sq1.laneSummaryEp": [
    "{count} EP case (edge permutation)",
    "{count} EP cases (edge permutation)",
  ],
  "sq1.laneSummaryObl": [
    "{count} OBL case (1–6 Slashes)",
    "{count} OBL cases (1–6 Slashes)",
  ],
  "sq1.catalogTitle": ["Danh mục Square-1", "Square-1 catalog"],

  "parity.caseLabel": ["Case 4×4 PLL Parity đang học", "Active 4×4 PLL parity case"],
  "parity.loading3d": ["Đang tải 3D…", "Loading 3D…"],
  "parity.laneSummary": [
    "{count} PLL Parity case (2 cạnh tầng cuối cần hoán đổi)",
    "{count} PLL parity cases (the two last-layer edges to swap)",
  ],
  "parity.catalogTitle": ["Danh mục 4×4 Parity", "4×4 parity catalog"],
  "l2e.caseLabel": ["Case 5×5 L2E đang học", "Active 5×5 L2E case"],
  "l2e.loading3d": ["Đang tải 3D…", "Loading 3D…"],
  "l2e.laneSummary": [
    "{count} case Last Two Edges (2 cạnh cuối chưa ghép)",
    "{count} Last Two Edges cases (the final two unpaired edges)",
  ],
  "l2e.catalogTitle": ["Danh mục 5×5 L2E", "5×5 L2E catalog"],
  "l3t.caseLabel": ["Case FTO L3T đang học", "Active FTO L3T case"],
  "l3t.loading3d": ["Đang tải 3D…", "Loading 3D…"],
  "l3t.laneSummary": [
    "{count} case 3-Look Last Three Triples của FTO (PF → TL → LT)",
    "{count} 3-Look L3T cases for FTO (PF → TL → LT)",
  ],
  "l3t.gripHint": [
    "Cách cầm khối theo sheet: yellow trên U, cạnh hướng về phía bạn (EIF).",
    "Hold as in the sheet: yellow on U, edge in front (EIF).",
  ],
  "l3t.catalogTitle": ["Danh mục FTO L3T", "FTO L3T catalog"],

  "study.goalLabel": ["Mục tiêu hôm nay", "Today's goal"],
  "study.inlineToday": ["hôm nay", "today"],
  "study.inlineQueue": ["hàng đợi", "in queue"],
  "study.inlineMastered": ["đã thuộc", "mastered"],
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
  "study.focusSet": ["Bộ tập trung", "Focus set"],
  "study.focusSetActive": ["Focus · {count} nhóm", "Focus · {count} groups"],
  "study.focusSetTitle": ["Chỉ luyện các nhóm này", "Focus only these groups"],
  "study.focusSetHint": [
    "Tick nhóm để thu hẹp danh mục; bỏ tick hết để xem tất cả.",
    "Tick groups to narrow the catalog; clear them all to see everything.",
  ],
  "study.focusSetClear": ["Bỏ hết focus", "Clear focus"],
  "study.collapseCases": ["Thu gọn danh sách case", "Collapse case cards"],
  "study.openCases": ["Mở để xem từng case", "Open to view each case"],
  "study.studyThisCase": ["Học case này", "Study this case"],
  "study.previewHintReplay": [
    "Mô phỏng 3D cách giải case theo công thức bên dưới (bấm Xem lại để chạy lại).",
    "3D replay of the case solution following the algorithm below (press Replay to run it again).",
  ],
  "study.replayAlgorithm": ["Xem lại", "Replay"],
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
  "study.previewFace": ["{label}: tầng 3 đầy đủ", "{label}: full last layer"],
  "study.previewHint": [
    "Đây là toàn bộ tầng 3 của case (mặt U + 4 hàng cạnh).",
    "This shows the full last layer of the case (U face and the four side rows).",
  ],
  "study.previewHint2x2": [
    "Đây là lưới net đại diện của case 2×2.",
    "This shows the representative net of the 2×2 case.",
  ],
  "study.previewHintPyraminx": [
    "Đây là sơ đồ 2D của case (như cubingapp.com).",
    "This is the 2D diagram of the case (as on cubingapp.com).",
  ],
  "study.previewHintSkewb": [
    "Đây là sơ đồ 2D của case (như cubingapp.com).",
    "This is the 2D diagram of the case (as on cubingapp.com).",
  ],
  "study.previewHintSq1": [
    "Đây là sơ đồ 2D của case (như cubingapp.com).",
    "This is the 2D diagram of the case (as on cubingapp.com).",
  ],
  "study.previewHintParity": [
    "Đây là sơ đồ 2D của case (như cubingapp.com).",
    "This is the 2D diagram of the case (as on cubingapp.com).",
  ],
  "study.previewHintL2E": [
    "Đây là sơ đồ 2D của case (như cubingapp.com).",
    "This is the 2D diagram of the case (as on cubingapp.com).",
  ],
  "study.previewHintL3T": [
    "Đây là sơ đồ 2D của case (như cubingapp.com).",
    "This is the 2D diagram of the case (as on cubingapp.com).",
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
