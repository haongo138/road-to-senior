---
title: Sử dụng AI trong Kỹ thuật
description: Cách bạn dùng AI như một người phản biện thiết kế và để kiểm thử áp lực — chứ không chỉ là công cụ sinh code. Những ý trả lời ở tầm senior về các chế độ hư hỏng, bug âm thầm, và second-order effects.
tags: [behavioral, ai]
category: behavioral
status: draft
---

# Sử dụng AI trong Kỹ thuật

Một nhóm câu hỏi khá mới trong các buổi phỏng vấn senior/staff đào sâu vào *cách* bạn thực sự dùng AI mỗi ngày — cụ thể là bạn dùng nó để **sinh code**, hay để **kiểm thử áp lực tư duy của chính mình**. Thứ họ đánh giá: khả năng phán đoán kỹ thuật, việc bạn có lái được AI với đủ ngữ cảnh để moi ra câu trả lời không chung chung hay không, và liệu bạn có còn làm chủ được thiết kế không (AI là công cụ, không phải tác giả).

Khác với các trang STAR-L, đây chủ yếu là những câu hỏi mang tính chiêm nghiệm — hãy trả lời ở ngôi thứ nhất với ví dụ cụ thể từ hệ thống của chính bạn. Các ý trả lời dưới đây được rút ra từ chính những dự án ví dụ trong [Vấn đề kỹ thuật khó nhất](./hardest-technical-problem) (một vault claim phần thưởng blockchain, tính năng tip crypto trên Discord, một charting indexer, một maintenance microservice). Hãy thay bằng ví dụ của riêng bạn.

## Cách bạn dùng AI

### Bạn dùng AI thiên về một trợ lý viết code, hay thiên về một người phản biện / kiểm thử áp lực?

- Cả hai, nhưng **đòn bẩy nằm ở vai trò phản biện/kiểm thử áp lực**. Việc sinh code tiết kiệm vài phút; một lỗ hổng thiết kế được bắt sớm tiết kiệm nhiều ngày.
- Cụ thể: tôi tự phác thảo thiết kế, rồi dùng AI như một đối thủ — *"đây là luồng claim của tôi chạy trên một vault có số dư cố định, nó sẽ vỡ ở đâu khi có nhiều request đồng thời?"* Đó là cách các vấn đề idempotency và lỗ hổng atomic-update lộ ra trước khi kịp lên production.
- Phần sinh code thì tôi chủ yếu dùng cho boilerplate và những API lạ, và luôn review lại. Tôi không bao giờ để nó tự quyết một money path mà mình không đọc qua.

### Nếu một kỹ sư chỉ dùng AI để sinh code chứ không bao giờ dùng nó để kiểm thử áp lực thiết kế, thì họ đang bỏ lỡ điều gì?

- Họ đang dùng AI cho **phần rẻ tiền**. Sinh code chỉ rút ngắn khâu gõ phím; phần đắt giá, đúng chất senior, là quyết định xây *cái gì* và tìm ra nó vỡ ở *chỗ nào* — điều kiện đồng thời, hư hỏng một phần, thứ tự, observability.
- Họ ship nhanh hơn tới con bug đầu tiên, chứ không phải tới một hệ thống bền vững. Giá trị lớn nhất của AI là một người bạn đồng hành để kiểm thử áp lực khả năng phán đoán của mình — và họ đang bỏ phí đúng điều đó.

## Dùng AI để làm cứng cáp một thiết kế

### Khi thiết kế một backend/hệ thống, bạn nhờ AI soi lỗi ở những lớp nào — dữ liệu, đồng bộ, race conditions, vòng đời, hay observability?

- Những lớp mà bug **âm thầm mà lại đắt giá**, chứ không phải chỗ trình biên dịch vốn đã lo giúp: tính nhất quán dữ liệu (một dual-write giữa Postgres và chuỗi), điều kiện đồng thời/races (read-modify-write trên một số dư), vòng đời/thứ tự (một retry đến *sau* một timeout), và observability (*liệu tôi có nhìn thấy được lúc nó hư không?*).
- Tôi hỏi thẳng *"chuyện gì xảy ra khi hư hỏng một phần, khi retry, hay khi có nhiều caller cùng lúc?"* — đó đúng là những câu mà tôi kém nhất trong việc tự đều đặn đặt ra cho mình.
- Nó ít hữu ích hơn với logic nghiệp vụ thuần túy và chuyện đặt tên — vì nó không hiểu miền nghiệp vụ.

### Với các hệ thống tài chính/giao dịch, AI đặc biệt giỏi giúp bạn phát hiện những chế độ hư hỏng nào?

- Double-spend / double-claim khi có đồng thời, exactly-once so với at-least-once trong việc dịch chuyển tiền, idempotency của các retry, rút vượt một pool cố định, làm tròn/độ chính xác, và trôi dạt reconciliation giữa hai hệ thống lưu trữ chuẩn.
- Nó rất mạnh trong việc liệt kê hết các khả năng *"nếu cái này chạy hai lần / một phần / sai thứ tự thì sao"* — chính là bề mặt hư hỏng đặc trưng của mảng tài chính.
- **Lưu ý:** nó không thể nói cho tôi ngưỡng chấp nhận của nghiệp vụ (chênh lệch 1 đơn vị có chấp nhận được không? một claim bắt buộc phải exactly-once hay at-least-once + reconciliation là ổn?). Sự phán đoán đó là của tôi.

### AI có giúp bạn truy vết second-order effects tốt hơn không?

- Có, *khi tôi chủ động yêu cầu*. Nó giỏi câu *"nếu tôi đổi X thì những chỗ nào đang ngầm dựa vào X?"* — đổi một serializer, biến một lời gọi thành đồng bộ, hay thêm một retry cho thứ mà phía downstream vốn không idempotent.
- Nó nới rộng phạm vi tìm kiếm. Tôi vẫn kiểm chứng lại, vì nó cũng sẵn sàng tự tin bịa ra những tác động chẳng hề tồn tại trong hệ thống của tôi.

### Đã bao giờ AI hỏi ngược lại một câu khiến bạn thay đổi thiết kế chưa?

::: details Ví dụ (điều chỉnh theo trải nghiệm của bạn)
Khi thiết kế luồng claim phần thưởng, tôi mô tả việc đánh dấu một claim là `settled` ngay lúc gửi giao dịch on-chain. Mô hình hỏi ngược lại: *"Cái gì xác nhận giao dịch thật sự đã hoàn tất on-chain trước khi bạn đánh dấu settled — và chuyện gì xảy ra nếu tiến trình của bạn chết ngay giữa lúc submit và lúc ghi?"*

Chỉ riêng câu hỏi đó đã định hình lại toàn bộ thiết kế. Tôi vốn coi Postgres và chuỗi như hai bên ghi ngang hàng; nhưng mô hình đúng phải là **chuỗi là source of truth, còn DB bám theo sau**. Nó dẫn thẳng tới luồng "ghi `pending` → xác nhận qua indexer → reconcile". Giá trị không nằm ở câu trả lời nó đưa cho tôi — mà ở câu hỏi mà tôi đã không tự đặt ra cho mình.
:::

## Giới hạn của phản hồi từ AI

### Khi bạn giao cho AI đóng vai người phản biện, bạn đưa cho nó những ngữ cảnh gì để nó không trả lời chung chung?

- Đưa cho nó **các ràng buộc, chứ không chỉ code**: hình dạng lưu lượng (một cơn đổ xô hàng trăm claim trong vài giây), các bất biến (vault không được rút vượt; claim phải exactly-once), những hư hỏng nó phải sống sót qua (Discord retries, node chập chờn), và cả những phương án tôi đã loại trừ.
- Đặt một **câu hỏi đối kháng thật cụ thể** (*"cái này vỡ ở đâu khi có một cơn đổ xô claim đồng thời?"*), chứ không phải kiểu *"review giúp cái này."*
- Đưa cho nó **các tín hiệu thật** — một stack trace thật, số liệu latency đo được, schema thật — để nó suy luận trên hệ thống *của tôi*, chứ không phải một hệ thống trong sách giáo khoa.

### Đã bao giờ AI đưa ra phản hồi nghe có vẻ đúng nhưng không dùng được trong vận hành chưa?

- Thường xuyên. Nó hay gợi ý những bản sửa kiểu sách giáo khoa mà bỏ qua ràng buộc — *"dùng distributed lock"* trong khi chỉ một Postgres với một câu `UPDATE` có điều kiện đã đơn giản và nhanh hơn, hoặc *"bọc nó trong một saga / 2PC"* băng qua một blockchain mà về cơ bản không thể transact xuyên qua được.
- Tôi xem các gợi ý của nó là **những giả thuyết cần đem ra kiểm nghiệm với ràng buộc của mình** (ngân sách latency, gánh nặng vận hành, thứ mà cả đội thật sự chạy và debug nổi lúc 2 giờ sáng), chứ không phải toa thuốc cứ thế áp dụng.

## "Tốt" nghĩa là gì

### Với bạn, ngoài việc chạy đúng ra thì điều gì làm nên một backend "tốt"?

- Không phải chuyện *"nó có chạy được trên happy path không"* — mà là cách nó hành xử khi mọi thứ trục trặc: **đúng đắn** khi có đồng thời và retry, **quan sát được** (tôi tự thấy được hư hỏng thay vì đợi người dùng báo lại), **phục hồi được** (reconciliation, khởi động lại an toàn), và **có giới hạn** (backpressure và circuit breaker để một dependency chậm không kéo sập cả dây chuyền).
- Một backend tốt khiến các chế độ hư hỏng của nó **lộ rõ và vượt qua được**, chứ không để chúng vô hình.

### Trong những hệ thống nhiều microservice, sự kiện và đồng bộ dữ liệu, phần nào dễ sinh ra bug âm thầm nhất?

- Chính là các **đường nối**: dual-writes giữa hai hệ thống lưu trữ chuẩn (DB với chuỗi), thứ tự sự kiện và giao trùng lặp, và bất cứ thứ gì hư hỏng *mà không* văng lỗi. Điển hình là [sự cố log âm thầm](./production-incident) của tôi — logging đồng bộ dài dòng làm đầy đĩa, mà đĩa đầy rồi thì service cũng chẳng log nổi chính sự hư hỏng của mình, khiến dashboard tối đen.
- Bug âm thầm sống ở những chỗ **không có một source of truth duy nhất và không có alert cho sự trôi dạt**. Đó là lý do tôi thêm các reconciliation job và alert cho trôi dạt, chứ không chỉ `try/catch`.

## Cạm bẫy / dấu hiệu cảnh báo

- Coi output của AI là chân lý — cứ thế áp dụng mà không có chút phán đoán độc lập nào.
- Lấy câu *"AI viết mà"* để thay cho việc thật sự hiểu code của chính mình, nhất là trên một critical path.
- Chỉ chăm chăm nói về *tốc độ* sinh code — mà không hề nhắc tới việc kiểm chứng, ràng buộc, hay các chế độ hư hỏng.
- Không đưa cho nó chút ngữ cảnh nào, rồi lại chê nó "chung chung".
- Không kể nổi một lần AI **sai** — dấu hiệu cho thấy bạn không thật sự review lại những gì nó tạo ra.
