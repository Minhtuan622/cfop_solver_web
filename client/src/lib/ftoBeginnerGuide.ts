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

/** A harmless identity turn that allows the renderer to explicitly show a solved FTO. */
export const FTO_SOLVED_REFERENCE_ALG = "U U U";

export function invertFtoAlgorithm(algorithm: string) {
  return algorithm.trim().split(/\s+/).filter(Boolean).reverse().map((move) => move.endsWith("'") ? move.slice(0, -1) : `${move}'`).join(" ");
}

/**
 * This is a deterministic, case-based Nautilus walkthrough rather than a general FTO solver.
 * The scramble is the exact inverse of all four phase algorithms, so every stage starts from
 * the state left by the previous one and the final state is provably solved.
 */
export const FTO_NAUTILUS_WALKTHROUGH: readonly FtoNautilusWalkthroughPhase[] = [
  {
    id: "first-block",
    shortTitleVi: "First Block",
    titleVi: "1. Nautilus · First Block ở bên trái",
    objectiveVi: "Dựng khối đầu tiên ở bên trái: một tâm lớn cùng hai Triple, rồi giữ khối đó nguyên vẹn cho các bước sau.",
    lookForVi: "Nhìn bên trái trước: đích của First Block là một vùng liền mạch, không phải chỉ một mảnh đúng màu.",
    holdVi: "Giữ orientation của walkthrough: vùng bạn đang xây ở bên trái và cạnh làm việc ở phía trước.",
    actionsVi: ["Nhìn preview Trước và xác định vùng bên trái đang thiếu cấu trúc First Block.", "Chạy đoạn xoay của walkthrough; đây là setup đã dựng để thấy điểm chuyển sang Centres.", "Ở preview Sau, chỉ đối chiếu vùng bên trái trước khi nhìn các mảnh còn lại."],
    algorithm: "R U' R' L' U L",
    algorithmRoleVi: "Chuỗi xoay của mốc 1: R U' R' L' U L. Đây là đoạn dựng sẵn đưa walkthrough tới checkpoint First Block.",
    beforeVi: "Trước mốc 1: trạng thái xáo trộn cố định của toàn bộ walkthrough.",
    afterVi: "Sau mốc 1: checkpoint First Block; đây cũng là trạng thái bắt đầu duy nhất của mốc Centres.",
    checkVi: "Bạn có thể chỉ vào vùng block bên trái trước khi bấm Bước tiếp.",
    video: { youtubeId: "J8_9no7Ml78", title: "QUICKEST FTO TUTORIAL | How to solve the Face-Turning Octahedron", focusVi: "Dùng video để đối chiếu ý tưởng dựng block, không thay thế checkpoint của walkthrough." },
  },
  {
    id: "centers",
    shortTitleVi: "Centres",
    titleVi: "2. Nautilus · Centres F, BR và U",
    objectiveVi: "Giải hai trong ba tâm lớn ở bên phải First Block; tâm thứ ba tự hoàn thành khi hai tâm đầu đúng.",
    lookForVi: "Sau First Block, chỉ theo dõi ba tâm F, BR và U ở phía phải; bỏ qua các mảnh không thuộc tâm.",
    holdVi: "Không đổi orientation từ checkpoint trước. Bộ nước xoay trong stage này ưu tiên U, R, r và slice.",
    actionsVi: ["Từ checkpoint mốc 1, tìm ba tâm ở bên phải First Block.", "Xem animation để theo dõi nhóm tâm thay vì cố theo cả FTO.", "So sánh checkpoint Sau: mốc Last Triple luôn bắt đầu đúng từ trạng thái này."],
    algorithm: "l R' L R l' R' L' R",
    algorithmRoleVi: "Chuỗi xoay của mốc 2: l R' L R l' R' L' R. Đây là cycle tâm đưa walkthrough tới checkpoint Centres.",
    beforeVi: "Trước mốc 2: chính xác là trạng thái Sau của First Block, không phải một scramble mới.",
    afterVi: "Sau mốc 2: checkpoint Centres; chỉ còn Last Triple và Last Layer theo đường minh họa.",
    checkVi: "Bạn nhận ra được First Block vẫn giữ nguyên, trong khi vùng tâm ở bên phải đã đổi.",
    video: { youtubeId: "J8_9no7Ml78", title: "QUICKEST FTO TUTORIAL | How to solve the Face-Turning Octahedron", focusVi: "Đối chiếu cách quan sát center và giữ block đã hoàn thành." },
  },
  {
    id: "last-triple",
    shortTitleVi: "Last Triple",
    titleVi: "3. Nautilus · Last Triple",
    objectiveVi: "Hoàn thiện Triple còn lại của hai tầng đầu để chuyển sang Last Layer mà không phá First Block hay Centres.",
    lookForVi: "Tìm góc Triple cuối và slot của nó ở cạnh trước; đây là case insert phải trong walkthrough này.",
    holdVi: "Dùng Edge-in-Front (EIF): cạnh làm việc ở phía trước, giữ phần đã giải ra khỏi vùng xoay.",
    actionsVi: ["Xác định góc Triple cuối ở preview Trước.", "Chạy insert phải từ đúng checkpoint Centres.", "Ở preview Sau, xác nhận chỉ còn Last Layer để xử lý."],
    algorithm: "R U' R'",
    algorithmRoleVi: "Chuỗi xoay của mốc 3: R U' R'. Đây là insert phải Nautilus cho case Last Triple của walkthrough.",
    beforeVi: "Trước mốc 3: state Centres đã hoàn thành từ mốc ngay trước đó.",
    afterVi: "Sau mốc 3: checkpoint chỉ còn Last Layer; trạng thái này được đưa thẳng vào L6X.",
    checkVi: "Bạn thấy được bước tiếp theo không còn là dựng Triple mà là nhận diện Last Layer.",
    video: { youtubeId: "03L3P1a0Auc", title: "How to Solve the Face Turning Octahedron (FTO)", focusVi: "Xem thêm cách cầm EIF và ý nghĩa của Last Triple." },
  },
  {
    id: "last-layer",
    shortTitleVi: "Last Layer",
    titleVi: "4. Nautilus · Last Layer: L6X rồi L3C",
    objectiveVi: "Tự động hóa lớp cuối: giải L6X bằng Headlights trước, sau đó orient ba góc cuối bằng L3C để hoàn tất FTO.",
    lookForVi: "Chỉ nhìn sticker bên hông của lớp cuối. Trong walkthrough này bạn sẽ thấy checkpoint L6X rồi trạng thái solved cuối.",
    holdVi: "Giữ U ở trên và R ở phía trước khi chạy Headlights; sau đó giữ nguyên orientation cho L3C của walkthrough.",
    actionsVi: ["Chạy Headlights để tạo checkpoint L6X đã xong.", "Chạy L3C Orient hai góc từ checkpoint đó để hoàn tất khối.", "Đối chiếu preview Sau với trạng thái solved; đây là kết thúc của cùng một scramble ban đầu."],
    algorithm: "r U R' U' R r' L' U' L R U R' | U R' F' R U' BR U R' F' R U'",
    algorithmRoleVi: "Đoạn 1 · L6X Headlights: r U R' U' R r' L' U' L R U R'. Đoạn 2 · L3C Orient: U R' F' R U' BR U R' F' R U'.",
    beforeVi: "Trước mốc 4: state Last Triple đã hoàn thành, liên tục từ đúng scramble đầu trang.",
    afterVi: "Sau mốc 4: FTO solved. Không có reset hay scramble thứ hai trong walkthrough này.",
    checkVi: "Mô hình Sau phải là FTO đã giải; nếu không, hãy phát lại mốc 4 từ trạng thái Trước được hiển thị.",
    video: { youtubeId: "J8_9no7Ml78", title: "QUICKEST FTO TUTORIAL | How to solve the Face-Turning Octahedron", focusVi: "Dùng làm tài liệu bổ sung về nhận diện Last Layer sau khi theo dõi walkthrough." },
  },
] as const;

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

/** State after a phase has been completed, retained as the starting state of the next phase. */
export function ftoWalkthroughStateAfter(phaseIndex: number) {
  const completed = FTO_NAUTILUS_WALKTHROUGH.slice(0, Math.max(0, phaseIndex) + 1).flatMap(ftoWalkthroughPhaseAlgorithms).join(" ");
  return `${FTO_NAUTILUS_WALKTHROUGH_SCRAMBLE} ${completed}`.trim();
}

/** Compatibility export for the retained algorithm-count tests. */
export const FTO_BEGINNER_GUIDE = FTO_NAUTILUS_WALKTHROUGH;
export function ftoGuideAlgorithmCount() { return FTO_NAUTILUS_WALKTHROUGH.flatMap(ftoWalkthroughPhaseAlgorithms).length; }
