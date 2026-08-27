export type FtoGuideMove = { labelVi: string; algorithm: string; setupAlg: string; useVi: string };
export type FtoGuideVideo = { youtubeId: string; title: string; focusVi: string };
export type FtoGuideVisual = { scramble: string; focusVi: string };
export type FtoGuideStep = { id: string; titleVi: string; goalVi: string; holdVi: string; actionsVi: readonly string[]; checkVi: string; moves: readonly FtoGuideMove[]; tipVi: string; visual: FtoGuideVisual; video: FtoGuideVideo };

export function invertFtoAlgorithm(algorithm: string) {
  return algorithm.trim().split(/\s+/).filter(Boolean).reverse().map((move) => move.endsWith("'") ? move.slice(0, -1) : `${move}'`).join(" ");
}

const advancedMove = (labelVi: string, algorithm: string, useVi: string): FtoGuideMove => ({ labelVi, algorithm, setupAlg: invertFtoAlgorithm(algorithm), useVi });

export const FTO_BEGINNER_GUIDE: readonly FtoGuideStep[] = [
  {
    id: "nautilus-grip",
    titleVi: "1. Thiết lập kiểu cầm Nautilus",
    goalVi: "Chuyển từ cách giải từng nhóm mảnh sang cách nhìn speedsolving: dựng First Block, giải Centers, rồi tự động hóa Last Triple và Last Layer.",
    holdVi: "Dùng cách cầm Edge in Front (EIF): xoay nhẹ khối để R đi ra phía trước. Các thuật toán nâng cao dưới đây chỉ dùng sau khi bạn đã quen cách cầm này.",
    actionsVi: ["Giải First Block và Centers bằng look-ahead thay vì cố học thuộc chuỗi dài.", "Giữ một cạnh ở phía trước trước khi nhận diện Last Triple.", "Chỉ học thuật toán khi bạn nhận ra chắc chắn pattern ở vùng nhìn thấy."],
    checkVi: "Bạn phân biệt được bốn giai đoạn Nautilus: First Block → Centers → Last Triple → Last Layer.",
    moves: [],
    tipVi: "Nautilus là hướng speedsolving: hai bước đầu thiên về trực giác, còn Last Triple và Last Layer là nơi chuyển dần sang thuật toán.",
    visual: { scramble: "U U U", focusVi: "Trạng thái solved là tham chiếu cho nhận diện. Xoay 3D để xác định lại orientation và cách cầm EIF trước khi vào case." },
    video: { youtubeId: "J8_9no7Ml78", title: "QUICKEST FTO TUTORIAL | How to solve the Face-Turning Octahedron", focusVi: "Dùng video này để ôn cách cầm và luồng giải trước khi bắt đầu các case nâng cao." },
  },
  {
    id: "last-triple",
    titleVi: "2. Last Triple · Chèn góc tốc độ",
    goalVi: "Hoàn thiện Triple cuối ở hai tầng đầu bằng insert ngắn, là cầu nối từ look-ahead sang các case tự động.",
    holdVi: "Giữ EIF: R ở phía trước. Nếu góc đang ở slot nhưng sai chiều, đưa nó ra U bằng một insert rồi đưa lại đúng chiều.",
    actionsVi: ["Nhận diện chiều của góc Triple cuối trên U.", "Chọn insert phải hoặc trái để đặt góc vào slot.", "Trong lúc insert, nhìn trước tam giác mặt trước cho bước L6X."],
    checkVi: "Góc Triple cuối vào đúng slot mà các nhóm mảnh đã giải vẫn nguyên vẹn.",
    moves: [advancedMove("Insert góc từ phải", "R U' R'", "Dùng khi góc cần chèn đi vào slot theo phía R trong cách cầm EIF."), advancedMove("Insert góc từ trái", "L' U L", "Dùng khi góc cần chèn đi vào slot theo phía L trong cách cầm EIF.")],
    tipVi: "Không cần ép một công thức cho mọi case: quan sát màu front của góc trước, rồi chọn phía insert ngắn nhất.",
    visual: { scramble: "R U R'", focusVi: "Đây là setup nghịch đảo của insert phải. Phát animation “Insert góc từ phải” để xem góc trở lại slot đã giải." },
    video: { youtubeId: "03L3P1a0Auc", title: "How to Solve the Face Turning Octahedron (FTO)", focusVi: "Tập trung phần ghép/chèn Triple trước khi học các case Last Layer." },
  },
  {
    id: "l6x-two-look",
    titleVi: "3. L6X · Two-look nâng cao",
    goalVi: "Giải sáu tam giác cuối bằng nhận diện Headlights hoặc Cat ears để tạo một mặt hoàn chỉnh nhanh hơn cách dựng diamond cơ bản.",
    holdVi: "Giữ U ở trên và R ở phía trước. Nhận diện chỉ từ sticker bên hông của last layer; ưu tiên pattern thấy rõ ở hai mặt trước.",
    actionsVi: ["Tìm Headlights: hai sticker giống nhau trên một cạnh bên.", "Nếu không có, tìm Cat ears: hai sticker giống nhau quanh một góc.", "Thực hiện case tương ứng rồi kiểm tra hai mặt còn lại trước khi chuyển L3C."],
    checkVi: "Các tam giác last layer đã tạo các mặt hoàn chỉnh theo pattern mục tiêu, sẵn sàng cho ba góc cuối.",
    moves: [advancedMove("L6X · Headlights", "r U R' U' R r' L' U' L R U R'", "Dùng khi nhận diện Headlights; theo tài liệu Nautilus, đây là case hoán đổi hai mặt."), advancedMove("L6X · Cat ears", "R' U' F U' R U R' F' U R", "Dùng khi hai sticker giống nhau tạo Cat ears quanh góc nhìn thấy.")],
    tipVi: "Học recognition trước: Headlights và Cat ears là nền để tiến lên one-look L6X, không phải hai công thức để đoán mò.",
    visual: { scramble: "R U' R' L U L' r R' U' R U' r'", focusVi: "Đây là setup nghịch đảo của Headlights. Phát animation để xem toàn bộ L6X được đưa về trạng thái đã giải." },
    video: { youtubeId: "J8_9no7Ml78", title: "QUICKEST FTO TUTORIAL | How to solve the Face-Turning Octahedron", focusVi: "Xem cách quan sát sticker bên hông trước khi chọn case last layer." },
  },
  {
    id: "l3c",
    titleVi: "4. L3C · Orient và hoán vị góc",
    goalVi: "Tự động hóa ba góc cuối bằng case orientation hoặc pure two flip; đây là lớp chuyển tiếp trước khi học one-look L3C/1LLL.",
    holdVi: "Theo notation nguồn, thuật toán orientation dùng cách cầm {L,F}; pure two flip dùng {R,D}. Các rotation này là hướng cầm, không phải nước xoay trong chuỗi hiển thị.",
    actionsVi: ["Đưa hai góc sai chiều về sau trước khi dùng orientation.", "Nếu gặp hai flip thuần, chọn pure two flip thay vì tách orientation và permutation.", "Nhìn pattern bên hông trước để tránh đổi cách cầm giữa công thức."],
    checkVi: "Ba góc cuối đúng chiều và đúng thứ tự; last layer hoàn chỉnh.",
    moves: [advancedMove("L3C · Orient hai góc", "U R' F' R U' BR U R' F' R U'", "Dùng với cách cầm {L,F} khi hai góc sai chiều ở phía sau."), advancedMove("L3C · Pure two flip", "D' R' U' R B' R' B R' L R L' U R D", "Dùng với cách cầm {R,D} cho case pure two flip của L3C.")],
    tipVi: "Đừng đưa các rotation {L,F}/{R,D} vào player: đó là hướng cầm được tài liệu chỉ định, còn animation chỉ chạy chuỗi move chuẩn hóa.",
    visual: { scramble: "U R' F R' U BR' U R' F R U'", focusVi: "Đây là setup nghịch đảo của case Orient hai góc. Khi phát animation, chuỗi sẽ hoàn tác đúng về FTO đã giải." },
    video: { youtubeId: "03L3P1a0Auc", title: "How to Solve the Face Turning Octahedron (FTO)", focusVi: "Đối chiếu cách giữ orientation cố định khi xử lý những góc cuối." },
  },
  {
    id: "one-look-path",
    titleVi: "5. Mở rộng · One-look và 1LLL",
    goalVi: "Khi two-look L6X/L3C đã ổn định, chuyển từng nhóm case sang one-look để giảm số lần dừng nhìn.",
    holdVi: "Giữ cùng hệ quy chiếu EIF và ưu tiên recognition từ sticker bên hông. Không học một case mới nếu chưa nhận diện lại được ngay ngày sau.",
    actionsVi: ["Hoàn thiện Headlights và Cat ears trước khi mở rộng L6X one-look.", "Sau đó chuyển sang L3C one-look; tài liệu Nautilus nêu năm case ở tầng này.", "Cuối cùng, học 1LLL theo set nhỏ, có lặp lại ngắt quãng thay vì nạp toàn bộ catalogue."],
    checkVi: "Bạn có thể gọi đúng case two-look hiện tại trước khi thêm một case one-look mới.",
    moves: [],
    tipVi: "Theo lộ trình Nautilus, 1LLL là mục tiêu cuối cùng; dùng recognition side-only để giữ look-ahead thay vì chỉ chạy theo số lượng công thức.",
    visual: { scramble: "U U U", focusVi: "Trạng thái solved là đích của các case one-look. Dùng nó để luyện nhìn side stickers ở nhiều góc camera." },
    video: { youtubeId: "J8_9no7Ml78", title: "QUICKEST FTO TUTORIAL | How to solve the Face-Turning Octahedron", focusVi: "Xem lại last layer sau khi bạn nhận diện ổn định hai case L6X và L3C ở trên." },
  },
] as const;

export function ftoGuideAlgorithmCount() { return FTO_BEGINNER_GUIDE.reduce((count, step) => count + step.moves.length, 0); }
