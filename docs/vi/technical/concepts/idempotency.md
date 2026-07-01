---
title: Idempotency Keys
description: Làm cho các thao tác không an toàn trở nên an toàn để retry nhờ key do client cung cấp.
tags: [concept, reliability, api]
category: tech-concepts
status: draft
---

# Idempotency Keys

::: details Q: Idempotency Key giải quyết vấn đề gì?
Mạng thất bại một cách mập mờ. Một client gửi một request, nhận được timeout, và không thể biết được server đã thực thi thao tác hay chưa. Retry một thao tác non-idempotent — charge một thẻ, đặt một đơn hàng, gửi một email xác nhận — mà không có sự phối hợp thì có nguy cơ nhân đôi hiệu ứng. Idempotency key trao cho server thông tin cần thiết để de-duplicate: client đính kèm một token duy nhất, và server dùng nó để nhận ra và trả về kết quả đã cache cho các request lặp lại.

Vấn đề này không hề hiếm. Ở mức reliability 99.9%, cứ một nghìn request thì có một cái nhận về timeout mập mờ. Ở quy mô lớn, đó là hàng nghìn bản trùng lặp mỗi ngày nếu không có idempotency.
:::

::: details Q: Idempotency Key hoạt động như thế nào?
Client sinh ra một token duy nhất ổn định (UUID v4 hoặc content-hash của request) và gửi nó dưới dạng một header `Idempotency-Key`. Ở lần nhận đầu tiên, server thực thi thao tác và **lưu key cùng với kết quả trong cùng transaction với thay đổi nghiệp vụ**. Với các request sau đó có cùng key, server trả về kết quả đã lưu mà không thực thi lại.

```go
// Pseudocode — key and result stored atomically with the business change
tx.Exec("INSERT INTO payments (...) VALUES (...)")
tx.Exec("INSERT INTO idempotency_keys (key, response, created_at) VALUES ($1, $2, now())", key, result)
tx.Commit()
```

Nếu key được lưu trong một lần ghi riêng sau thay đổi nghiệp vụ (ghi hai bước), một cú crash giữa hai bước sẽ để lại một thao tác đã-thực-thi-nhưng-chưa-ghi-nhận — request tiếp theo sẽ thực thi lại nó. Việc ghi atomic không phải là tùy chọn.
:::

::: details Q: Những mối lo về storage và TTL là gì?
Key phải bền vững (không phải một cache trong bộ nhớ) để sống sót qua các lần restart. TTL nên vượt quá retry window của client kèm một khoảng dư — thường là 24 giờ đến 7 ngày. Để một key hết hạn trong khi client vẫn còn nằm trong retry window của nó sẽ khiến thao tác được thực thi lại ở lần thử tiếp theo.

Scope cũng quan trọng: key phải được namespace theo từng client (ví dụ, `(client_id, idempotency_key)` làm unique constraint). Một va chạm key giữa hai client khác nhau là một bug về tính đúng đắn — key của Client A có thể trả về kết quả của Client B hoặc chặn lần ghi của Client B. Hãy truyền đạt các quy tắc về TTL và scoping trong API contract của bạn; những client giữ key lâu hơn TTL phải được cho biết rằng chúng sẽ nhận một lần thực thi mới.
:::

::: details Q: Bạn xử lý các request trùng lặp đồng thời như thế nào?
Nếu hai request có cùng key tới trước khi cái nào kịp lưu kết quả của nó, cả hai có thể đua nhau thực thi thao tác. Cách khắc phục là một unique constraint ở mức database hoặc một advisory lock trên `(client_id, key)`. Request thứ hai block cho đến khi request thứ nhất commit, rồi tìm thấy kết quả đã lưu và trả về nó. Không có sự tuần tự hóa này, bạn sẽ có một cửa sổ race nơi cả hai cùng thực thi và một kết quả bị âm thầm loại bỏ.

Hãy trả về `409 Conflict` (hoặc `200` với kết quả đã cache, tùy theo API semantics của bạn) nếu key đang được xử lý dở (in-flight). Đừng trả về `5xx` cho một cuộc đua bình thường — nó kích hoạt client retry và làm vấn đề tệ hơn.
:::

::: details Q: Idempotency liên quan thế nào tới at-least-once message delivery?
[Transactional Outbox](./outbox) và [CDC](./change-data-capture) đều cung cấp at-least-once delivery — cùng một event có thể được gửi nhiều hơn một lần. Consumer xử lý điều này y hệt cách các API xử lý HTTP request trùng lặp: dùng `message_id` của event hoặc `(aggregate_id, sequence_number)` làm idempotency key, lưu trạng thái đã xử lý một cách atomic cùng với kết quả, và bỏ qua việc xử lý lại khi có delivery trùng lặp. Cơ chế là như nhau; chỉ có transport là khác.
:::

::: details Q: Những HTTP method nào cần idempotency key tường minh?
GET, HEAD, OPTIONS: idempotent một cách tự nhiên theo định nghĩa — không cần key.
DELETE, PUT (thay thế toàn phần): idempotent theo HTTP semantics — lặp lại chúng cho ra cùng một trạng thái.
POST: mặc định non-idempotent — tạo resource, charge payment, gửi notification. Cần có `Idempotency-Key` tường minh để retry an toàn.
PATCH: thường là non-idempotent (increment, append) — cũng hưởng lợi từ key tường minh.

Một lưu ý thực tế: ngay cả DELETE cũng không phải lúc nào cũng idempotent trên thực tế. Nếu endpoint DELETE của bạn trả về `404` khi resource không tồn tại, thì lời gọi thứ hai trả về một response khác với lời gọi thứ nhất. Điều đó có quan trọng hay không phụ thuộc vào retry logic của client — đáng để ghi rõ trong tài liệu.
:::

## Câu hỏi đào sâu thường gặp

- Bạn sinh một idempotency key tốt ở phía client thế nào — nó phải có những tính chất gì (tính duy nhất, tính ổn định qua các lần retry)?
- Chuyện gì xảy ra nếu hai client khác nhau tình cờ dùng cùng một key — bạn namespace key theo từng client ra sao?
- Bạn test idempotency thế nào trong một bộ integration test — những failure scenario nào khó tái hiện nhất?
- Cách triển khai idempotency-key của Stripe xử lý cuộc đua key-in-flight ra sao và nó trả về response gì?
