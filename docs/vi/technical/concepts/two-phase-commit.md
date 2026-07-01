---
title: Two-Phase Commit (2PC)
description: Một distributed protocol đảm bảo commit hoặc abort atomic trên nhiều participant.
tags: [concept, concurrency, distributed-transactions]
category: tech-concepts
status: draft
---

# Two-Phase Commit (2PC)

::: details Q: Two-Phase Commit là gì và nó đảm bảo điều gì?
2PC là một distributed consensus protocol đảm bảo mọi node tham gia hoặc **tất cả cùng commit** hoặc **tất cả cùng abort** — mang lại atomicity xuyên nhiều hệ thống riêng biệt. Một node **coordinator** duy nhất điều khiển protocol; participant bao gồm bất kỳ resource manager nào tương thích XA (database, message broker). Đảm bảo này là thật: không participant nào commit một kết quả dở dang. Cái giá là một cửa sổ blocking có thể kéo dài tùy ý nếu coordinator gặp sự cố đúng vào thời điểm tệ nhất.
:::

::: details Q: Hai phase là gì?
**Phase 1 — Prepare**: Coordinator gửi `PREPARE` tới từng participant. Mỗi participant thực hiện toàn bộ công việc cần thiết (acquire lock, ghi undo log), ghi bền vững rằng nó đã sẵn sàng, rồi vote `YES` hoặc `NO`. Nếu bất kỳ participant nào vote `NO` hoặc timeout, coordinator sẽ abort. Sau khi đã vote `YES`, một participant không thể tự ý rollback — nó đã hoàn toàn cam kết tuân theo quyết định của coordinator.

**Phase 2 — Commit hoặc Abort**: Nếu tất cả vote đều là `YES`, coordinator ghi quyết định của mình vào durable log riêng rồi gửi `COMMIT`. Mỗi participant áp dụng transaction và giải phóng lock. Nếu có bất kỳ vote nào là `NO`, coordinator gửi `ABORT` và các participant vứt bỏ trạng thái prepared của chúng.
:::

::: details Q: Điểm yếu chí mạng của 2PC là gì?
**Cửa sổ blocking.** Nếu coordinator crash sau khi đã nhận đủ vote `YES` nhưng trước khi kịp ghi quyết định commit, các participant sẽ bị kẹt: chúng đã vote `YES` (nên không thể an toàn rollback), nhưng lại chưa nhận được `COMMIT` (nên cũng không thể an toàn commit). Chúng giữ toàn bộ lock đã acquire vô thời hạn. Việc phục hồi đòi hỏi hoặc coordinator khởi động lại và replay log của nó, hoặc một quyết định thủ công của người vận hành. Trong một môi trường cloud, nơi việc restart coordinator có thể mất vài phút, điều này block mọi writer trên mọi dòng đang bị lock.

Điểm yếu thứ hai là throughput: mỗi participant giữ row-level lock trong suốt cả hai round-trip. Dưới mức tranh chấp vừa phải, điều này khiến việc ghi trở nên tuần tự xuyên các service lẽ ra phải độc lập với nhau.
:::

::: details Q: 2PC tương tác với CAP theorem như thế nào?
2PC chọn **Consistency thay vì Availability** không nhân nhượng. Trong lúc coordinator gặp sự cố, hệ thống trở nên không khả dụng với bất kỳ transaction nào chạm vào một dòng đang bị lock — đây là kiểu unavailability cứng, chứ không phải graceful degradation. Dưới network partition, participant không thể phân biệt "coordinator crash" với "partition"; chúng buộc phải giữ trạng thái block để bảo toàn consistency. Với những service cần duy trì availability dưới partition, [Saga](./saga) và eventual consistency mới là mô hình đúng.
:::

::: details Q: 3PC là gì và tại sao nó không phải câu trả lời?
Three-Phase Commit thêm một phase `PRE-COMMIT` để participant có thể an toàn abort khi coordinator timeout, về lý thuyết loại bỏ tính chất blocking. Trên thực tế, 3PC không an toàn dưới network partition — một partition bị chia đôi có thể khiến hai tập con participant độc lập commit, gây ra split-brain. Nó cũng phức tạp hơn và thêm nguyên một round-trip latency nữa. Gần như không hệ thống thực tế nào dùng 3PC; họ dùng consensus dựa trên Paxos/Raft (vốn đạt được sự đồng thuận non-blocking dưới các sự cố) hoặc né tránh distributed atomicity hoàn toàn.
:::

::: details Q: 2PC vẫn là câu trả lời đúng ở đâu, và nó xuất hiện ở đâu trong các hệ thống hiện đại?
2PC phù hợp khi:
- Tất cả participant đều là resource XA-capable trong một môi trường được kiểm soát duy nhất (cùng data center, mạng độ tin cậy cao).
- Yêu cầu consistency là tuyệt đối và rủi ro blocking là chấp nhận được, xét theo MTTR cho việc restart coordinator của bạn.
- Bạn đang ở trong một RDBMS đơn lẻ dùng các distributed operation nội bộ (ví dụ, 2PC nội bộ của Postgres cho logical replication).

Nó vẫn xuất hiện trong các hệ thống hiện đại: Spanner dùng một biến thể 2PC ở bên trong nhưng giảm thiểu cửa sổ blocking bằng cách dùng coordinator được replicate bằng Paxos, nên "sự cố" coordinator đòi hỏi cả một Paxos group sập chứ không phải một node đơn lẻ. CockroachDB dùng cách tiếp cận tương tự. Kafka transaction dùng một 2PC nhẹ giữa producer và transaction coordinator. Pattern này chưa chết — nó chỉ được dùng ở đúng tầng, với cơ chế fault-tolerance thích hợp bọc quanh coordinator.

Với các workflow xuyên service, xuyên database trong microservices, [Saga](./saga) gần như luôn là lựa chọn đúng.
:::

## Câu hỏi đào sâu thường gặp

- 2PC nội bộ database (ví dụ, `PREPARE TRANSACTION` của Postgres) khác gì so với 2PC xuyên service?
- Một participant dùng cơ chế phục hồi nào khi coordinator khởi động lại sau khi crash?
- Paxos hay Raft khác 2PC ra sao về fault tolerance — chúng sống sót qua những failure scenario nào mà 2PC không thể?
- Trong Spanner và CockroachDB, coordinator được làm fault-tolerant thế nào để cửa sổ blocking của 2PC bị giới hạn?
