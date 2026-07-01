---
title: Cohesion & Coupling
description: Hai thước đo nền tảng mà SOLID, DRY và mọi nguyên tắc về modularity rốt cuộc đều phục vụ — và vì sao bạn không thể (và không nên) kéo cả hai về không.
tags: [concept, oop, design]
category: tech-concepts
status: draft
---

# Cohesion & Coupling

::: details Q: Cohesion và coupling là gì?
**Cohesion** đo mức độ *tập trung* của một module — liệu các trách nhiệm của nó có thuộc về nhau qua một mục đích duy nhất, rõ ràng hay không. Một module có cohesion cao làm tốt một việc; mọi thứ bên trong nó đều phục vụ cho việc đó.

**Coupling** đo mức độ *phụ thuộc* của module này vào module khác — nó biết bao nhiêu về phần bên trong của module kia, đặt bao nhiêu giả định về cấu trúc hay hành vi của module đó.

Mục tiêu luôn là: **cohesion cao, coupling thấp**. Một module có cohesion cao thì dễ hiểu, dễ kiểm thử và dễ thay đổi một cách tách biệt. Coupling thấp nghĩa là một thay đổi trong module này không lan sang những module khác.

Hai khái niệm này liên đới với nhau: cohesion kém thường ép coupling tăng cao. Một module với các trách nhiệm rải rác thường phải với tay sang nhiều module khác để làm tròn tất cả chúng.
:::

::: details Q: Vì sao cohesion và coupling là mục tiêu nền tảng đằng sau SOLID, DRY và modularity?
Mọi nguyên tắc nổi tiếng đều là một *chiến thuật cụ thể* để đạt được cohesion cao và coupling thấp:

| Nguyên tắc | Nó làm gì, xét theo hai khái niệm này |
|---|---|
| **SRP** | Đẩy cohesion — một lý do để thay đổi = một trách nhiệm tập trung |
| **ISP** | Đẩy cohesion cho interface — client không dính coupling vào những method chúng không dùng |
| **DIP** | Cắt coupling — module cấp cao phụ thuộc vào abstraction ổn định, không phải concretion hay biến động |
| **OCP** | Giữ coupling thấp — việc mở rộng diễn ra mà không sửa (và do đó không dính coupling vào) code cũ |
| **DRY** | Giảm coupling — một sự thật bị lặp lại nghĩa là hai chỗ phải thay đổi cùng nhau; một nguồn sự thật duy nhất cắt đứt phụ thuộc ngầm đó |
| **Modularity / thiết kế package** | Cả hai — package có cohesion nội bộ cao và ít phụ thuộc liên-package thì triển khai độc lập được và dễ hiểu |

Nắm được điều này cho phép bạn suy luận *vì sao* một nguyên tắc lại phù hợp trong một tình huống cụ thể, thay vì áp dụng nó một cách rập khuôn. "Mình có nên tách cái này ra không?" → nó giảm coupling hay tăng cohesion, hay mình chỉ đang dời code loanh quanh?

Xem thêm: [SOLID & OOP](./solid-and-oop).
:::

::: details Q: Đâu là những smell chính ở mỗi đầu của phổ?
Cách phân loại kinh điển (Constantine) đặt cả hai lên một thang mà bạn chỉ cần nhận ra ở hai thái cực: cohesion chạy từ *coincidental → … → functional* (functional = tốt — mọi thứ phục vụ một mục đích), còn coupling chạy từ *content/tight → … → data/message* (data/message = tốt — các module chỉ chia sẻ đúng những gì buộc phải chia sẻ). Hãy gọi tên cái smell, đừng gọi tên nấc thang:

**Coupling quá nhiều:**

- *Change amplification / shotgun surgery* — đổi một thứ mà phải động vào 5 file trong 3 module. Các module này dính coupling ngầm với nhau qua tri thức dùng chung.
- *Divergent change* — một module đơn lẻ thay đổi vì nhiều lý do khác nhau (nhu cầu của những caller khác nhau). Triệu chứng của cohesion thấp, thứ ép coupling phình ra.
- *Khó unit-test tách biệt* — nếu bạn không thể khởi tạo một class mà không phải dựng lên nửa hệ thống, thì coupling đang quá cao. Testability là một chỉ báo đáng tin cậy.
- *Feature envy* — một method với vào dữ liệu của object khác nhiều hơn dữ liệu của chính nó; method đó thuộc về object kia.

**Decoupling quá mức:**

- *Event soup* — mọi thứ giao tiếp qua một event bus hay pub/sub chung chung; muốn lần theo một luồng dữ liệu phải truy vết qua 10 subscriber. Decoupled nhưng không đọc nổi.
- *Gián tiếp thái quá* — 4 tầng interface + adapter + factory + proxy cho một lệnh gọi HTTP mỏng manh. Chi phí abstraction vượt quá bất kỳ tính linh hoạt nào thu được.

Vị trí đúng trên phổ phụ thuộc vào cách code thực sự thay đổi — không phải vào một lý tưởng trừu tượng.
:::

::: details Q: Có thể kéo coupling về không được không? Có nên không?
Không, và không. **Essential coupling** là thứ không thể tránh: một caller buộc phải biết *một điều gì đó* về thứ nó gọi — tối thiểu là một interface contract. Mục tiêu là dính coupling vào những thứ *ổn định, trừu tượng* (interface, protocol, value type) thay vì những thứ *hay biến động, cụ thể* (chi tiết implementation, trạng thái nội bộ).

**Chi phí của over-decoupling là có thật:**
- Gián tiếp khiến luồng điều khiển khó lần theo. Debug một chuỗi 6 collaborator trừu tượng khó hơn đọc 40 dòng code trực tiếp.
- Mỗi abstraction là thêm một bề mặt phải bảo trì, kiểm thử và tài liệu hóa.
- Event bus chung chung hay hệ thống plugin khiến những thao tác đọc đơn giản trở nên đắt đỏ.

**Cohesion có một sự căng thẳng với khả năng tái sử dụng.** Một module tập trung đến mức chỉ làm đúng một việc có thể quá hẹp để tái dùng ở nơi khác; một module rộng hơn một chút có thể phục vụ ba caller mà vẫn không mất mạch lạc. Đây là một đánh đổi thực sự — hãy nhắm tới *functional cohesion* (mọi thứ phục vụ một mục đích) nhưng đừng đập vỡ một đơn vị vốn cohesion tự nhiên chỉ để thỏa mãn một nguyên tắc trừu tượng.

Phép thử: một thành viên mới trong team có hiểu được module này mà không cần đọc các collaborator của nó không? Có kiểm thử nó mà không cần chúng không?
:::

::: details Q: Trong thực tế, làm sao cải thiện cohesion và coupling?
**Các nước đi refactoring cho cohesion kém:**
- *Extract Class / Extract Function* — khi một class có hai mối quan tâm, tách chúng ra. Đặt tên class mới theo mục đích duy nhất của nó.
- *Move Method/Field* — nếu một method dùng dữ liệu của class khác nhiều hơn của chính nó, nó thuộc về đó.

**Các nước đi refactoring cho coupling cao:**
- *Đưa vào một interface / protocol* — phụ thuộc vào hành vi, không phải kiểu cụ thể.
- *Thay inheritance bằng composition* — composition cho phép bạn tráo dependency tại thời điểm khởi tạo; inheritance khóa cứng chúng.
- *Event / observer pattern* — tách nguồn của một thay đổi trạng thái ra khỏi những bên tiêu thụ, khi các bên tiêu thụ thực sự độc lập với nhau.

**Một heuristic thực dụng:** vẽ một dependency graph cho các module của bạn. Mỗi mũi tên là một coupling. Các mũi tên nên chảy theo *một chiều* (acyclic), và *hướng về phía ổn định* (các module ổn định, trừu tượng nằm ở nền). Chu trình (cycle) và mũi tên đi từ ổn định sang biến động là những mục tiêu chính cần xử lý.
:::

## Câu hỏi đào sâu thường gặp

- Connascence là gì, và nó cho ta một bộ từ vựng chính xác hơn để nói về độ mạnh của coupling như thế nào?
- Cohesion ở cấp package/module quy mô lớn (Reuse/Release Equivalence, Common Closure principles) phản chiếu SRP ở cấp class ra sao?
- Khi nào temporal coupling (A phải được gọi trước B) mới là vấn đề thực sự, và làm sao để loại bỏ nó?
- Ranh giới microservice phản ánh những quyết định về cohesion/coupling như thế nào — và điều gì hỏng khi chúng không phản ánh đúng?
