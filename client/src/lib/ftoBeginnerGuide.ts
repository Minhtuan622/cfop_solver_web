export type FtoGuideMove = { labelVi: string; algorithm: string; setupAlg: string; useVi: string; resultVi?: string };
export type FtoGuideVideo = { youtubeId: string; title: string; focusVi: string };
export type FtoGuideVisual = { scramble: string; focusVi: string; beforeVi?: string; afterVi?: string };
export type FtoGuideStep = { id: string; titleVi: string; goalVi: string; holdVi: string; actionsVi: readonly string[]; checkVi: string; moves: readonly FtoGuideMove[]; tipVi: string; visual: FtoGuideVisual; video: FtoGuideVideo };

/** A harmless identity turn that lets the 3D renderer display an explicitly solved FTO state. */
export const FTO_SOLVED_REFERENCE_ALG = "U U U";

export function invertFtoAlgorithm(algorithm: string) {
  return algorithm.trim().split(/\s+/).filter(Boolean).reverse().map((move) => move.endsWith("'") ? move.slice(0, -1) : `${move}'`).join(" ");
}

const guideMove = (labelVi: string, algorithm: string, useVi: string, resultVi: string): FtoGuideMove => ({
  labelVi,
  algorithm,
  setupAlg: invertFtoAlgorithm(algorithm),
  useVi,
  resultVi,
});

/**
 * The default path deliberately postpones speedsolving terminology. Its first goal is
 * the beginner-method white face described by A Fort Made of Books and Cubelelo.
 */
export const FTO_BEGINNER_LESSONS: readonly FtoGuideStep[] = [
  {
    id: "white-edges",
    titleVi: "1. Bắt đầu với ba cạnh trắng",
    goalVi: "Việc đầu tiên chỉ là đưa ba cạnh có màu trắng về cùng mặt trắng. Chưa cần giải góc, tâm hoặc toàn bộ khối.",
    holdVi: "Đặt mặt trắng ở bên trái như preview. Chọn một cạnh có trắng và nhìn màu còn lại của nó để biết nó thuộc về phía nào.",
    actionsVi: [
      "Tìm một mảnh có hai màu, trong đó có màu trắng; đó là cạnh bạn đang tìm.",
      "Đưa cạnh đó sát mặt trắng, đồng thời giữ màu còn lại cạnh mặt cùng màu.",
      "Làm lần lượt ba cạnh trắng. Các tam giác trắng ở giữa chưa cần đúng ở bài này.",
    ],
    checkVi: "Dừng khi thấy ba cạnh trắng kề nhau trên cùng một mặt; bỏ qua mọi mảnh khác.",
    moves: [guideMove("Chèn cạnh mẫu bên phải", "R U' R'", "Dùng như một mẫu quan sát khi mảnh cần đưa vào nằm trên U, cạnh slot phía phải.", "Cạnh mẫu được đưa về slot và preview bên phải trở lại trạng thái hoàn chỉnh.")],
    tipVi: "Nếu không nhìn ra đường đi, đừng cố nhớ công thức: quay khối chậm, giữ trắng bên trái và chỉ tìm đúng một cạnh trước.",
    visual: { scramble: "R U R'", focusVi: "Preview bên trái là một cạnh mẫu đang lệch khỏi slot. Hãy quan sát nó trước khi bấm từng nước.", beforeVi: "Trước: cạnh mẫu chưa ở slot.", afterVi: "Sau: cạnh mẫu đã trở về vị trí." },
    video: { youtubeId: "03L3P1a0Auc", title: "How to Solve the Face Turning Octahedron (FTO)", focusVi: "Xem phần white face nếu cần quan sát thêm cách ghép ba cạnh đầu tiên." },
  },
  {
    id: "first-triple",
    titleVi: "2. Ghép một Triple",
    goalVi: "Từ một góc trắng, ghép hai tam giác cùng màu kề nó để tạo thành một nhóm hoàn chỉnh gọi là Triple.",
    holdVi: "Giữ mặt đã có ba cạnh trắng ở bên trái. Chọn một góc trắng; hai màu cạnh góc là hai màu cần tìm tiếp.",
    actionsVi: [
      "Chọn một góc trắng và gọi tên hai mặt màu sát góc đó.",
      "Tìm hai tam giác có đúng hai màu đó rồi ghép sát góc, từng mảnh một.",
      "Đặt Triple vào đúng chỗ mà không làm bung ba cạnh trắng đã xong.",
    ],
    checkVi: "Một góc trắng cùng hai tam giác lân cận tạo thành một cụm ba mảnh liền nhau.",
    moves: [guideMove("Chèn mẫu bên trái", "L' U L", "Dùng để quan sát một insert ngắn từ phía trái khi mảnh đã ở U.", "Mảnh mẫu đi vào slot phía trái; phần đã giải được giữ nguyên trong minh họa.")],
    tipVi: "Tên Triple chỉ là tên nhóm ba mảnh. Bạn không cần học thêm công thức mới trước khi biết mình đang ghép ba mảnh nào.",
    visual: { scramble: "L' U' L", focusVi: "So sánh vị trí mảnh ở preview Trước với slot khép kín ở preview Sau.", beforeVi: "Trước: mảnh mẫu chờ phía trên.", afterVi: "Sau: mảnh mẫu đã nằm trong Triple." },
    video: { youtubeId: "03L3P1a0Auc", title: "How to Solve the Face Turning Octahedron (FTO)", focusVi: "Đối chiếu đoạn tạo Triple sau khi bạn ghép được cụm đầu tiên." },
  },
  {
    id: "remaining-centers",
    titleVi: "3. Đưa ba tâm về nhà",
    goalVi: "Sau khi đã có các nhóm trắng ổn định, hoàn thiện ba tâm còn lại bằng cách theo dõi chính xác ba vị trí thay đổi.",
    holdVi: "Giữ các phần trắng đã hoàn thành ở bên trái. Trước khi xoay, chỉ ra ba tâm sai và đọc to vị trí đích của từng tâm.",
    actionsVi: [
      "Tìm tâm đang sai ở phía phải, tâm ở phía trái và tâm ở phía sau/trên.",
      "Theo dõi từng nước: mục tiêu là chỉ ba tâm này đổi chỗ theo vòng, không phải nhìn toàn bộ FTO.",
      "Nếu một tâm chưa đúng, chỉnh cách cầm rồi chạy lại minh họa thay vì đoán nước tiếp theo.",
    ],
    checkVi: "Ba tâm bạn đã gọi tên đi đúng vòng và các phần trắng giữ nguyên.",
    moves: [guideMove("Vòng ba tâm", "l R' L R l' R' L' R", "Dùng khi đã xác định rõ ba tâm cần cycle; đây là công thức minh họa 3-cycle tâm từ tutorial nhập môn.", "Ba tâm mẫu đi theo một vòng; trạng thái Sau cho thấy chúng đã về đúng chỗ.")],
    tipVi: "Bấm từng nước trước. Bạn chỉ cần nhìn ba tâm đã gọi tên, không cần cố theo toàn bộ mảnh trên khối.",
    visual: { scramble: "R' L R l R' L' R l'", focusVi: "Đây là trạng thái trước của vòng ba tâm. Bài học chỉ yêu cầu bạn quan sát ba tâm đổi chỗ.", beforeVi: "Trước: ba tâm chưa đúng vị trí.", afterVi: "Sau: ba tâm đã được trả về." },
    video: { youtubeId: "03L3P1a0Auc", title: "How to Solve the Face Turning Octahedron (FTO)", focusVi: "Chỉ dùng video để đối chiếu cách giữ orientation trong lúc xử lý tâm." },
  },
  {
    id: "last-white-corner",
    titleVi: "4. Đóng góc trắng cuối",
    goalVi: "Đưa góc trắng cuối về đúng nơi, sau đó bạn sẽ còn lại các nhóm cuối để hoàn thiện.",
    holdVi: "Đưa góc trắng cuối lên trên vị trí nó cần đi vào. Giữ các nhóm đã giải ở phía trái, tránh đổi orientation giữa chừng.",
    actionsVi: [
      "Tìm góc trắng cuối và đặt nó ngay phía trên slot đích.",
      "Quan sát công thức mẫu trước–sau một lần, rồi thử từng nước để thấy góc đổi hướng.",
      "Nếu góc vào sai chiều, quay lại bước nhận diện; không chạy công thức lặp lại một cách ngẫu nhiên.",
    ],
    checkVi: "Góc trắng cuối nằm đúng slot và các nhóm trắng trước đó vẫn còn nguyên.",
    moves: [guideMove("Đổi hướng góc mẫu", "F R' F' R", "Hedgeslammer: dùng như mẫu đổi hướng trong giai đoạn hoàn thiện góc/triple cuối.", "Góc mẫu được đổi hướng; preview Sau là trạng thái khép kín để bạn đối chiếu.")],
    tipVi: "Ở đây mục tiêu là nhận ra thay đổi của một góc. Hãy dùng nút từng nước, không cần thuộc bốn ký hiệu ngay lần đầu.",
    visual: { scramble: "R' F R F'", focusVi: "Hãy xem góc mẫu trước, rồi chạy từng nước để biết công thức tác động vào đâu.", beforeVi: "Trước: góc mẫu chưa đúng hướng.", afterVi: "Sau: góc mẫu đã được chỉnh." },
    video: { youtubeId: "J8_9no7Ml78", title: "QUICKEST FTO TUTORIAL | How to solve the Face-Turning Octahedron", focusVi: "Xem lại phần xử lý các nhóm cuối khi bạn đã tự nhận ra góc trắng cuối." },
  },
  {
    id: "finish-and-advance",
    titleVi: "5. Hoàn thiện rồi mới tăng tốc",
    goalVi: "Khi bạn đã biết thứ tự nhìn mảnh: cạnh trắng → Triple → tâm → góc trắng cuối, chuyển sang case Nautilus để giải nhanh hơn.",
    holdVi: "Giữ cách cầm quen thuộc với mặt trắng bên trái. Chỉ thay đổi cách cầm khi công thức nâng cao ghi rõ điều đó.",
    actionsVi: [
      "Lặp lại bốn bài đầu cho tới khi bạn tự nói được mục tiêu của từng bài mà không nhìn danh sách.",
      "Chọn đường Nâng cao bên dưới khi bạn nhận ra được Last Triple và Last Layer, thay vì học thuộc case từ đầu.",
      "Dùng bài luyện một tầng ở cuối trang để quen notation và thao tác ngoài trước khi bấm giờ solve đầy đủ.",
    ],
    checkVi: "Bạn biết rõ bước tiếp theo cần làm ngay cả khi chưa thuộc một công thức Nautilus nào.",
    moves: [],
    tipVi: "Nautilus là đường tăng tốc, không phải điều kiện để bắt đầu. Bạn có thể quay lại bài nhập môn bất kỳ lúc nào.",
    visual: { scramble: FTO_SOLVED_REFERENCE_ALG, focusVi: "Trạng thái hoàn chỉnh là mốc đối chiếu. Xoay 3D và tự chỉ lại nơi bạn đã làm ở từng bài.", beforeVi: "Trước: nhìn lại orientation đã học.", afterVi: "Sau: khối hoàn chỉnh là đích của lộ trình." },
    video: { youtubeId: "J8_9no7Ml78", title: "QUICKEST FTO TUTORIAL | How to solve the Face-Turning Octahedron", focusVi: "Chỉ xem như tài liệu bổ sung sau khi bạn đã biết luồng giải cơ bản." },
  },
] as const;

/** Source-backed Nautilus catalogue retained for learners who already know the beginner flow. */
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
    visual: { scramble: FTO_SOLVED_REFERENCE_ALG, focusVi: "Trạng thái solved là tham chiếu cho nhận diện. Xoay 3D để xác định lại orientation và cách cầm EIF trước khi vào case." },
    video: { youtubeId: "J8_9no7Ml78", title: "QUICKEST FTO TUTORIAL | How to solve the Face-Turning Octahedron", focusVi: "Dùng video này để ôn cách cầm và luồng giải trước khi bắt đầu các case nâng cao." },
  },
  {
    id: "last-triple",
    titleVi: "2. Last Triple · Chèn góc tốc độ",
    goalVi: "Hoàn thiện Triple cuối ở hai tầng đầu bằng insert ngắn, là cầu nối từ look-ahead sang các case tự động.",
    holdVi: "Giữ EIF: R ở phía trước. Nếu góc đang ở slot nhưng sai chiều, đưa nó ra U bằng một insert rồi đưa lại đúng chiều.",
    actionsVi: ["Nhận diện chiều của góc Triple cuối trên U.", "Chọn insert phải hoặc trái để đặt góc vào slot.", "Trong lúc insert, nhìn trước tam giác mặt trước cho bước L6X."],
    checkVi: "Góc Triple cuối vào đúng slot mà các nhóm mảnh đã giải vẫn nguyên vẹn.",
    moves: [guideMove("Insert góc từ phải", "R U' R'", "Dùng khi góc cần chèn đi vào slot theo phía R trong cách cầm EIF.", "Góc được chèn vào slot phải."), guideMove("Insert góc từ trái", "L' U L", "Dùng khi góc cần chèn đi vào slot theo phía L trong cách cầm EIF.", "Góc được chèn vào slot trái.")],
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
    moves: [guideMove("L6X · Headlights", "r U R' U' R r' L' U' L R U R'", "Dùng khi nhận diện Headlights; theo tài liệu Nautilus, đây là case hoán đổi hai mặt.", "Last layer được hoàn tác về trạng thái hoàn chỉnh."), guideMove("L6X · Cat ears", "R' U' F U' R U R' F' U R", "Dùng khi hai sticker giống nhau tạo Cat ears quanh góc nhìn thấy.", "Last layer được hoàn tác về trạng thái hoàn chỉnh.")],
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
    moves: [guideMove("L3C · Orient hai góc", "U R' F' R U' BR U R' F' R U'", "Dùng với cách cầm {L,F} khi hai góc sai chiều ở phía sau.", "Ba góc cuối trở lại trạng thái hoàn chỉnh."), guideMove("L3C · Pure two flip", "D' R' U' R B' R' B R' L R L' U R D", "Dùng với cách cầm {R,D} cho case pure two flip của L3C.", "Hai flip thuần được hoàn tác.")],
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
    visual: { scramble: FTO_SOLVED_REFERENCE_ALG, focusVi: "Trạng thái solved là đích của các case one-look. Dùng nó để luyện nhìn side stickers ở nhiều góc camera." },
    video: { youtubeId: "J8_9no7Ml78", title: "QUICKEST FTO TUTORIAL | How to solve the Face-Turning Octahedron", focusVi: "Xem lại last layer sau khi bạn nhận diện ổn định hai case L6X và L3C ở trên." },
  },
] as const;

export function ftoGuideAlgorithmCount() { return FTO_BEGINNER_GUIDE.reduce((count, step) => count + step.moves.length, 0); }
export function ftoBeginnerLessonAlgorithmCount() { return FTO_BEGINNER_LESSONS.reduce((count, step) => count + step.moves.length, 0); }
