---
title: SOLID & OOP
description: Năm nguyên tắc SOLID hợp thành một hệ thống chặt chẽ — không phải một checklist — để đạt cohesion cao, coupling thấp và code OO dễ thay đổi.
tags: [concept, oop, design]
category: tech-concepts
status: draft
---

# SOLID & OOP

::: details Q: SOLID liên quan thế nào tới OOP?
SOLID (Martin, những năm 2000) là tập hợp năm nguyên tắc thiết kế, đưa các trụ cột của OOP — đặc biệt là **abstraction** và **polymorphism** — vào vận hành thực tế, tất cả hướng tới một mục tiêu: code rẻ để thay đổi.

OOP cho bạn class, inheritance và polymorphism như những cơ chế. SOLID nói cho bạn biết *cách sắp xếp* những cơ chế đó sao cho:
- mỗi đơn vị chỉ có một lý do để thay đổi (cohesion)
- các đơn vị phụ thuộc vào nhau càng ít và càng trừu tượng càng tốt (coupling thấp)
- việc mở rộng không đòi hỏi phải sửa code sẵn có

| Nguyên tắc | Một câu tóm gọn |
|---|---|
| **S**RP | Một class, một lý do để thay đổi |
| **O**CP | Mở cho việc mở rộng, đóng với việc sửa đổi |
| **L**SP | Subtype phải thay thế được cho base type của nó |
| **I**SP | Ưu tiên interface hẹp, đặc thù cho từng client thay vì interface to và tổng quát |
| **D**IP | Phụ thuộc vào abstraction, không phải concretion |

Bảng đó là bối cảnh, không phải câu trả lời. Câu trả lời nằm ở cách chúng bổ trợ lẫn nhau.
:::

::: details Q: Năm nguyên tắc bổ trợ cho nhau như thế nào?
Chúng là một **mạng lưới**, không phải một danh sách.

**Về phía cohesion — SRP và ISP là cùng một ý tưởng ở hai mức độ chi tiết khác nhau.**
SRP nói rằng một class chỉ nên có một lý do để thay đổi. ISP nói rằng một interface chỉ nên phơi bày đúng những gì client cần. Cả hai đều đẩy cohesion lên: đơn vị nhỏ hơn, tập trung hơn, mà phần bên trong có thể tiến hóa mà không lan ra ngoài.

**Về phía extensibility — OCP *được kích hoạt bởi* DIP + LSP + polymorphism.**
"Đóng với việc sửa đổi, mở cho việc mở rộng" nghe có vẻ luẩn quẩn cho tới khi bạn thấy cơ chế đằng sau: bạn chỉ có thể mở rộng mà không sửa nếu code của bạn vốn đã phụ thuộc vào một *abstraction* (DIP) mà các implementation của nó có thể tráo đổi thoải mái (LSP). Bỏ đi một trong hai thì OCP sụp đổ — bạn chắc chắn sẽ phải mở code cũ ra để thêm một trường hợp mới.

**LSP là thứ khiến polymorphism trở nên an toàn.** Một subtype vi phạm hợp đồng của base type không chỉ phá vỡ khả năng thay thế; nó còn phá vỡ OCP (bạn phải thêm một phép kiểm tra `instanceof` ở phía caller) và làm suy yếu DIP (abstraction không còn đáng tin nữa). LSP là *điều kiện đúng đắn* mà phần còn lại dựa vào.

**DIP là mấu chốt.** Việc đảo ngược các phụ thuộc lên những abstraction ổn định chính là thứ khiến OCP và ISP *khả thi ở quy mô lớn*. Không có DIP, module cấp cao phụ thuộc vào những chi tiết hay biến động; mọi thay đổi ở module cấp thấp đều lan ngược lên trên. DIP cắt đứt chuỗi lan truyền đó.

Bức tranh tổng thể: SRP/ISP lo về *cohesion* (cái gì nên đi cùng nhau); DIP/OCP/LSP lo về *hướng phụ thuộc và khả năng mở rộng*. Gộp lại, chúng mô tả một hệ thống với các đường ghép ổn định, mà dọc theo đó việc thay đổi trở nên rẻ.
:::

::: details Q: Mục tiêu thật sự mà SOLID phục vụ là gì?
**Quản lý sự thay đổi và phụ thuộc.** Thước đo là: khi yêu cầu X thay đổi, tôi phải động vào bao nhiêu file, và mức độ an toàn ra sao?

SOLID là một *phương tiện*; mục đích cuối cùng là:
- **Testability** — cohesion cao + coupling thấp → các đơn vị có thể kiểm thử tách biệt
- **Replaceability** — DIP + LSP → tráo một implementation mà không đụng tới caller
- **Extensibility** — OCP → thêm hành vi bằng code mới, không phải sửa code cũ

Nếu những kết quả đó vốn đã hiện diện trong codebase — có thể nhờ phong cách functional, nhờ composition được thiết kế tốt, hay đơn giản là những hàm nhỏ, đặt tên rõ ràng — thì áp thêm SOLID lên trên chỉ tổ thêm nghi thức mà chẳng đem lại giá trị gì.

Xem thêm: [Cohesion & Coupling](./cohesion-coupling).
:::

::: details Q: SOLID có phải là luật không? Khi nào nó gây hại?
Chúng là **heuristic được hiệu chỉnh theo một trục thay đổi cụ thể**. Áp dụng một cách máy móc, chúng tạo ra:

- **Interface đẻ non** — ISP + DIP áp dụng trước khi bạn biết có những caller nào sẽ dẫn tới những interface sai ngay từ đầu và tốn kém để chỉnh sửa.
- **Thiên văn học abstraction** — OCP + DIP chồng chất không kiềm chế → các tầng gián tiếp lớp chồng lớp (5 file interface cho một lệnh gọi HTTP) làm hại khả năng đọc hiểu còn nhiều hơn cả cái bất ổn mà nó phòng tránh.
- **SRP đẩy quá xa** — tách class mỗi khi nó "có hai mối quan tâm" làm vụn vỡ logic vốn liên quan ra nhiều file; hành vi mạch lạc trở nên khó lần theo.

Quy tắc thực dụng: áp dụng SOLID *dọc theo trục mà code thực sự thay đổi*, không phải ở mọi nơi nó *có thể* thay đổi. YAGNI vẫn đúng. Mỗi abstraction đều có chi phí gánh vác — thêm gián tiếp, thêm file, khó điều hướng hơn. Chỉ trả chi phí đó khi tính linh hoạt là cụ thể và cần trong tương lai gần.

Dấu hiệu của over-engineering: một thay đổi về yêu cầu lại đòi hỏi sửa *nhiều* file hơn so với thiết kế ngây thơ ban đầu.
:::

::: details Q: SOLID liên quan thế nào tới các trụ cột OOP và tới các lựa chọn thay thế (composition, FP)?
**Với các trụ cột OOP:** SOLID dựa vào *abstraction* (interface ổn định làm đơn vị phụ thuộc) và *polymorphism* (implementation có thể tráo đổi) nhiều hơn hẳn so với inheritance. Encapsulation hỗ trợ SRP. Inheritance phần lớn là không liên quan — và khi bị lạm dụng, nó chống lại LSP.

**Composition over inheritance:** nhiều kết quả của SOLID đạt được gọn gàng hơn thông qua composition — lắp ghép các object với những hành vi nhỏ, tập trung — hơn là qua các cây phân cấp class. Composition + interface hẹp (ISP + DIP) đem lại OCP mà không mắc phải vấn đề fragile base class vốn đi kèm với những cây inheritance sâu.

**Functional programming:** FP đạt coupling thấp bằng một con đường khác — pure function, dữ liệu immutable, truyền hành vi như giá trị. DIP ≈ truyền một hàm (dependency) làm tham số; OCP ≈ higher-order function mở rộng hành vi mà không sửa đổi. Nguyên tắc chung vẫn thế: *tách cái hay thay đổi ra khỏi cái ổn định*.

SOLID không phải là giáo điều độc quyền của OOP. Nó chỉ là một bộ từ vựng để diễn đạt mục tiêu phổ quát: các đơn vị dễ thay đổi, dễ kiểm thử, và triển khai độc lập được.

Xem thêm: [Composition over Inheritance](./composition-over-inheritance).
:::

## Câu hỏi đào sâu thường gặp

- Khi hai nguyên tắc SOLID xung đột (ví dụ SRP muốn tách ra, còn OCP lại muốn đặt đường ghép ở chỗ khác), bạn quyết định thế nào?
- Dependency Injection pattern liên quan thế nào tới DIP, và khi nào một DI container là thừa thãi?
- "Stable abstraction" nghĩa là gì, và Stable Dependencies Principle (SDP) mở rộng SOLID lên tới cấp package ra sao?
- Bạn giải thích thế nào về những đánh đổi của SOLID cho một team muốn đi nhanh và né tránh nghi thức?
