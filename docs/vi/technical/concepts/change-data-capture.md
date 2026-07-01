---
title: Change Data Capture (CDC)
description: Stream các thay đổi ở mức dòng của database bằng cách bám theo transaction log thay vì polling bảng.
tags: [concept, concurrency, reliability]
category: tech-concepts
status: draft
---

# Change Data Capture (CDC)

::: details Q: Change Data Capture (CDC) là gì?
CDC phát hiện và stream mọi INSERT, UPDATE, hay DELETE đã commit bằng cách đọc **transaction log** của database (Postgres WAL, MySQL binlog, SQL Server change log) thay vì query các bảng. Vì log chính là source of truth cho mọi thay đổi đã commit, CDC bắt được từng lần mutation với độ trễ dưới 100 ms và không bỏ sót update nào — kể cả những dòng vừa được update rồi lại delete giữa hai lần poll, thứ mà polling âm thầm làm rơi.
:::

::: details Q: CDC khác gì so với phát hiện thay đổi kiểu polling?
| Khía cạnh | Polling | CDC (dựa trên log) |
|---|---|---|
| Latency | Giây đến phút (giới hạn bởi interval) | Mili-giây (điều khiển bởi log) |
| Update bị bỏ sót | Có — update+delete giữa hai lần poll là vô hình | Không — mọi commit đều được bắt |
| Tải lên DB | Các đợt quét SELECT định kỳ | Tối thiểu — log là một side channel |
| Phụ thuộc schema | Cần `updated_at`; delete là vô hình | Không — mặc định không phụ thuộc schema |

Cái giá: CDC gắn pipeline của bạn vào định dạng log và replication protocol của storage engine. Một lần nâng cấp Postgres hay một cú chuyển sang MySQL giờ đây trở thành một sự kiện migration cho các CDC consumer của bạn, chứ không chỉ cho application.
:::

::: details Q: Các công cụ và cơ chế CDC chính là gì?
- **Debezium**: CDC connector mã nguồn mở được triển khai rộng rãi nhất; tích hợp với Kafka Connect và hỗ trợ Postgres, MySQL, MongoDB, SQL Server, Oracle. Phát ra các change event có cấu trúc lên Kafka topic kèm ảnh dòng trước/sau (before/after).
- **Postgres logical replication**: Có sẵn; dùng replication slot với plugin như `pgoutput` (native) hoặc `wal2json`. Debezium bọc quanh cái này. Dùng trực tiếp thì ít overhead hơn nhưng đòi hỏi bạn tự quản lý vòng đời của slot.
- **MySQL binlog**: Cần `binlog_format=ROW`. Được tiêu thụ bởi Debezium hoặc Maxwell's Daemon.
- **Managed service**: AWS DMS, Google Datastream, Fivetran — gánh nặng vận hành thấp hơn nhưng ít kiểm soát hơn với schema evolution và định dạng event.
:::

::: details Q: Các use case chính của CDC là gì?
- **[Outbox](./outbox) relay**: Phát hiện các dòng outbox mới ngay khoảnh khắc chúng commit rồi publish lên broker — độ trễ thấp hơn nhiều so với polling.
- **Cache invalidation**: Invalidate hoặc refresh một cache entry ngay khoảnh khắc dòng backing của nó thay đổi, không cần hook ở tầng application.
- **Đồng bộ search index**: Giữ Elasticsearch hoặc Typesense nhất quán với database nguồn mà không cần dual-write.
- **Event streaming / analytics**: Nạp incremental vào một data warehouse hay data lake mà không cần batch ETL.
- **Audit log**: Suy ra một audit trail chống giả mạo từ chính log, bắt được trạng thái dòng chính xác trước và sau mỗi thay đổi.
:::

::: details Q: Những failure mode nào bạn phải tính đến khi vận hành?
- **Replication slot bloat (Postgres)**: Nếu một CDC consumer tụt lại phía sau hoặc connection của nó bị rớt trong khi slot vẫn tồn tại, Postgres không thể thu hồi WAL — nó tích tụ đến khi đầy đĩa. Hãy monitor slot lag bằng `pg_replication_slots.confirmed_flush_lsn` so với `pg_current_wal_lsn()`. Đặt `max_slot_wal_keep_size` (Postgres 13+) để giới hạn lượng WAL giữ lại và tự động drop slot nếu consumer tụt quá xa.
- **Schema evolution**: Đổi tên một cột hoặc đổi kiểu dữ liệu sau khi event đã được ghi có nghĩa là event cũ và event mới có hình dạng không tương thích. Hãy dùng một Schema Registry (Avro/Protobuf) để version các schema và cấu hình consumer xử lý được cả định dạng cũ lẫn mới trong cửa sổ migration. Đừng bao giờ đổi tên một cột mà không có một giai đoạn migration chạy song song.
- **Cutover giữa snapshot + stream**: Consumer mới cần một snapshot baseline nhất quán của các dòng hiện có trước khi tiêu thụ log event. Nếu snapshot không được phối hợp với vị trí trong log, bạn sẽ có khoảng hở hoặc trùng lặp tại điểm cutover. Snapshot mode của Debezium bắt được vị trí đọc nhất quán để log event đầu tiên nối liền ngay sau dòng snapshot cuối cùng.
- **Ordering theo key**: Event được sắp thứ tự theo partition key (thường là primary key), chứ không phải toàn cục xuyên các bảng. Một CDC event `customers` và một CDC event `orders` được commit trong cùng một transaction sẽ tới trên các Kafka topic riêng biệt mà không có đảm bảo về thứ tự xuyên topic. Hãy thiết kế consumer chịu được sự đảo thứ tự, hoặc route tất cả các bảng liên quan vào cùng một partition.
- **At-least-once delivery**: Consumer có thể nhận một bản trùng lặp nếu nó crash sau khi đã áp dụng một thay đổi nhưng trước khi checkpoint offset của nó. Consumer bắt buộc phải [idempotent](./idempotency) — dùng log sequence number (LSN) của event hoặc `(table, primary_key, txn_id)` làm deduplication key.
:::

::: details Q: Làm sao đạt được exactly-once semantics với CDC?
CDC cung cấp at-least-once: một event có thể được gửi lại sau khi consumer khởi động lại. Exactly-once đòi hỏi consumer idempotent. Pattern: dùng một upsert ở mức database keyed theo primary key và theo dõi LSN cuối cùng đã áp dụng cho từng source table. Commit lần cập nhật LSN trong cùng transaction với thay đổi đã áp dụng. Nếu consumer crash rồi replay, event trùng lặp đập vào cùng upsert đó và không tạo thêm hiệu ứng nào. LSN ngăn việc xử lý lại một event đã được commit.
:::

## Câu hỏi đào sâu thường gặp

- Bạn xử lý thế nào khi một Postgres replication slot tụt lại phía sau và gây cạn đĩa vì WAL?
- Một Debezium "heartbeat" event là gì và tại sao nó cần thiết cho các bảng ít ghi?
- Bạn thực hiện một initial snapshot ra sao mà không lock bảng nguồn?
- Schema evolution hoạt động thế nào khi một consumer đọc các event được tạo trước và sau khi đổi tên một cột?
