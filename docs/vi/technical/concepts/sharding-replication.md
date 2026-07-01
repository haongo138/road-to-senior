---
title: Sharding & Replication
description: Hai chiến lược scaling bổ trợ cho nhau — replication nhân bản dữ liệu để có tính sẵn sàng, sharding phân mảnh dữ liệu để có dung lượng.
tags: [concept, database, scaling]
category: tech-concepts
status: draft
---

# Sharding & Replication

::: details Q: Replication và sharding khác nhau ở điểm nào?
| | Replication | Sharding (horizontal partitioning) |
|---|---|---|
| **Nó làm gì** | Sao chép **cùng một** dữ liệu ra nhiều node | Chia **các phần dữ liệu khác nhau** ra nhiều node |
| **Mục tiêu chính** | Read scaling + high availability | Write scaling + storage scaling |
| **Mỗi node giữ gì** | Toàn bộ dataset | Một tập con (shard) của dataset |
| **Tác động khi hỏng** | Replica tiếp quản nếu leader hỏng | Mất một shard nghĩa là mất dữ liệu của partition đó |

Chúng bổ trợ cho nhau — các hệ thống production thường replicate từng shard để có tính sẵn sàng. Hãy nghĩ đến replication trước; nó đơn giản hơn nhiều. Chỉ shard khi write throughput hoặc dung lượng lưu trữ của một máy đơn thực sự đã cạn kiệt.
:::

::: details Q: Leader-follower replication hoạt động ra sao, và những đánh đổi về durability và lag là gì?
Leader tiếp nhận mọi thao tác ghi, append chúng vào write-ahead log (WAL) hoặc binlog, rồi stream các thay đổi tới các follower. Follower replay lại log và phục vụ đọc.

- **Synchronous replication**: leader chờ ít nhất một follower xác nhận trước khi báo ghi thành công. Durability mạnh hơn (bạn sẽ không mất một write đã commit nếu leader chết ngay sau đó), nhưng mỗi lần ghi phải chờ một vòng round-trip qua mạng — thường 1–5 ms trên LAN, và lâu hơn nhiều khi qua các region.
- **Asynchronous replication**: leader xác nhận ngay lập tức; các follower tự bắt kịp độc lập. Độ trễ ghi thấp hơn, nhưng nếu leader hỏng trong khoảng giữa lúc ghi và lúc follower replay thì write đó mất luôn. Đa số database do cloud quản lý (RDS, Cloud SQL) mặc định dùng async kèm tùy chọn semi-sync.

**Replication lag** là độ trễ trước khi một write đã commit xuất hiện trên các follower — nó có thể dao động từ mili-giây đến vài phút khi tải cao. Điều này sinh ra vấn đề **read-your-writes**: một user ghi dữ liệu, rồi đọc từ một replica cũ và không thấy chính thay đổi của mình. Các chiến lược giảm nhẹ: định tuyến việc đọc về leader trong một khoảng ngắn sau khi ghi, theo dõi vị trí replication (LSN) theo từng session và tạm hoãn việc đọc trên những replica chưa bắt kịp, hoặc dùng sticky session. Lag là một chỉ số bạn phải theo dõi — những cú tăng vọt đột ngột thường báo trước việc follower bị phân kỳ (divergence).
:::

::: details Q: Các chiến lược sharding phổ biến và những điểm hỏng của chúng là gì?
| Chiến lược | Cách hoạt động | Ưu điểm | Nhược điểm |
|---|---|---|---|
| **Range sharding** | Chia theo range của key (ví dụ user ID 1–1M → shard 1) | Đơn giản; tốt cho range query | Hotspot khi các thao tác ghi dồn vào một range (ví dụ ID hoặc timestamp tăng đơn điệu) |
| **Hash sharding** | `shard = hash(key) % N` | Phân bố key đều; không có hotspot tuần tự | Range query rải rác qua tất cả các shard; rebalance đòi hỏi rehash phần lớn key |
| **Directory sharding** | Bảng tra cứu ánh xạ mỗi key tới một shard | Linh hoạt hoàn toàn; hỗ trợ ánh xạ tùy ý | Bảng tra cứu là single point of failure và tốn thêm một network hop mỗi request |

Quyết định về shard key gần như không thể đảo ngược nếu không tốn công di trú dữ liệu đắt đỏ. Hãy chọn nó dựa trên pattern query chủ đạo của bạn — key nào giữ được các query thường xuyên nhất gói gọn trong một shard.
:::

::: details Q: Vấn đề hotspot / celebrity là gì và bạn xử lý ra sao?
Hash sharding phân bố key đều nhưng không phân bố tải đều. Một user nổi tiếng đơn lẻ hay một sự kiện viral có thể đẩy lượng traffic lớn hơn các shard khác cả mấy bậc độ lớn về một shard. Băm key kiểu đồng đều cũng chẳng cứu được — key đó chỉ xuất hiện một lần, nhưng mọi request đều băm về đúng cùng một shard.

Cách giảm nhẹ: dùng một compound shard key có thêm chiều thứ hai (ví dụ `user_id + time_bucket`), thêm một tiền tố salt ngẫu nhiên nhân tạo vào các key nóng để rải việc ghi ra nhiều shard, hoặc cache những record nóng nhất ở một tầng in-process hay Redis để traffic không bao giờ chạm tới shard. Cách dùng salt làm việc đọc phức tạp hơn — bạn phải fan-out rồi merge lại.
:::

::: details Q: Consistent hashing là gì và vì sao nó giúp ích cho việc rebalance?
`hash(key) % N` chuẩn sẽ ánh xạ lại gần như mọi key khi N thay đổi — thêm một shard đòi hỏi rehash khoảng (N-1)/N tổng số key. **Consistent hashing** sắp xếp node và key trên một vòng ảo. Thêm hoặc bớt một node chỉ dịch chuyển các key nằm trong cung liền kề — cỡ khoảng `K/N` key thay vì gần như toàn bộ. Cassandra và phần lớn các distributed cache (Memcached với consistent hashing phía client) dùng cách này. Virtual node (vnode) phân tán trách nhiệm của mỗi node vật lý ra nhiều đoạn cung, nhờ đó rebalance được ở mức chi tiết hơn.
:::

::: details Q: Điều gì khiến các thao tác cross-shard đau đầu, và bạn thiết kế để né chúng ra sao?
- **Join/aggregation cross-shard**: đòi hỏi scatter-gather — query router fan-out tới mọi shard, chờ tất cả kết quả bộ phận, rồi merge chúng ở tầng ứng dụng. Độ trễ bị chặn bởi shard chậm nhất; độ phức tạp cao.
- **Transaction cross-shard**: two-phase commit (2PC) đạt được atomicity nhưng lại đưa vào một coordinator sẽ chặn toàn bộ các bên tham gia nếu nó crash giữa chừng. Đa số team tránh 2PC và thay vào đó mô hình hóa các thao tác sao cho gói gọn trong một shard, hoặc dùng saga pattern kèm compensating transaction cho các luồng cross-shard.
- **Resharding**: chuyển dữ liệu khỏi một shard quá tải đòi hỏi live migration — copy dữ liệu, cập nhật routing, kiểm chứng, cut over — trong khi vẫn phục vụ traffic production. Đa số hệ thống giảm thiểu việc này bằng vnode hoặc chia sẵn (pre-split) thành nhiều shard logic hơn hẳn số node vật lý.

Bài học cốt lõi: **chọn shard key và né query cross-shard chiếm 90 % bài toán sharding**. Chọn sai key thì chẳng consistent hashing hay cách routing khéo léo nào cứu lại được một cách rẻ tiền.
:::

## Câu hỏi đào sâu thường gặp

- Multi-leader (active-active) replication: nó đưa vào những write conflict nào và chúng được giải quyết ra sao? (last-write-wins, CRDT, giải quyết ở tầng ứng dụng)
- Khi nào scaling theo chiều dọc hoặc thêm replica lại vượt trội hơn sharding? (đa số hệ thống chưa cần sharding cho tới khi đạt hàng trăm nghìn write/giây hoặc dataset cỡ nhiều TB)
- Các distributed database như CockroachDB hay Spanner đạt được global consistency mà không có nút thắt cổ chai single-leader như thế nào? (Paxos/Raft cho từng range, TrueTime)
- Distributed transaction xuyên các shard là gì, và khi nào 2PC chấp nhận được so với khi nào là quá đắt?
