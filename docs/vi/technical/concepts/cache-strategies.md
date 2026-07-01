---
title: Chiến lược Cache
description: Ứng dụng đọc và ghi dữ liệu như thế nào trong tương quan với cache.
tags: [concept, caching, performance]
category: tech-concepts
status: draft
---

# Chiến lược Cache

::: details Q: Cache-aside (lazy loading) là gì và tại sao đây lại là chiến lược phổ biến nhất?
Ứng dụng kiểm tra cache trước. Khi **miss**, nó nạp dữ liệu từ database, ghi vào cache rồi trả về. Khi **hit**, nó trả về ngay lập tức. Sự phổ biến đến từ tính đơn giản: cache hoàn toàn vô hình đối với tầng dữ liệu, vì vậy bạn có thể thêm nó vào bất kỳ codebase có sẵn nào mà không cần thay đổi schema.

Những chi phí ẩn: mỗi lần cold-start hoặc eviction đều tạo ra một **cửa sổ staleness** giữa thời điểm DB được cập nhật và thời điểm lần đọc kế tiếp làm mới cache. Dưới lưu lượng đồng thời, một lần ghi có thể sinh ra **dual-write race**: thread A đọc giá trị cũ, thread B cập nhật DB + cache, rồi thread A ghi đè cache bằng chính giá trị cũ mà nó vừa đọc — kết quả: cache giữ dữ liệu cũ cho đến khi TTL hết hạn. Giảm thiểu bằng TTL ngắn, write-through cho các đường dẫn quan trọng, hoặc optimistic locking trên lần ghi cache.
:::

::: details Q: Read-through khác cache-aside như thế nào?
Với **read-through**, chính tầng cache tự fetch từ DB khi miss và tự nạp dữ liệu — ứng dụng luôn chỉ giao tiếp với cache. Cache-aside đặt logic đó trong code ứng dụng.

Khác biệt thực tế nằm ở khía cạnh **vận hành**: read-through tập trung hóa mẫu truy cập DB (dễ tune, dễ trace, dễ rate-limit) nhưng lại gắn chặt cache với schema của DB. Cache-aside linh hoạt hơn nhưng làm logic nạp cache rải rác khắp các service, khiến bạn rất dễ bỏ sót một code path nào đó và rơi vào tình trạng thiếu nhất quán.
:::

::: details Q: Write-through caching là gì và nó giải quyết vấn đề gì?
Mọi lần ghi đều được ghi **đồng bộ vào cả cache lẫn database** trước khi caller nhận được xác nhận.

Nó xử lý cửa sổ staleness của cache-aside: sau bất kỳ lần ghi nào, cache lập tức nhất quán. Cái giá phải trả là **độ trễ ghi tăng lên** — mỗi lần ghi phải chờ hai round-trip thay vì một. Điều đó khiến nó không phù hợp với workload nặng về ghi. Nó cũng thêm rủi ro partial-failure: nếu lần ghi DB thành công nhưng lần ghi cache thất bại, bạn cần logic rollback, hoặc phải chấp nhận một khoảnh khắc thiếu nhất quán mà bạn buộc phải phát hiện được. Phù hợp nhất cho workload nặng về đọc, nơi việc đọc dữ liệu cũ sau khi ghi sẽ gây hại.
:::

::: details Q: Khi nào bạn dùng write-back (write-behind) caching?
Ứng dụng chỉ ghi vào cache; cache bất đồng bộ flush các entry "dirty" xuống database.

**Throughput chính là phần thưởng**: các đợt ghi dồn dập được hấp thụ trong bộ nhớ rồi gom nhóm (batch) xuống DB, đó là lý do write-back được dùng cho counter, session state và rate-limit bucket. **Rủi ro là mất dữ liệu**: nếu cache node crash trước khi flush, những lần ghi đó biến mất. Bạn phải quyết định liệu nghiệp vụ có chịu được điều đó hay không. Write-back cũng khó lý giải về mặt vận hành — cơ chế replication và failover phải tính đến trạng thái dirty. Đừng bao giờ dùng nó làm store chính cho bất cứ thứ gì bạn không thể dựng lại được.
:::

::: details Q: Write-around là gì và khi nào nó hợp lý?
Các lần ghi đi **thẳng vào database**, bỏ qua cache. Dữ liệu chỉ vào cache ở một lần đọc sau đó (lazy, giống cache-aside).

Dùng nó cho dữ liệu **ghi một lần và hiếm khi đọc lại**: bulk import, audit log, di trú dữ liệu tầng lạnh. Nếu bạn ghi những thứ đó xuyên qua cache, bạn sẽ evict các hot key để nhường chỗ cho dữ liệu mà chẳng ai sắp đọc tới. Đánh đổi là một lần miss không thể tránh ở lần đọc đầu tiên, mà bạn chấp nhận để đổi lấy việc bảo vệ hit rate của cache trên tập dữ liệu nóng đang hoạt động.
:::

::: details Q: Bạn chọn chiến lược dựa trên tỷ lệ đọc/ghi và yêu cầu nhất quán như thế nào?
| Workload | Chiến lược khuyến nghị |
|----------|---------------------|
| Nặng về đọc, chịu được staleness ngắn | Cache-aside hoặc read-through |
| Nặng về đọc, nhất quán là tối quan trọng sau khi ghi | Write-through |
| Nặng về ghi, chịu được mất mát (counter, metrics) | Write-back |
| Ghi hàng loạt, hiếm khi đọc lại | Write-around |

Hầu hết hệ thống production đều **kết hợp**: cache-aside cho đọc, write-through hoặc invalidation tường minh khi ghi cho phần dữ liệu nhạy cảm về nhất quán. Hai cạm bẫy cần tránh: (1) coi cache là **nguồn chân lý (source of truth)** — nếu dữ liệu chỉ tồn tại trong cache mà không có trong DB, một lần restart lạnh sẽ làm mất nó; DB phải luôn là system of record. (2) **cold-start / cache-warming** — sau khi deploy hoặc flush cache, mọi request đều là miss và DB của bạn phải gánh toàn bộ tải đọc production; giảm thiểu bằng cách pre-warm, chuyển lưu lượng dần dần, hoặc một tầng read-through gộp các lần miss đồng thời lại (single-flight).
:::

## Câu hỏi đào sâu thường gặp

- Sự khác nhau giữa cache hit ratio và cache miss ratio là gì, và mục tiêu bao nhiêu thì được coi là lành mạnh?
- Bạn warm cache như thế nào sau một lần cold-start hoặc deploy?
- Có thể kết hợp cache-aside và write-through không? Bằng cách nào?
- Redis hỗ trợ các mẫu write-back như thế nào?
