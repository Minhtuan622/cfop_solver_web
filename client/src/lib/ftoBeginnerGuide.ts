export type FtoGuideMove = { labelVi: string; algorithm: string; useVi: string };
export type FtoGuideStep = { id: string; titleVi: string; goalVi: string; holdVi: string; actionsVi: readonly string[]; checkVi: string; moves: readonly FtoGuideMove[]; tipVi: string };

export const FTO_BEGINNER_GUIDE: readonly FtoGuideStep[] = [
  {
    id: "orient",
    titleVi: "1. Cầm khối và đọc màu",
    goalVi: "Thiết lập một cách cầm khối cố định trước khi bắt đầu. Điều này giúp mọi công thức có cùng ý nghĩa.",
    holdVi: "Đặt một mặt bạn chọn ở trên và gọi là U. Nhìn thẳng vào một mặt kề cạnh với U, gọi là F. Các mặt còn lại được gọi theo vị trí R, L, B, BR, BL và D.",
    actionsVi: ["Chọn một màu làm mặt U và giữ nguyên trong toàn bộ lượt giải.", "Đọc dấu nháy từ phía đối diện trực tiếp với mặt đang xoay: F' là xoay ngược chiều kim đồng hồ khi nhìn vào F.", "Chưa cần dùng slice chữ thường trong bước đầu."],
    checkVi: "Bạn có thể chỉ đúng U, F, R, L và D mà không đổi cách cầm khối.",
    moves: [],
    tipVi: "FTO có tám mặt tam giác; không thể áp trực tiếp tư duy mặt vuông của 3×3 lên các cạnh kề nhau.",
  },
  {
    id: "up-edges",
    titleVi: "2. Ghép ba cạnh của mặt U",
    goalVi: "Tạo một tam giác gồm ba cạnh cùng màu quanh mặt U. Đây là “neo” cho phần còn lại.",
    holdVi: "Giữ mặt đã chọn ở U. Dùng màu của U làm màu dẫn đường.",
    actionsVi: ["Tìm ba mảnh cạnh có màu U.", "Đưa lần lượt chúng về ba cạnh của U bằng các xoay lớp ngoài trực quan.", "Mỗi khi ghép được một cạnh, đối chiếu màu thứ hai của nó với các mảnh đỉnh kề bên để kiểm tra thứ tự."],
    checkVi: "Ba cạnh quanh U có màu U và màu bên hông khớp theo thứ tự với các đỉnh xung quanh.",
    moves: [],
    tipVi: "Đừng chỉ nhìn màu U: một cạnh đúng màu nhưng sai thứ tự sẽ gây khó ở bước chèn cạnh giữa.",
  },
  {
    id: "middle-edges",
    titleVi: "3. Chèn các cạnh còn lại",
    goalVi: "Giải các cạnh tầng giữa mà không phá ba cạnh đã hoàn thành quanh U.",
    holdVi: "Đặt ba cạnh U đã giải ở phía trên. Xoay D để đưa cạnh cần chèn ở tầng dưới vào đúng hướng setup.",
    actionsVi: ["Dùng D để đặt cạnh tầng dưới vào vị trí chuẩn bị.", "Chọn một trong hai công thức chèn theo vị trí đích; sau mỗi lần chèn, kiểm tra lại tam giác U.", "Lặp lại để lấp tầng giữa. Ba cạnh cuối thường chỉ cần xoay D để khớp."],
    checkVi: "Mười hai cạnh đều khớp hai màu với hai vùng lân cận; U vẫn nguyên vẹn.",
    moves: [{ labelVi: "Chèn từ DL vào FR", algorithm: "R' D R", useVi: "Dùng khi cạnh cần chèn ở DL và đích là FR." }, { labelVi: "Chèn từ DR vào FL", algorithm: "L D' L'", useVi: "Dùng khi cạnh cần chèn ở DR và đích là FL." }],
    tipVi: "Nếu một cạnh tầng giữa sai, hãy dùng công thức chèn để đẩy nó xuống trước, rồi chèn lại đúng cách.",
  },
  {
    id: "vertices",
    titleVi: "4. Đặt rồi lật các mảnh đỉnh",
    goalVi: "Đưa sáu mảnh đỉnh về đúng vị trí trước, sau đó xử lý chiều của chúng.",
    holdVi: "Để U ở trên. Xoay cả khối nếu cần để vùng cần sửa nằm trong bộ ba vị trí của công thức.",
    actionsVi: ["Trước hết chỉ quan tâm mảnh đỉnh đang ở đúng vị trí, chưa cần đúng chiều.", "Dùng 3-cycle để đưa một đỉnh đúng vị trí mà không phá các đỉnh đã cố định.", "Khi tất cả đã đúng vị trí, đưa hai đỉnh cần lật cạnh nhau, thực hiện công thức lật, rồi hoàn tác setup nếu có."],
    checkVi: "Mỗi đỉnh vừa đúng vị trí vừa có ba màu hướng về đúng mặt tương ứng.",
    moves: [{ labelVi: "3-cycle UR → UL → LR", algorithm: "R U' R' U", useVi: "Dùng để đưa đỉnh theo chiều thứ nhất." }, { labelVi: "3-cycle UB → UR → LR", algorithm: "R U R' U'", useVi: "Dùng để đưa đỉnh theo chiều thứ hai." }, { labelVi: "Lật cặp đỉnh kề nhau", algorithm: "R' U L' U' L U' R U", useVi: "Đưa hai đỉnh sai chiều về vị trí kề nhau trước khi thực hiện." }],
    tipVi: "Đỉnh đối diện có thể được biến thành cặp kề bằng một setup move, lật cặp, rồi undo setup move.",
  },
  {
    id: "centres",
    titleVi: "5. Hoàn thiện các tâm",
    goalVi: "Sắp xếp các mảnh tâm còn lại mà không làm hỏng cạnh và đỉnh đã giải.",
    holdVi: "Chọn một tâm sai đang nằm ở L nhưng thuộc màu U. Dùng L và U để đưa hai tâm sai vào lớp r sát R.",
    actionsVi: ["Đặt tâm sai của màu U trên mặt L vào vị trí bên phải của lớp r.", "Đưa một tâm sai khác trên U vào vị trí kề trong lớp r.", "Thực hiện chuỗi hoán vị năm lần, sau đó hoàn tác các setup move U/L nếu đã dùng.", "Lặp cho đến khi mọi mặt đồng màu ở phần tâm."],
    checkVi: "Tất cả tâm cùng màu với mặt của chúng; cạnh và đỉnh vẫn giữ đúng vị trí.",
    moves: [{ labelVi: "Hoán vị tâm", algorithm: "(r U r' U') × 5", useVi: "r là lớp giữa song song với R; lặp trọn chuỗi năm lần." }],
    tipVi: "Nếu một vòng làm sai nhiều hơn dự kiến, dừng lại và hoàn tác ngay setup/chuỗi vừa làm; cách cầm là phần quan trọng của bước này.",
  },
  {
    id: "finish",
    titleVi: "6. Kiểm tra và tăng tốc dần",
    goalVi: "Xác nhận khối hoàn chỉnh và biến phương pháp thành thói quen thay vì học thuộc rời rạc.",
    holdVi: "Giữ nguyên orientation ban đầu cho đến lúc kiểm tra xong.",
    actionsVi: ["Kiểm tra từng mặt: ba tâm, ba cạnh và ba vùng của đỉnh đều phải đồng màu theo mặt.", "Nếu còn lỗi, quay lại đúng nhóm mảnh: cạnh trước, đỉnh sau, rồi tâm.", "Khi giải được chậm nhưng ổn định, chuyển sang bài luyện single-layer để thuộc chiều xoay và các công thức chèn."],
    checkVi: "Tám mặt đều đồng màu và không có công thức nào bị thực hiện khi chưa xác định mục tiêu.",
    moves: [],
    tipVi: "Tốc độ đến từ nhìn trước bước kế tiếp; ở giai đoạn đầu, ưu tiên một lần giải đúng hơn là thời gian ngắn.",
  },
] as const;

export function ftoGuideAlgorithmCount() { return FTO_BEGINNER_GUIDE.reduce((count, step) => count + step.moves.length, 0); }
