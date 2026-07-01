---
title: Eventual Consistency
description: Các replica phân tán hội tụ như thế nào và mức nhất quán yếu-hơn-strong cho bạn những bảo đảm gì.
tags: [concept, consistency, distributed-systems]
category: tech-concepts
status: draft
---

# Eventual Consistency

::: details Q: Eventual consistency là gì?
**Eventual consistency** bảo đảm rằng nếu không có lần ghi mới nào xảy ra, tất cả các replica sẽ **hội tụ về cùng một giá trị** — nhưng không đưa ra giới hạn nào về việc mất bao lâu. Trong khoảng thời gian đó, các lần đọc có thể trả về dữ liệu cũ.

Nó nằm ở đầu yếu của phổ consistency vì nó không khẳng định gì về *khi nào* bạn sẽ thấy một lần ghi. Lỗi thường gặp là coi "eventually" đồng nghĩa với "đủ sớm" — trên thực tế, replication lag có thể trải dài từ mili-giây (cluster khỏe mạnh, cùng region) đến vài giây hoặc lâu hơn (cross-region, mạng suy giảm). Hãy thiết kế cho trường hợp xấu nhất, không phải giá trị trung vị.
:::

::: details Q: Có những mô hình consistency trung gian nào giữa eventual và strong?
Từ yếu nhất đến mạnh nhất:

| Mô hình | Bảo đảm |
|-------|-----------|
| **Eventual consistency** | Các replica hội tụ; các lần đọc có thể cũ |
| **Monotonic reads** | Một client không bao giờ đọc dữ liệu cũ hơn một lần đọc trước đó (không có time-travel) |
| **Read-your-writes** | Một client luôn thấy ngay các lần ghi của chính mình |
| **Causal consistency** | Các thao tác có quan hệ nhân quả được mọi node thấy theo đúng thứ tự nhân quả |
| **Sequential consistency** | Mọi thao tác xuất hiện trong một thứ tự toàn cục nhất quán với thứ tự chương trình của từng tiến trình |
| **Linearizability (strong)** | Các thao tác xuất hiện như tức thời; thứ tự thời gian thực được tôn trọng trên toàn cục |

**Session guarantee** (read-your-writes, monotonic reads) là mảnh đất trung dung thực dụng: mỗi client có được một *góc nhìn nhất quán về hoạt động của chính mình* mà không cần đồng bộ hóa toàn cục. Cách triển khai phổ biến: định tuyến các lần đọc của một client tới replica mà nó vừa ghi vào, hoặc dùng một read token tăng đơn điệu.
:::

::: details Q: Các hệ thống giải quyết xung đột ghi trong eventual consistency như thế nào?
Khi hai replica độc lập chấp nhận các lần ghi vào cùng một key trước khi sync, chúng phải hòa giải:

- **Last-write-wins (LWW)**: lần ghi có timestamp cao nhất thắng. Đơn giản và được dùng rộng rãi (mặc định của Cassandra). Rủi ro then chốt: **clock skew**. Hai server có đồng hồ lệch nhau 50ms có thể lặng lẽ loại bỏ lần ghi nhân quả xảy ra sau. NTP giảm nhưng không loại bỏ được độ trôi. LWW chấp nhận được khi việc mất một lần ghi đồng thời là dung thứ được; đừng bao giờ dùng nó cho dữ liệu tài chính.
- **Vector clock**: mỗi lần ghi mang theo một version vector theo dõi lịch sử nhân quả theo từng node. Các lần ghi đồng thời (không liên quan nhân quả) được phát hiện và đưa lên cho ứng dụng tự giải quyết. Không mất dữ liệu âm thầm, nhưng ứng dụng của bạn phải triển khai logic merge và xử lý các conflict object.
- **CRDT (Conflict-free Replicated Data Types)**: các cấu trúc dữ liệu (grow-only counter, set, OR-set, map) được thiết kế sao cho mọi thứ tự merge đều cho cùng một kết quả — không xung đột theo cấu trúc. Được dùng trong Riak, Redis Enterprise, các trình soạn thảo cộng tác (OT vs CRDT là một tranh luận liên quan). Cái giá: không phải mọi mô hình dữ liệu đều vừa với một CRDT; CRDT có thể phình to về kích thước metadata (tombstone trong set, vector clock nhúng theo từng entry).
:::

::: details Q: Khi nào eventual consistency chấp nhận được và khi nào thì không?
| Chấp nhận được | Không chấp nhận được nếu không giảm thiểu |
|-----------|-------------------------------|
| Feed và like trên mạng xã hội | Số dư tài khoản ngân hàng |
| Counter lượt xem / lượt tải | Giữ chỗ tồn kho (kịch bản "món hàng cuối cùng") |
| Truyền bá DNS | Xử lý thanh toán |
| Cập nhật search index | Thu hồi authentication token |
| Đọc catalog sản phẩm | Distributed lock |

Mẫu xử lý cho các trường hợp "không chấp nhận được" không phải lúc nào cũng là "dùng strong consistency" — mà là "dùng strong consistency cho critical path, hoặc thêm một cơ chế bù trừ." Với tồn kho: giữ chỗ một cách lạc quan (optimistic) rồi hòa giải bằng saga hoặc buffer bán vượt. Với số dư: dùng một ledger với strong consistency ở phía ghi, eventual ở phía đọc. Chấp nhận eventual consistency mà không hiểu tác động nghiệp vụ của một cửa sổ staleness chính là sai lầm cấp senior.
:::

::: details Q: Eventual consistency liên hệ với CAP theorem ra sao?
Eventual consistency là **mô hình consistency tự nhiên của các hệ thống AP**. Khi một hệ thống chọn availability thay vì consistency trong một network partition, các lần đọc từ các replica đã phân kỳ sẽ trả về dữ liệu có thể cũ. Eventual consistency định nghĩa cái bạn nhận được một khi partition lành lại: các replica hội tụ, nhưng chỉ sau một độ trễ nào đó. CAP cho bạn biết *tại sao* bạn phải chấp nhận eventual consistency trong một hệ phân tán có tính sẵn sàng cao; eventual consistency mô tả *điều đó nghĩa là gì về mặt vận hành*.

Xem thêm: [CAP Theorem](./cap-theorem).
:::

::: details Q: Sharding và replication tương tác với eventual consistency như thế nào?
Trong một hệ thống có replication, các lần ghi đi vào một primary (leader) và được **truyền bá bất đồng bộ** tới các replica. Các lần đọc từ replica có thể tụt lại sau leader — replication lag này là nguồn gốc của eventual consistency trong MySQL read replica, DynamoDB global table, Cassandra với các lần đọc `LOCAL_ONE`, và các thiết lập tương tự.

Lag không cố định: dưới áp lực ghi nó tăng lên; trong lúc một follower restart nó vọt lên. Hãy theo dõi `seconds_behind_master` (MySQL), `ReplicationLatency` (DynamoDB), hoặc thứ tương đương. Các lần đọc quorum (ví dụ Cassandra `QUORUM`) giảm cửa sổ staleness với cái giá là độ trễ đọc cao hơn và availability giảm khi có sự cố — một đánh đổi PACELC trực tiếp.

Xem thêm: [Sharding & Replication](./sharding-replication).
:::

## Câu hỏi đào sâu thường gặp

- Sự khác nhau giữa BASE (Basically Available, Soft state, Eventually consistent) và ACID là gì?
- CRDT hoạt động ra sao cụ thể cho một distributed counter?
- "Read repair" trong Cassandra là gì và nó giúp hội tụ như thế nào?
- DynamoDB cung cấp cả eventual và strongly consistent read trên cùng một table như thế nào?
