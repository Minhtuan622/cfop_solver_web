export type FtoGuideVideo = { youtubeId: string; title: string; focusVi: string };

export type FtoNautilusWalkthroughPhase = {
  id: string;
  shortTitleVi: string;
  titleVi: string;
  objectiveVi: string;
  lookForVi: string;
  holdVi: string;
  actionsVi: readonly string[];
  algorithm: string;
  algorithmRoleVi: string;
  beforeVi: string;
  afterVi: string;
  checkVi: string;
  video: FtoGuideVideo;
};

export type FtoNautilusBranch = {
  nameVi: string;
  objectiveVi: string;
  recognitionVi: string;
  algorithm: string;
  setupAlg: string;
  sourceUrl: string;
};

/** A harmless identity turn that lets TwistyPlayer render the solved FTO state. */
export const FTO_SOLVED_REFERENCE_ALG = "U U U";

export function invertFtoAlgorithm(algorithm: string) {
  return algorithm.trim().split(/\s+/).filter(Boolean).reverse().map((move) => move.endsWith("'") ? move.slice(0, -1) : `${move}'`).join(" ");
}

/**
 * One fixed, case-based advanced ending. It intentionally contains no Baby/2-look case.
 * First Block and Centres remain the intuitive opening of Nautilus. From the prepared endgame
 * state, this exact path is Advanced Last Triple → one-look L6X → one-look L3C → solved.
 */
export const FTO_NAUTILUS_WALKTHROUGH: readonly FtoNautilusWalkthroughPhase[] = [
  {
    id: "last-triple-advanced",
    shortTitleVi: "Last Triple · Advanced",
    titleVi: "1. Nautilus nâng cao · Last Triple giải đủ ba mảnh",
    objectiveVi: "Giải cả góc, tam giác trước và tam giác dưới của Last Triple trong một algorithm, thay vì các insert Baby/2-look.",
    lookForVi: "Đặt Last Triple ở phía trước trong cách cầm Edge-in-Front (EIF). Case walkthrough là T-Left 1 của catalogue Last Triple Advanced.",
    holdVi: "Theo grip {U,R} của nguồn: đưa R ra phía trước; rotation/grip không nằm trong chuỗi animation.",
    actionsVi: ["Bắt đầu từ đúng scramble cố định ở đầu lộ trình; đây là state endgame đã dựng cho ba stage nâng cao.", "Chạy algorithm một lần để xử lý toàn bộ Last Triple, không chèn từng góc hay tam giác riêng lẻ.", "Ở checkpoint Sau, chuyển ngay sang one-look L6X; không tạo scramble hoặc case cơ bản mới."],
    algorithm: "F' R' L R L' F R U' R'",
    algorithmRoleVi: "LT Advanced · T-Left 1: F' R' L R L' F R U' R'.",
    beforeVi: "Trước Last Triple Advanced: cùng một scramble cố định của đường giải nâng cao.",
    afterVi: "Sau Last Triple Advanced: Last Layer sẵn sàng cho one-look L6X.",
    checkVi: "Bạn đang nhìn một algorithm xử lý ba mảnh Last Triple trong một lần, không phải insert cơ bản.",
    video: { youtubeId: "J8_9no7Ml78", title: "QUICKEST FTO TUTORIAL | How to solve the Face-Turning Octahedron", focusVi: "Đối chiếu cách cầm Edge-in-Front trước khi luyện algorithmic Last Triple." },
  },
  {
    id: "l6x-one-look",
    shortTitleVi: "L6X · One-look",
    titleVi: "2. Nautilus nâng cao · One-look L6X",
    objectiveVi: "Giải toàn bộ sáu tam giác cuối trong một algorithm duy nhất bằng nhận diện side pattern, không chạy Headlights/Cat ears theo two-look.",
    lookForVi: "Case walkthrough là H1: Three Headlights / Right Edge Matching. One-look L6X có 35 case; H1 chỉ là case mẫu cụ thể, không phải Headlights two-look.",
    holdVi: "Giữ EIF {U,R}; nhận diện từ side stickers của Last Layer, không cần nhìn U face.",
    actionsVi: ["Nhìn pattern H1 ở checkpoint Trước và gọi tên nó là Three Headlights / Right Edge Matching.", "Chạy duy nhất một algorithm L6X; không dừng để dựng diamond hoặc làm hai bước.", "Sau animation, checkpoint L3C bắt đầu từ đúng state này để xử lý ba góc cuối."],
    algorithm: "L U L' U L U L'",
    algorithmRoleVi: "L6X one-look · H1 Three Headlights / Right Edge Matching: L U L' U L U L'.",
    beforeVi: "Trước L6X one-look: state Sau của Last Triple Advanced.",
    afterVi: "Sau L6X one-look: sáu tam giác cuối đã xử lý; chỉ còn L3C one-look trong walkthrough.",
    checkVi: "Bước này được hoàn thành bằng một look và một algorithm, không phải quy trình Headlights two-look.",
    video: { youtubeId: "J8_9no7Ml78", title: "QUICKEST FTO TUTORIAL | How to solve the Face-Turning Octahedron", focusVi: "Dùng làm tài liệu nhận diện Last Layer bằng sticker bên hông." },
  },
  {
    id: "l3c-one-look",
    shortTitleVi: "L3C · One-look",
    titleVi: "3. Nautilus nâng cao · One-look L3C → solved",
    objectiveVi: "Giải ba góc cuối trong một algorithm L3C one-look. Đây là case Two flip counterclockwise permutation của bộ năm case L3C one-look.",
    lookForVi: "Nhận diện hai góc flip theo chiều ngược kim đồng hồ ở side stickers. Không tách thành Orient rồi Permute như two-look.",
    holdVi: "Theo grip {L,F} trong nguồn: L ở trên và F ở trước. Chuỗi dưới đây đã bỏ grip để player có thể phát đúng các nước xoay.",
    actionsVi: ["So sánh preview Trước với checkpoint Sau của L6X; bạn đang ở một state L3C duy nhất.", "Chạy một lần algorithm One-look L3C cho two flip counterclockwise permutation.", "Preview Sau phải là FTO solved: đây là kết thúc của đúng scramble duy nhất ở đầu walkthrough."],
    algorithm: "U R' F R U' BR' U R' F R U'",
    algorithmRoleVi: "L3C one-look · Two flip counterclockwise permutation: U R' F R U' BR' U R' F R U'.",
    beforeVi: "Trước L3C one-look: state Sau của L6X one-look, không phải case độc lập.",
    afterVi: "Sau L3C one-look: FTO solved.",
    checkVi: "Bạn kết thúc bằng một algorithm L3C one-look, không phải Orient + Permute hai lần nhìn.",
    video: { youtubeId: "03L3P1a0Auc", title: "How to Solve the Face Turning Octahedron (FTO)", focusVi: "Đối chiếu orientation trước khi chạy algorithm góc cuối." },
  },
] as const;

/**
 * 1LLL is an alternative direct Last Layer finish, not a fourth move after L6X + L3C.
 * It is deliberately separate so the UI never mislabels a two-step ending as 1LLL.
 */
export const FTO_NAUTILUS_1LLL_CAPSTONE: FtoNautilusBranch = {
  nameVi: "1LLL · H1o-",
  objectiveVi: "Giải toàn bộ Last Layer trong một look và một algorithm; đây là nhánh thay thế cho L6X one-look → L3C one-look.",
  recognitionVi: "Catalogue 1LLL chia case theo nhóm L6X (T, H, D, C). Case mẫu H1o- dùng nhận diện side-only ở group H1.",
  algorithm: "R U R' U R U R'",
  setupAlg: "R U' R' U' R U' R'",
  sourceUrl: "https://docs.google.com/spreadsheets/d/15v0A0PipO8RcEeS7TFAaAv3dI1zBykaopkXQK_WnLo0/edit?gid=1497905026#gid=1497905026",
};

export function ftoWalkthroughPhaseAlgorithms(phase: FtoNautilusWalkthroughPhase) {
  return phase.algorithm.split("|").map((segment) => segment.trim()).filter(Boolean);
}

export function ftoWalkthroughSolution() {
  return FTO_NAUTILUS_WALKTHROUGH.flatMap(ftoWalkthroughPhaseAlgorithms).join(" ");
}

export const FTO_NAUTILUS_WALKTHROUGH_SCRAMBLE = invertFtoAlgorithm(ftoWalkthroughSolution());

/** State visible immediately before a selected phase, derived from the one fixed scramble. */
export function ftoWalkthroughStateBefore(phaseIndex: number) {
  const prior = FTO_NAUTILUS_WALKTHROUGH.slice(0, Math.max(0, phaseIndex)).flatMap(ftoWalkthroughPhaseAlgorithms).join(" ");
  return `${FTO_NAUTILUS_WALKTHROUGH_SCRAMBLE} ${prior}`.trim();
}

/** State after a phase, retained as the next phase's exact starting state. */
export function ftoWalkthroughStateAfter(phaseIndex: number) {
  const completed = FTO_NAUTILUS_WALKTHROUGH.slice(0, Math.max(0, phaseIndex) + 1).flatMap(ftoWalkthroughPhaseAlgorithms).join(" ");
  return `${FTO_NAUTILUS_WALKTHROUGH_SCRAMBLE} ${completed}`.trim();
}

/** Compatibility export retained for code that reads the aggregate algorithm count. */
export const FTO_BEGINNER_GUIDE = FTO_NAUTILUS_WALKTHROUGH;
export function ftoGuideAlgorithmCount() { return FTO_NAUTILUS_WALKTHROUGH.flatMap(ftoWalkthroughPhaseAlgorithms).length; }
