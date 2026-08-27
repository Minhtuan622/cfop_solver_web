export type FtoGuideVideo = { youtubeId: string; title: string; focusVi: string };

export type FtoBenciscoWalkthroughPhase = {
  id: string;
  shortTitleVi: string;
  titleVi: string;
  objectiveVi: string;
  lookForVi: string;
  holdVi: string;
  actionsVi: readonly string[];
  algorithm: string;
  displayAlgorithm?: string;
  algorithmRoleVi: string;
  beforeVi: string;
  afterVi: string;
  checkVi: string;
  video: FtoGuideVideo;
};

/** A harmless identity turn that lets TwistyPlayer render the canonical solved FTO state. */
export const FTO_SOLVED_REFERENCE_ALG = "U U U";

export function invertFtoAlgorithm(algorithm: string) {
  return algorithm.trim().split(/\s+/).filter(Boolean).reverse().map((move) => move.endsWith("'") ? move.slice(0, -1) : `${move}'`).join(" ");
}

/**
 * A deterministic Bencisco walkthrough. The scramble is exactly the inverse of all six stages,
 * so each After preview is the next stage's Before preview and the final stage is solved.
 * `2R` and `r` use Cubing.js FTO notation for wide and slice turns respectively.
 */
export const FTO_BENCISCO_WALKTHROUGH: readonly FtoBenciscoWalkthroughPhase[] = [
  {
    id: "white-center",
    shortTitleVi: "White center",
    titleVi: "1. Bencisco · Hoàn thành white center / hexagon",
    objectiveVi: "Ghép ba cạnh trắng và ba tam giác trắng thành white center (hexagon). Trên walkthrough cố định này, checkpoint Sau hiển thị luôn trọn mặt U trắng để bạn có một mốc 3D dễ đối chiếu.",
    lookForVi: "Tìm hai cụm hình thang: cụm lớn gồm 2 cạnh + 1 tam giác trắng, rồi cụm nhỏ gồm 1 cạnh + 2 tam giác trắng. Khi ghép lại, cả hexagon trắng liền mạch xuất hiện.",
    holdVi: "Quy ước Bencisco: bắt đầu white trên U. `Uv'` là xoay cả khối để đặt các mảnh trong orientation dễ nhìn; không phải một lượt face turn.",
    actionsVi: ["Từ scramble cố định, gom các mảnh trắng thành hai hình thang lớn/nhỏ.", "Dùng đoạn xoay ví dụ để ghép hai hình thang thành một white center duy nhất.", "Ở preview Sau, xác nhận cả 9 sticker trên mặt U đều trắng trước khi sang First Two Triples."],
    algorithm: "L' U' BR' R F L'",
    displayAlgorithm: "Uv' L' U' BR' R F L'",
    algorithmRoleVi: "Example solve Bencisco · First Center (white): Uv' L' U' BR' R F L'.",
    beforeVi: "Trước mốc 1: FTO ở scramble cố định của toàn walkthrough Bencisco.",
    afterVi: "Sau mốc 1: white center/hexagon và mặt U trắng đã hoàn thành; đây là state bắt đầu First Two Triples.",
    checkVi: "Mặt U ở preview Sau phải là một tam giác lớn có đủ 9 sticker trắng trước khi bạn chuyển stage.",
    video: { youtubeId: "tYeV8LvqVDY", title: "How to Solve an FTO (Bencisco Method)", focusVi: "Đối chiếu cách dựng white center bằng hai hình thang." },
  },
  {
    id: "first-two-triples",
    shortTitleVi: "First Two Triples",
    titleVi: "2. Bencisco · First Two Triples (F2T)",
    objectiveVi: "Ghép hai triple cạnh white center: mỗi triple gồm một corner và hai tam giác. White center được giữ nguyên trong khi block lớn dần.",
    lookForVi: "Nhìn các corner có màu ăn khớp với hai vùng kề white center. Mục tiêu là corner + hai tam giác đúng màu, không chỉ là một corner đúng vị trí.",
    holdVi: "Đưa white center về BL bằng `Lv'`; dùng R để ghép mảnh, U/F/BR để đặt triple. `2R` là wide R của renderer FTO.",
    actionsVi: ["Ở state Trước, nhận diện một triple đã có sẵn và một triple cần ghép.", "Ghép hai triple rồi đặt chúng kề white center mà không phá hexagon trắng.", "Ở state Sau, bạn có white center + hai triple; đây là block Bencisco đầu tiên."],
    algorithm: "U' BL F' R' U' R' 2R U'",
    displayAlgorithm: "Lv' U' BL F' R' U' R' 2R U'",
    algorithmRoleVi: "Example solve Bencisco · F2T: Lv' U' BL F' R' U' R' 2R U'.",
    beforeVi: "Trước mốc 2: chính là state Sau của white center.",
    afterVi: "Sau mốc 2: white center và hai triple đầu đã ghép; stage Centres bắt đầu từ đây.",
    checkVi: "White center không bị phá và hai triple kề nó đã cùng màu với center.",
    video: { youtubeId: "tYeV8LvqVDY", title: "How to Solve an FTO (Bencisco Method)", focusVi: "Tập nhận diện corner–triangle pair và đặt hai triple đầu." },
  },
  {
    id: "second-center",
    shortTitleVi: "Second Center",
    titleVi: "3. Bencisco · Dựng center thứ hai",
    objectiveVi: "Hoàn thiện một center còn lại bằng large trapezoid và small trapezoid, sau đó đặt center vào BR mà không làm vỡ block đầu.",
    lookForVi: "Chỉ theo dõi một màu center đích: một nhóm 2 cạnh + 1 tam giác và một nhóm 1 cạnh + 2 tam giác. Các triple đã giải là vùng không được phá.",
    holdVi: "Đưa block đã giải xuống dưới bằng `Rv'`. Wide `2R` mở layer làm việc, còn R/U đưa hai hình thang vào đúng chỗ.",
    actionsVi: ["Dựng large trapezoid trước, rồi tách/ghép small trapezoid của cùng màu.", "Đưa hai hình thang vào nhau để tạo center thứ hai và đưa nó về BR.", "So sánh preview Sau: white block cũ vẫn nguyên, nhưng một center mới đã hoàn chỉnh."],
    algorithm: "U 2R U' R U 2R' U' R' 2R' U R'",
    displayAlgorithm: "Rv' U 2R U' R U 2R' U' R' 2R' U R'",
    algorithmRoleVi: "Example solve Bencisco · Second Center: Rv' U 2R U' R U 2R' U' R' 2R' U R'.",
    beforeVi: "Trước mốc 3: state Sau của First Two Triples.",
    afterVi: "Sau mốc 3: second center đã hoàn thành; chỉ còn Last Two Centers trước khi xử lý triple cuối.",
    checkVi: "Bạn nhìn thấy block white ban đầu vẫn giữ nguyên khi center mới xuất hiện.",
    video: { youtubeId: "tYeV8LvqVDY", title: "How to Solve an FTO (Bencisco Method)", focusVi: "Quan sát cách giữ F2T trong lúc dựng center tiếp theo." },
  },
  {
    id: "last-two-centers",
    shortTitleVi: "Last Two Centers",
    titleVi: "4. Bencisco · Last Two Centers (L2C)",
    objectiveVi: "Dựng center áp chót; center còn lại được hoàn thành cùng lúc. Đây là nơi wide/slice turn giúp giữ nguyên các block đã làm.",
    lookForVi: "Tìm large trapezoid của màu cần dựng trước. Trên FTO 3D, đừng theo cả khối: chỉ theo ba sticker của trapezoid lớn rồi ba sticker của trapezoid nhỏ.",
    holdVi: "Dùng U/R để đưa mảnh, `2R` cho wide R và `r` cho slice song song R. White block phải nằm ngoài vùng làm việc.",
    actionsVi: ["Ghép large trapezoid của center đích mà không tháo F2T.", "Đưa tam giác còn lại vào để hình thành small trapezoid rồi nhập hai cụm.", "Preview Sau có đủ các center cần thiết; đây là mốc vào Last Bottom Triple."],
    algorithm: "U' 2R' U R U r U' 2R' R U R' U' R U R'",
    algorithmRoleVi: "Example solve Bencisco · Last Two Centers: U' 2R' U R U r U' 2R' R U R' U' R U R'.",
    beforeVi: "Trước mốc 4: state Sau của Second Center.",
    afterVi: "Sau mốc 4: các center của Bencisco đã sẵn sàng; chuyển sang Last Bottom Triple.",
    checkVi: "Đừng đổi target giữa chừng: sau stage này các center không còn là thứ cần tìm nữa.",
    video: { youtubeId: "tYeV8LvqVDY", title: "How to Solve an FTO (Bencisco Method)", focusVi: "Luyện wide/slice turns trong Last Two Centers." },
  },
  {
    id: "last-bottom-triple",
    shortTitleVi: "Last Bottom Triple",
    titleVi: "5. Bencisco · Last Bottom Triple (LBT)",
    objectiveVi: "Hoàn thiện triple cuối đi cùng white center để kết thúc hai tầng đầu, rồi đưa ba triple cuối về stage cuối cùng.",
    lookForVi: "Tìm corner của bottom triple và tam giác đi với nó. Trước khi chèn, bảo đảm corner này chưa bị kẹt trong keyhole slot sai.",
    holdVi: "Giữ các center đã hoàn thành. Wide `2R` đưa center vào orientation, sau đó F/U/BL chèn triple cuối đúng slot.",
    actionsVi: ["Đưa các center về orientation để LBT không bị kẹt vào slot sai.", "Chèn Last Bottom Triple, không chạm vào white center đã có.", "Sau stage này, chỉ còn ba triple cuối để hoàn tất toàn bộ FTO."],
    algorithm: "U 2R U' 2R F' U' F U BL",
    algorithmRoleVi: "Example solve Bencisco · Last Bottom Triple: U 2R U' 2R F' U' F U BL.",
    beforeVi: "Trước mốc 5: state Sau của Last Two Centers.",
    afterVi: "Sau mốc 5: F2L-equivalent block đã xong; mốc Last 3 Triples là bước cuối.",
    checkVi: "White center và tất cả center đã hoàn thành vẫn được giữ nguyên sau khi chèn triple.",
    video: { youtubeId: "tYeV8LvqVDY", title: "How to Solve an FTO (Bencisco Method)", focusVi: "Xem cách tránh keyhole slot xấu trước Last Bottom Triple." },
  },
  {
    id: "last-three-triples",
    shortTitleVi: "Last 3 Triples",
    titleVi: "6. Bencisco · Last 3 Triples → solved",
    objectiveVi: "Xử lý ba triple cuối bằng hedge, sledge, triangle permutation và corner permutation. Đây là stage algorithmic kết thúc example solve.",
    lookForVi: "Nhận diện pair corner–triangle đã có, sau đó xem pair nào cần flip. Hedge là `R B' R' B`; sledge là `R' L R L'` trong example này.",
    holdVi: "`T'` và `Uv` là whole-puzzle rotations dùng để đưa case về góc nhìn Bencisco. Sau đó hedge/sledge hoạt động trên các triple cuối.",
    actionsVi: ["Dùng hedge để ép pair cần thiết, ghép corner với triangle, rồi dùng sledge để đưa pair còn lại lên trên.", "Hoàn tất triangle permutation và corner permutation theo đoạn example solve.", "Preview Sau là FTO solved; tất cả sáu stage dùng đúng một scramble đầu vào."],
    algorithm: "R B' R' B U R' L R L' U' R' L R L' F D' F U F' D F U' F",
    displayAlgorithm: "T' Uv R B' R' B U R' L R L' U' Uv' R' L R L' T F D' F U F' D F U' F",
    algorithmRoleVi: "Example solve Bencisco · Last 3 Triples: T' Uv R B' R' B U R' L R L' U' Uv' R' L R L' T F D' F U F' D F U' F.",
    beforeVi: "Trước mốc 6: state Sau của Last Bottom Triple.",
    afterVi: "Sau mốc 6: FTO solved.",
    checkVi: "Kết quả cuối là solved, không cần reset hoặc một scramble/algorithm thứ hai.",
    video: { youtubeId: "tYeV8LvqVDY", title: "How to Solve an FTO (Bencisco Method)", focusVi: "Nhận diện hedge, sledge, triangle permutation và corner permutation của Last 3 Triples." },
  },
] as const;

export function ftoWalkthroughPhaseAlgorithms(phase: FtoBenciscoWalkthroughPhase) {
  return phase.algorithm.split("|").map((segment) => segment.trim()).filter(Boolean);
}

/** Source notation keeps Bencisco regrips visible; state/animation omit them so U remains the white reference face. */
export function ftoWalkthroughDisplayAlgorithms(phase: FtoBenciscoWalkthroughPhase) {
  return (phase.displayAlgorithm ?? phase.algorithm).split("|").map((segment) => segment.trim()).filter(Boolean);
}

export function ftoWalkthroughSolution() {
  return FTO_BENCISCO_WALKTHROUGH.flatMap(ftoWalkthroughPhaseAlgorithms).join(" ");
}

export const FTO_BENCISCO_WALKTHROUGH_SCRAMBLE = invertFtoAlgorithm(ftoWalkthroughSolution());

export function ftoWalkthroughStateBefore(phaseIndex: number) {
  const prior = FTO_BENCISCO_WALKTHROUGH.slice(0, Math.max(0, phaseIndex)).flatMap(ftoWalkthroughPhaseAlgorithms).join(" ");
  return `${FTO_BENCISCO_WALKTHROUGH_SCRAMBLE} ${prior}`.trim();
}

export function ftoWalkthroughStateAfter(phaseIndex: number) {
  const completed = FTO_BENCISCO_WALKTHROUGH.slice(0, Math.max(0, phaseIndex) + 1).flatMap(ftoWalkthroughPhaseAlgorithms).join(" ");
  return `${FTO_BENCISCO_WALKTHROUGH_SCRAMBLE} ${completed}`.trim();
}

/** Compatibility export retained for code that reads aggregate walkthrough algorithms. */
export const FTO_BEGINNER_GUIDE = FTO_BENCISCO_WALKTHROUGH;
export function ftoGuideAlgorithmCount() { return FTO_BENCISCO_WALKTHROUGH.flatMap(ftoWalkthroughPhaseAlgorithms).length; }
