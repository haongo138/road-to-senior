---
title: Transactions & Isolation Levels
description: Các đảm bảo của ACID, những hiện tượng đọc, bốn isolation level, và cách MVCC biến chúng thành khả thi trong thực tế.
tags: [concept, database, transactions]
category: tech-concepts
status: draft
---

# Transactions & Isolation Levels

::: details Q: ACID nghĩa là gì?
| Thuộc tính | Đảm bảo |
|---|---|
| **Atomicity** | Mọi statement trong một transaction hoặc commit tất cả, hoặc rollback tất cả — không có chuyện ghi dở dang. |
| **Consistency** | Một transaction đưa database từ một trạng thái hợp lệ sang một trạng thái hợp lệ khác, tôn trọng mọi ràng buộc và quy tắc. |
| **Isolation** | Các transaction chạy đồng thời hành xử như thể chúng chạy tuần tự — trạng thái trung gian không lộ ra cho những transaction khác (ở một mức độ có thể cấu hình). |
| **Durability** | Một khi đã commit, dữ liệu sống sót qua crash và mất điện (thường nhờ write-ahead log). |

Cái giá của durability thường bị bỏ qua: chính `fsync` lúc commit mới làm nó có thật. Những hệ thống tắt `fsync` để chạy nhanh (một số cấu hình Postgres) là đang hy sinh durability để đổi lấy write throughput.
:::

::: details Q: Các hiện tượng đọc (read phenomena) là gì và những level nào ngăn được chúng?
| Hiện tượng | Chuyện gì xảy ra |
|---|---|
| **Dirty read** | Transaction A đọc dữ liệu chưa commit từ B. Nếu B rollback, A đã hành động dựa trên dữ liệu chưa từng tồn tại. |
| **Non-repeatable read** | A đọc cùng một row hai lần; ở giữa hai lần đó B commit một update, nên A thấy các giá trị khác nhau. |
| **Phantom read** | A chạy cùng một range query hai lần; B chèn thêm hoặc xóa bớt row trong range đó, nên A thấy một tập kết quả khác. |
| **Write skew** | A và B mỗi bên đọc dữ liệu chồng lấn nhau, ra quyết định dựa trên đó, rồi ghi vào những row không chồng lấn — chung cuộc lại vi phạm một bất biến (invariant) mà riêng từng transaction đều không thấy bị phá vỡ. Chỉ **Serializable** mới ngăn được điều này. |

| Isolation level | Dirty read | Non-repeatable read | Phantom read | Write skew |
|---|---|---|---|---|
| Read Uncommitted | possible | possible | possible | possible |
| Read Committed | prevented | possible | possible | possible |
| Repeatable Read | prevented | prevented | possible* | possible |
| Serializable | prevented | prevented | prevented | prevented |

\* PostgreSQL Repeatable Read ngăn được phantom nhờ ngữ nghĩa snapshot của MVCC, nhưng write skew vẫn còn khả năng xảy ra cho đến khi bạn lên Serializable.

**Mặc định thực tế**: PostgreSQL mặc định là **Read Committed**; MySQL InnoDB là **Repeatable Read**. Nhiều team chọn một level mà không biết mặc định của database mình là gì — đây là một câu hỏi thăm dò phổ biến trong phỏng vấn.
:::

::: details Q: MVCC hoạt động ra sao và cái giá của nó là gì?
Thay vì khóa row khi đọc, database giữ nhiều phiên bản của mỗi row, mỗi phiên bản được đóng dấu bằng transaction ID. Reader nhìn thấy một snapshot nhất quán mà không chặn writer; writer tạo ra các phiên bản row mới mà không chặn reader. Kết quả là mức độ đồng thời đọc/ghi rất cao.

Cái giá vận hành là có thật: các phiên bản row cũ tích tụ dần cho đến khi được thu gom rác. Trong PostgreSQL đó chính là **VACUUM**. Một transaction chạy dài sẽ ghim (pin) mọi phiên bản row được tạo ra sau khi nó bắt đầu — không có VACUUM nào xóa được chúng. Điều này gây ra **table bloat**: bảng phình to trên đĩa ngay cả khi lượng dữ liệu ròng không hề đổi. Hãy theo dõi `pg_stat_activity` để phát hiện các transaction chạy dài; trong những trường hợp cực đoan, chúng chặn autovacuum hàng giờ liền và làm bảng phình lên hàng gigabyte.
:::

::: details Q: Trên thực tế nên chọn isolation level như thế nào?
Hãy bắt đầu từ level thấp nhất mà vẫn giữ được các bất biến về tính đúng đắn của bạn:

- **Read Committed** — đủ dùng cho phần lớn OLTP. Mỗi statement nhìn thấy dữ liệu đã commit tính đến thời điểm đó. Non-repeatable read vẫn có thể xảy ra nhưng hiếm khi gây vấn đề trong các luồng transaction ngắn.
- **Repeatable Read** — dùng khi một transaction phải đọc cùng một row nhiều lần và cần kết quả nhất quán (ví dụ sinh báo cáo bên trong một transaction). Trong Postgres, nó cũng ngăn được phantom.
- **Serializable** — cần thiết khi các transaction ra quyết định dựa trên những gì chúng đọc, mà quyết định đó lại ảnh hưởng đến những gì chúng ghi (giữ chỗ tồn kho, chống double-spend). PostgreSQL dùng **Serializable Snapshot Isolation (SSI)**, cơ chế phát hiện các vòng xung đột và hủy bỏ một bên tham gia. Khác với 2PL, SSI không khóa — nó theo dõi các phụ thuộc đọc/ghi và làm hỏng những transaction tạo thành một vòng nguy hiểm. Cái giá là logic retry: ứng dụng của bạn phải sẵn sàng thử lại các transaction bị hủy. Tỷ lệ hủy dưới điều kiện tranh chấp có thể đáng kể; hãy benchmark trước khi cho rằng Serializable là "miễn phí".
:::

::: details Q: Write skew là gì và tại sao nó quan trọng?
Write skew là bất thường (anomaly) tinh vi nhất về isolation và cũng là thứ mà đa số team không biết đến. Ví dụ: hai bác sĩ đều kiểm tra xem có ít nhất một bác sĩ đang trực hay không trước khi xin nghỉ. Cả hai đều thấy "1 bác sĩ đang trực", cả hai đều quyết định nghỉ được, và cả hai đều commit — kết cục là không còn bác sĩ nào trực. Không có transaction đơn lẻ nào ghi dữ liệu sai, nhưng hiệu ứng cộng gộp lại vi phạm một bất biến.

Repeatable Read ngăn từng transaction nhìn thấy những row đã thay đổi — nhưng nó không ngăn được sự *kết hợp* giữa đọc và ghi của hai transaction tạo ra một trạng thái toàn cục không hợp lệ. Chỉ Serializable (SSI hoặc `SELECT FOR UPDATE` tường minh kèm khóa cẩn thận) mới ngăn được write skew.
:::

## Câu hỏi đào sâu thường gặp

- Vấn đề "read-your-writes" trong một hệ thống có replication là gì, và làm sao để giảm nhẹ nó? (sticky session về leader, theo dõi vị trí replication)
- SSI của PostgreSQL phát hiện xung đột mà không cần khóa như thế nào? (siread lock, theo dõi phụ thuộc, phát hiện vòng lặp)
- Deadlock là gì và database xử lý nó ra sao? (phát hiện, hủy một bên tham gia, retry)
- Khi nào bạn dùng `SELECT FOR UPDATE` thay vì nâng isolation level lên cao hơn? (khóa bi quan so với lạc quan/SSI)
