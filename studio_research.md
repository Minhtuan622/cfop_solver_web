# Nghiên cứu tái thiết kế Studio

## Nguồn tham khảo

| Nguồn | Quan sát có thể áp dụng |
| --- | --- |
| [Evil Martians — 5 design patterns for dev tool UIs](https://evilmartians.com/chronicles/keep-it-together-5-essential-design-patterns-for-dev-tool-uis) | Context switching cần tab/active state thật rõ; toolbar chỉ đưa hành động tần suất cao lên trước; property panel dùng nhãn–giá trị nhất quán; table/record cần header phân cấp, cột ít và trạng thái hover thay vì thêm card. |
| [Creative Navy — CAD UI patterns](https://lab.interface-design.co.uk/cad-software-ui-design-patterns-benchmarking-97cc7834ad02) | Visualisation canvas phải chiếm phần lớn diện tích; toolbar icon-only chỉ phù hợp thao tác chuyên sâu và phải có ngữ cảnh/tooltip; panel trái dành cho cấu trúc/input, panel phải dành cho properties/context; các vùng hiếm dùng chuyển xuống status strip hoặc disclosure. |

## Quyết định áp dụng

Studio mới sẽ không còn là ba card đồng cấp. Nó dùng **workspace shell**: thanh lệnh mỏng theo context, navigation mode rõ, canvas Cube 3D/solver là vật thể trung tâm, left drawer dành cho input, và inspector/sheet chỉ xuất hiện theo trạng thái có dữ liệu. Kết quả CFOP hoặc BLD sẽ là record drawer toàn chiều rộng dưới canvas, có header sticky và các section tiết lộ dần; các control ít dùng được gom vào panel phụ thay vì chiếm mặt tiền.
