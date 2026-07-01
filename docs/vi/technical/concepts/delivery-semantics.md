---
title: Delivery Semantics
description: Các bảo đảm at-most-once, at-least-once và exactly-once trong hệ thống messaging.
tags: [concept, messaging, reliability]
category: tech-concepts
status: draft
---

# Delivery Semantics

::: details Q: Ba loại bảo đảm delivery trong hệ thống messaging là gì?
| Bảo đảm | Nghĩa là gì | Rủi ro |
|-----------|--------------|------|
| **At-most-once** | Message gửi một lần; nếu mất trên đường truyền thì mất luôn | Mất dữ liệu |
| **At-least-once** | Message được retry cho đến khi được ack; có thể đến hơn một lần | Xử lý trùng lặp |
| **Exactly-once** | Xử lý đúng chính xác một lần | Khó / tốn kém; thường được mô phỏng, không bao giờ là phép màu |

Hầu hết hệ thống production mặc định chọn **at-least-once** vì mất dữ liệu còn tệ hơn xử lý trùng lặp, và trùng lặp có thể được làm cho an toàn bằng một consumer idempotent. At-most-once chỉ dành cho các luồng chịu được mất mát và nhạy cảm về độ trễ (metrics, trace, kiểu fire-and-forget như UDP).
:::

::: details Q: At-least-once delivery hoạt động cơ học như thế nào?
1. Producer gửi message.
2. Consumer nhận nó và bắt đầu xử lý.
3. Consumer gửi một **acknowledgement** sau khi xử lý thành công.
4. Nếu ack không đến trước **visibility timeout** (SQS) hoặc **max.poll.interval** (Kafka), broker sẽ gửi lại message.

Nguy hiểm nằm giữa bước 2 và 3. Nếu consumer crash giữa chừng — hoặc quá chậm khiến timeout kích hoạt — broker gửi lại một message có thể đã được áp dụng toàn bộ hoặc một phần. Việc gửi lại đó là điều không thể tránh khỏi theo thiết kế.
:::

::: details Q: Exactly-once delivery có thực sự khả thi không?
Không phải như một primitive — nó là **at-least-once + idempotency + deduplication**, được trình bày cùng nhau. Bạn không thể commit một cách nguyên tử cả "xử lý message này" lẫn "ack cho broker" mà không có một distributed transaction; khoảng cách giữa hai thao tác đó chính là nơi sinh ra trùng lặp.

**Exactly-Once Semantics (EOS)** của Kafka — transactional producer + ghi nguyên tử đa partition — loại bỏ trùng lặp *trong một pipeline Kafka-đến-Kafka* (đọc từ topic A, biến đổi, ghi sang topic B). Nó không mở rộng ra ngoài ranh giới Kafka: bất cứ điều gì consumer của bạn làm bên ngoài Kafka (ghi DB, gọi HTTP, gửi email) vẫn phải idempotent. EOS cũng có chi phí thực: giảm throughput khoảng 20–30% và tăng tải broker do phối hợp transaction.

Đối với exactly-once đầu-cuối xuyên qua nhiều hệ thống, công thức là: at-least-once delivery + consumer idempotent + dedup store. Cái dedup store (một ràng buộc unique trong DB trên message ID, hoặc một Redis SET có TTL) là mảnh ghép then chốt — và TTL của nó phải vượt quá cửa sổ redelivery tối đa của bạn, nếu không bạn sẽ xử lý lại các message mà bản ghi dedup của chúng đã hết hạn.
:::

::: details Q: Tại sao consumer phải idempotent khi dùng at-least-once delivery?
Vì retry là điều **không thể tránh khỏi** — lỗi mạng, consumer crash, xử lý chậm và các đợt tạm dừng GC đều kích hoạt việc gửi lại. Một consumer idempotent tạo ra cùng một kết quả bất kể cùng một message được áp dụng bao nhiêu lần: upsert thay vì insert, set thay vì increment, hoặc kiểm tra một dedup ID trước khi hành động.

Không có idempotency: bạn tính tiền một khách hàng hai lần, gửi email trùng, hoặc đếm kho gấp đôi. Đây là những sự cố production có thật, không phải rủi ro lý thuyết.

Xem thêm: [Idempotency Key](./idempotency).
:::

::: details Q: Mẫu Transactional Outbox liên hệ với delivery semantics ra sao?
[Outbox pattern](./outbox) đạt được **at-least-once delivery đáng tin cậy từ một service** bằng cách ghi event vào một bảng database trong **cùng một transaction** với thao tác nghiệp vụ. Một tiến trình relay đọc outbox và publish sang broker. Nếu relay crash giữa lúc publish, nó đọc lại và publish lại — vì vậy mà là at-least-once. Consumer phải xử lý trùng lặp một cách idempotent.

Cách thay thế — publish sang broker ngay bên trong transaction nghiệp vụ — sẽ hỏng dưới partial failure: DB commit nhưng lần publish sang broker thất bại (hoặc ngược lại), khiến bạn hoặc mất event hoặc có event ma. Outbox tránh điều này bằng cách biến DB thành nguồn chân lý duy nhất cho câu hỏi "event này có cần được gửi hay không."
:::

::: details Q: Visibility timeout là gì và nó tương tác với retry như thế nào?
Trong SQS và các queue tương tự, khi một consumer nhận một message, nó trở nên **vô hình** với các consumer khác trong suốt khoảng visibility timeout. Nếu consumer không ack (xóa) message trước khi timeout hết hạn, message trở lại hữu hình và được gửi lại.

Hãy đặt visibility timeout **dài hơn thời gian xử lý tối đa của bạn** bao gồm cả tail latency; nếu không một consumer chậm-mà-khỏe-mạnh sẽ kích hoạt các lần gửi lại vô cớ dẫn đến xử lý trùng lặp. Một lỗi phổ biến: đặt timeout bằng thời gian xử lý *trung bình* — cái đuôi dài (long tail) gây ra các lần gửi lại ma trong production.

Với Kafka, thứ tương đương là `max.poll.interval.ms` — nếu consumer không poll trong cửa sổ đó, broker giả định nó đã chết và kích hoạt rebalance, gán lại partition cho một consumer khác trong group.
:::

::: details Q: Bạn chọn khóa deduplication như thế nào?
Khóa dedup phải **ổn định qua các lần gửi lại** và **duy nhất theo từng event logic** — không chỉ theo từng message vật lý. Một Kafka offset dùng được nếu bạn xử lý Kafka-đến-Kafka; một UUID do database sinh ra trong bảng outbox dùng được cho các luồng dựa trên outbox. Nguy hiểm là dùng một khóa nghiệp vụ tự nhiên mà không thực sự duy nhất theo từng event (ví dụ `user_id + action` mà không có timestamp — hai event trùng-mà-khác-biệt hợp lệ chia sẻ cùng khóa và cái thứ hai bị lặng lẽ bỏ đi).
:::

## Câu hỏi đào sâu thường gặp

- Bạn chọn khóa deduplication như thế nào khi các message có thể giống hệt nhau về mặt cấu trúc nhưng khác biệt về mặt logic?
- Idempotent producer của Kafka khác một idempotent consumer ra sao?
- Sự khác nhau giữa một NACK (negative ack) và việc để visibility timeout hết hạn là gì?
- Mẫu Outbox cải thiện việc publish trực tiếp sang broker về mặt bảo đảm delivery như thế nào?
