---
title: Composition over Inheritance
description: Vì sao composition là lựa chọn mặc định để chia sẻ hành vi, khi nào inheritance vẫn đúng, và LSP là phép thử phân định giữa hai bên như thế nào.
tags: [concept, oop, design]
category: tech-concepts
status: draft
---

# Composition over Inheritance

::: details Q: "Composition over inheritance" nghĩa là gì và vì sao nó là lựa chọn mặc định?
**Inheritance (is-a):** một subclass kế thừa một base class, thừa hưởng implementation của nó và dính coupling vào cấu trúc bên trong của nó. Cố định tại compile time.

**Composition (has-a / delegates-to):** một object nắm giữ tham chiếu tới các collaborator và ủy thác hành vi cho chúng. Các collaborator có thể được tráo đổi tại thời điểm khởi tạo, hoặc thậm chí lúc runtime.

Inheritance khớp chặt một subclass vào cha của nó — các field nội bộ, các implementation method, và mọi thay đổi mà cha thực hiện về sau. Đây chính là **fragile base class problem**: một thay đổi ở lớp cha tưởng như an toàn lại có thể âm thầm phá vỡ những subclass vốn dựa vào một chi tiết hành vi mà tác giả lớp cha chưa từng có ý định biến thành một phần của hợp đồng. Cây phân cấp càng sâu thì sự giòn gãy này càng bị khuếch đại theo cấp số nhân.

Composition tránh được cái coupling đó. Object được ủy thác chỉ phơi bày interface của nó; object ủy thác không hề biết gì về phần bên trong của nó. Bạn có thể thay bằng một implementation khác (DIP), mở rộng hành vi bằng cách bọc lại (OCP), và kiểm thử từng mảnh một cách tách biệt.

**Quan hệ với SOLID:** composition + interface hẹp chính là *cách bạn thực sự đạt được* DIP và OCP trong thực tế. Những cây inheritance sâu thường xuyên vi phạm LSP — buộc phải dùng những chốt kiểm tra `instanceof` và những override làm rỗng ruột hành vi của cha.
:::

::: details Q: Khi nào inheritance vẫn là lựa chọn đúng?
Inheritance được biện minh khi **cả hai** điều kiện đều thỏa:

1. **Quan hệ is-a thật sự và ổn định:** subtype thực sự là một chuyên biệt hóa của base type — chứ không đơn thuần là thứ tình cờ chia sẻ implementation với nó. "Một savings account *là* một account" có thể đúng; "một stack *là* một vector" (một sai lầm lịch sử của Java) thì không.
2. **LSP thỏa mãn:** mọi thao tác hợp lệ trên base type đều hoạt động đúng trên subtype, không có việc nới lỏng postcondition hay siết chặt precondition một cách bất ngờ. Nếu bạn cần override một method để nó ném exception hoặc chẳng làm gì (no-op), đó là dấu hiệu quan hệ is-a là giả.

**Framework template method** là một cách dùng chính đáng: framework định nghĩa khung xương của một thuật toán và để lại các bước cho subclass. Nhưng ngay cả ở đây, số tầng cũng nên nông (≤2–3 tầng trong thực tế).

Sai lầm phổ biến là dùng inheritance để *tái sử dụng* — kéo logic dùng chung lên một base class chỉ vì cả hai class tình cờ đều cần nó. Đó chính là việc của composition.
:::

::: details Q: Đâu là những đánh đổi?
**Chi phí của composition:**
- Nối dây nhiều hơn — bạn phải khởi tạo và inject collaborator một cách tường minh thay vì lấy chúng qua `super()`.
- Gián tiếp nhiều hơn — lần theo một lệnh gọi qua một chuỗi các object ủy thác khó đọc hơn một cây phân cấp class tuyến tính.
- Nhiều boilerplate hơn ở những ngôn ngữ không có trait hay mixin — bạn có thể phải viết những method chuyển tiếp mỏng.

**Chi phí của inheritance:**
- Fragile base class problem — lớp cha tiến hóa làm hỏng subclass một cách âm thầm.
- Cấu trúc cứng nhắc — bạn không thể đổi quan hệ "kế thừa từ" lúc runtime, nên không thể thích ứng theo cấu hình hay input của người dùng.
- Vấn đề đa kế thừa (diamond problem) ở những ngôn ngữ cho phép nó; ngay cả đơn kế thừa cũng có thể tạo ra những cây phân cấp rối rắm.
- Vi phạm LSP thì dễ và không bị bắt tại compile time — dẫn tới logic điều kiện `instanceof` rải rác khắp các caller.

**Heuristic thực dụng:** mặc định chọn composition. Chỉ với tới inheritance khi bạn có thể diễn đạt rõ quan hệ is-a và kiểm chứng được LSP. Chi phí nối dây của composition gần như luôn xứng đáng với tính linh hoạt và khả năng kiểm thử mà nó mang lại.
:::

::: details Q: Các design pattern thể hiện "composition over inheritance" như thế nào?
Một số pattern GoF kinh điển là biểu hiện cụ thể của nguyên tắc này:

| Pattern | Cách nó dùng composition |
|---|---|
| **Strategy** | Thuật toán được tráo lúc runtime qua một interface được inject; không cần subclass |
| **Decorator** | Bọc một object để thêm hành vi; wrapper nắm giữ một tham chiếu, không kế thừa |
| **Adapter** | Dịch một interface sang interface khác bằng cách nắm giữ adaptee, không mở rộng nó |
| **Composite** | Xử lý object đơn lẻ và tập hợp một cách đồng nhất qua một interface dùng chung |
| **Observer** | Tách nguồn sự kiện khỏi các listener; listener được inject, không dính coupling qua inheritance |

Những pattern này không né tránh abstraction — chúng chuyển abstraction từ cây phân cấp class vào đồ thị object và interface. Kết quả vẫn là khả năng mở rộng như OCP hứa hẹn, mà không mang theo sự giòn gãy vốn có của inheritance.
:::

::: details Q: Góc nhìn senior — phép thử LSP là gì?
**LSP là phép thử để xác định liệu một quan hệ inheritance có chính đáng hay không.**

Hãy tự hỏi: mọi chỗ đang dùng một `Base` có thể được đưa cho một `Derived` mà vẫn hoạt động đúng không — không cần kiểm tra thêm, không có no-op bất ngờ, không có bảo đảm nào bị nới lỏng? Nếu có, inheritance là an toàn. Nếu không, bạn có một quan hệ is-a chỉ tồn tại trên danh nghĩa.

Những vi phạm LSP thường gặp cần nhận ra ngay lập tức:
- `override` ném ra `UnsupportedOperationException` (sai lầm `Stack extends Vector` của Java)
- Subclass nới rộng precondition theo cách mà caller không lường trước
- Subclass gỡ bỏ một bảo đảm (ví dụ postcondition rằng một collection đã được sắp xếp)

Khi LSP bị vi phạm, caller phải bù đắp bằng những phép kiểm tra `instanceof` — một dấu hiệu đáng tin cậy. Đến lúc đó, inheritance chỉ đang cung cấp coupling mà không đem lại lợi ích thay thế được vốn là điều biện minh cho nó. Hãy refactor sang composition: base trở thành một interface, mỗi subclass cũ trở thành một implementation độc lập.

Xem thêm: [SOLID & OOP](./solid-and-oop).
:::

## Câu hỏi đào sâu thường gặp

- Mixin và trait (Ruby, Rust, Scala) thay đổi cán cân đánh đổi như thế nào — chúng là "composition" hay là một dạng "inheritance" an toàn hơn?
- Decorator pattern khác với việc subclass để mở rộng ở điểm nào, và khi nào mỗi cách trở nên cồng kềnh?
- Vấn đề "fragile base class" cụ thể hơn là gì, và vì sao binary compatibility làm nó tệ hơn trong code thư viện?
- Việc Go không có inheritance (thỏa mãn interface theo quy ước) khẳng định hay thách thức nguyên tắc này trong thực tế như thế nào?
