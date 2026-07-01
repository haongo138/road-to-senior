---
title: Database Indexing
description: Index tăng tốc query như thế nào, cấu trúc bên trong của chúng ra sao, và khi nào chúng gây hại nhiều hơn lợi.
tags: [concept, database, indexing]
category: tech-concepts
status: draft
---

# Database Indexing

::: details Q: Database index là gì và cái giá phải trả là gì?
Index là một cấu trúc dữ liệu riêng biệt, ánh xạ giá trị key đến vị trí của row, nhờ đó việc đọc có mục tiêu chỉ tốn O(log n) thay vì O(n). Cái giá ẩn: mỗi lần ghi (INSERT, UPDATE, DELETE) đều phải cập nhật đồng bộ mọi index liên quan — kéo theo CPU, I/O và write amplification. Một bảng có 8 index nằm trên đường ghi tần suất cao có thể tốn nhiều thời gian bảo trì index hơn cả thời gian ghi row thật sự. Số lượng index là một đòn bẩy cho write throughput, chứ không chỉ cho tốc độ đọc.
:::

::: details Q: B+-tree index hoạt động ra sao, và vì sao nó là mặc định?
Node bên trong (internal node) giữ các separator key để định tuyến; node lá (leaf node) lưu key + con trỏ đến row và được liên kết với nhau thành một doubly-linked list. Nhờ đó ta có point lookup O(log n) và range scan hiệu quả (chỉ cần đi dọc chuỗi lá mà không phải duyệt lại cây từ đầu). Vì phần lớn query trong production dùng range, `ORDER BY` hoặc predicate bất đẳng thức, B+-tree là lựa chọn mặc định trong PostgreSQL, MySQL InnoDB và SQL Server.

B+-tree cũng có cái giá về ghi: insert và delete có thể gây ra page split hoặc merge, và ghi ngẫu nhiên với cường độ cao dẫn đến **index bloat** — các page bị lấp đầy thưa thớt, lãng phí đĩa và cache. Sau một đợt bulk delete, bạn nên chạy `VACUUM` (Postgres) hoặc `OPTIMIZE TABLE` (MySQL) để thu hồi lại không gian.

Các kho ghi nặng như Cassandra và RocksDB lại dùng **LSM-tree**: các thao tác ghi rơi vào một buffer trong bộ nhớ rồi được merge xuống đĩa thành những sorted run. LSM đánh đổi hiệu năng ghi ngẫu nhiên để lấy read amplification cao hơn; nó hợp với workload nặng về append, nơi ghi tuần tự chiếm ưu thế.
:::

::: details Q: Khi nào thì bạn dùng hash index thay vì B+-tree?
Hash index đạt O(1) cho so sánh bằng chính xác (`WHERE id = 42`) nhưng không hỗ trợ range, `ORDER BY` hay khớp prefix. PostgreSQL hỗ trợ hash index lưu trên đĩa; MySQL InnoDB thì không lưu bền chúng. Trên thực tế, một equality lookup bằng B+-tree tốn O(log n) ≈ 3–5 lần đọc page trên bảng vài chục triệu row — không đáng kể. Chỉ nên dùng hash index khi bạn đã chứng minh được rằng truy cập chỉ toàn equality và O(1) thực sự cần thiết một cách đo lường được.
:::

::: details Q: Quy tắc leftmost-prefix cho composite index là gì?
Một composite index trên `(a, b, c)` được sắp xếp trước theo `a`, rồi đến `b` trong từng `a`, rồi đến `c`. Những query không neo vào `a` thì không thể seek vào index; lúc đó planner sẽ quay về full scan.

```sql
-- Index: (last_name, first_name)
SELECT * FROM users WHERE last_name = 'Smith';               -- seeks ✓
SELECT * FROM users WHERE last_name = 'Smith'
                      AND first_name = 'Jane';               -- seeks both columns ✓
SELECT * FROM users WHERE first_name = 'Jane';               -- full scan ✗
```

Thứ tự cột còn quan trọng hơn cả chuyện chỉ dẫn đầu: nếu query lọc `a` (equality) và range trên `b`, thì cột dùng cho equality nên đứng trước để cột range vẫn còn dùng được cho việc scan. Sắp sai chỗ này là phí trắng cả index.
:::

::: details Q: Covering index là gì và khi nào nó trở thành index-only scan?
Covering index bao gồm mọi cột mà query đụng tới (lọc, select và sắp xếp). Planner có thể trả lời query chỉ từ index — một **index-only scan** — loại bỏ luôn các lượt fetch heap phụ cho từng row khớp. Điều này có thể giảm độ trễ query đi 10 lần trên các đường đọc nóng.

```sql
-- Index on (user_id, created_at, status) covers this query completely:
SELECT created_at, status FROM orders WHERE user_id = 7;
```

Trong PostgreSQL, index-only scan vẫn phải kiểm tra visibility map (để xác nhận row có nhìn thấy được từ snapshot hiện tại hay không). Nếu bảng hiếm khi được vacuum, visibility map sẽ cũ và các lượt heap fetch vẫn cứ diễn ra — làm hỏng luôn mục đích ban đầu. Hãy theo dõi `pg_stat_user_tables.n_live_tup` và độ trễ của autovacuum.
:::

::: details Q: Khi nào query planner bỏ qua một index?
- **Selectivity / cardinality thấp**: một index trên cột boolean `is_active` mà 95 % số row là `TRUE` — planner ước lượng sequential scan rẻ hơn vì tránh được I/O ngẫu nhiên cho từng con trỏ row. Ngưỡng selectivity rơi vào khoảng 5–15 % số row, tùy vào cost model của planner.
- **Áp một hàm lên cột đã index**: `WHERE LOWER(email) = 'a@b.com'` sẽ né qua index trên `email`; thay vào đó hãy tạo functional index `ON users (LOWER(email))`.
- **Wildcard ở đầu**: `LIKE '%smith'` không có prefix xác định để seek tới. Full-text search hoặc pattern reverse-index sẽ giải quyết được.
- **Ép kiểu ngầm**: so sánh `VARCHAR` với một integer gây ra một lần ép kiểu ngầm, che luôn index khỏi planner.
- **Bảng nhỏ**: optimizer thích sequential scan khi bảng chỉ nằm gọn trong vài page — I/O index ngẫu nhiên còn tốn hơn.
- **Thống kê cũ**: `ANALYZE` cập nhật thống kê mà planner dựa vào; thiếu nó, ước lượng cardinality sẽ sai và planner có thể chọn nhầm plan tệ.

Hãy xác nhận bằng `EXPLAIN ANALYZE`: nhìn vào ước lượng `rows=` so với con số thực tế, và để ý những chỗ hiện `Seq Scan` trong khi bạn kỳ vọng `Index Scan`.
:::

## Câu hỏi đào sâu thường gặp

- Làm sao để tìm ra các query chậm đang thiếu index trong PostgreSQL? (`pg_stat_user_tables`, `pg_stat_statements`, `EXPLAIN ANALYZE`)
- Partial index là gì và khi nào nó thắng full index? (ví dụ `WHERE deleted_at IS NULL`)
- Bạn thu hồi index bloat sau các đợt delete nặng như thế nào? (`REINDEX CONCURRENTLY`, `VACUUM`)
- Clustered (primary key của InnoDB / `CLUSTER` của Postgres) so với non-clustered: khi nào thứ tự vật lý của row mới quan trọng cho range scan?
- Workload ghi nặng thay đổi chiến lược index của bạn ra sao? (LSM-tree, ít index hơn, hoãn việc build index)
