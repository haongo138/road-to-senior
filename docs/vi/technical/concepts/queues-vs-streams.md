---
title: Message Queue vs Stream
description: Queue và stream dựa trên log khác nhau ra sao về ngữ nghĩa và tình huống sử dụng.
tags: [concept, messaging]
category: tech-concepts
status: draft
---

# Message Queue vs Stream

::: details Q: Message queue là gì và nó hoạt động như thế nào?
Một **message queue** (ví dụ SQS, RabbitMQ) là một buffer nằm giữa producer và consumer. Producer enqueue một message; consumer dequeue và **acknowledge** nó; sau đó broker **xóa** message. Một khi đã được ack, nó biến mất.

Ngữ nghĩa xóa-khi-ack này chính là đặc tính định danh: một queue mô hình hóa **công việc cần làm** — mỗi task thuộc sở hữu của đúng một consumer. Các competing consumer chia sẻ tải message của queue; thêm worker sẽ mở rộng throughput tuyến tính cho đến khi chính queue trở thành nút thắt cổ chai. SQS standard queue cung cấp ordering theo kiểu best-effort; FIFO queue thêm bảo đảm về thứ tự với throughput ~300 msg/s (so với ~3.000 của standard).
:::

::: details Q: Stream dựa trên log là gì và điều gì làm nó khác biệt?
Một **stream** (ví dụ Kafka, Kinesis, Pulsar) là một **log append-only, bền vững**. Message được giữ lại trong một khoảng thời gian cấu hình được, bất kể chúng đã được đọc hay chưa. Mỗi consumer group tự theo dõi **offset** của riêng mình — việc đọc không làm mất message đi.

Các hệ quả then chốt:
- **Fan-out mà không nhân bản**: nhiều consumer group độc lập, mỗi group đọc toàn bộ log theo nhịp riêng. Một group mới có thể bắt đầu đọc từ offset 0 và replay lại toàn bộ lịch sử.
- **Ordering là theo từng partition, không phải toàn cục**: Kafka bảo đảm thứ tự nghiêm ngặt trong một partition nhưng không đảm bảo giữa các partition. Message được định tuyến tới partition theo key (hoặc round-robin); mọi message cùng một key đều đi vào cùng một partition, bảo toàn thứ tự theo từng entity.
- **Số lượng partition gần như không thể đảo ngược**: Kafka cho phép thêm partition nhưng không cho xóa, và việc re-partition sẽ phân bố lại các key assignment — điều này phá vỡ thứ tự theo từng key và buộc consumer group phải rebalance. Hãy chọn số partition một cách dè dặt và lên kế hoạch trước.
:::

::: details Q: Khi nào bạn nên chọn queue thay vì stream?
| Tiêu chí | Queue | Stream |
|----------|-------|--------|
| Mô hình chính | Phân phối công việc | Event log / pub-sub |
| Sau khi tiêu thụ | Message bị xóa | Message được giữ lại |
| Nhiều consumer | Cạnh tranh cùng một message | Mỗi group nhận toàn bộ message một cách độc lập |
| Cần replay | Không | Có |
| Cần ordering | Một phần / tùy chọn FIFO | Bảo đảm theo từng partition |
| Khả năng thấy backlog | Metric queue depth | Metric consumer lag |
| Ví dụ | SQS, RabbitMQ, Azure Service Bus | Kafka, Kinesis, Pulsar |

Dùng **queue** cho task và command — những việc được làm đúng một lần bởi một worker, nơi bạn muốn phân phối công việc tự động. Dùng **stream** cho các event mà nhiều hệ thống cần quan sát độc lập, nơi cần khả năng kiểm toán hoặc replay, hoặc nơi bạn cần một audit log bền vững.

Cạm bẫy mà người phỏng vấn hay hỏi: "Tôi dùng Kafka như một queue được không?" — được, với một consumer group gồm một consumer cho mỗi partition, nhưng bạn mất khả năng scale dễ dàng và cơ chế cân bằng competing-consumer tự động.
:::

::: details Q: Backpressure là gì và queue với stream xử lý nó ra sao?
**Backpressure** xảy ra khi producer phát ra nhanh hơn tốc độ consumer xử lý được.

- **Queue**: message tích tụ (bị giới hạn bởi storage). Visibility timeout ngăn một consumer chậm chặn các consumer khác. Hãy theo dõi **queue depth** — một queue đang phình to là tín hiệu chính. Ở độ sâu cực lớn, chi phí storage tăng và thời gian-để-xử-lý dài ra, phá vỡ SLA cho các task nhạy cảm về thời gian.
- **Stream**: **lag** của consumer tăng lên (offset tụt lại sau đầu log). Kafka giữ dữ liệu tới một giới hạn retention (theo thời gian hoặc byte); một consumer bị lag rơi ra khỏi cửa sổ retention sẽ mất message vĩnh viễn. Hãy theo dõi **consumer group lag** (lag tối đa trên các partition). Nguy hiểm ở chỗ nó âm thầm: không có lỗi nào, message chỉ đơn giản biến mất khỏi góc nhìn của consumer một khi cửa sổ retention cuộn qua.

Các chiến lược backpressure ở tầng ứng dụng: rate-limit producer, áp flow control tại consumer (pause/resume), hoặc scale số replica của consumer khi lag vượt ngưỡng.
:::

::: details Q: Dead-Letter Queue (DLQ) là gì và có những cân nhắc vận hành nào?
Một **DLQ** là queue/topic phụ, nơi các message xử lý thất bại sau N lần retry được định tuyến tới, ngăn các poison message chặn queue chính vô thời hạn.

Luồng điển hình: message thất bại → retry đến số lần tối đa → chuyển sang DLQ → cảnh báo trên DLQ depth → kỹ sư điều tra và hoặc xử lý lại hoặc loại bỏ.

Các cạm bẫy vận hành:
- **DLQ phình to là một triệu chứng**, không phải một giải pháp. DLQ không được giám sát sẽ âm thầm tích tụ mất mát dữ liệu.
- Thiết lập **cảnh báo trên DLQ depth** ngay khi bạn bật DLQ.
- Với Kafka, một "dead-letter topic" do ứng dụng tự quản lý — broker không tự động chuyển message; chính consumer của bạn phải bắt lỗi và produce sang topic DLQ.
- Khi replay từ DLQ, hãy xác nhận consumer xử lý message một cách idempotent — cái bug gây ra thất bại ban đầu có thể đã áp dụng dở dang một phần tác động.
:::

## Câu hỏi đào sâu thường gặp

- Cơ chế rebalancing của consumer group trong Kafka hoạt động ra sao và điều gì gây ra việc reassign partition?
- Sự khác nhau giữa topic và partition trong Kafka là gì?
- Bạn sẽ triển khai fan-out với SQS như thế nào (gợi ý: SNS + SQS)?
- Bạn xử lý message trùng lặp trong một competing-consumer queue ra sao?
