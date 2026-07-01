---
title: Cache Invalidation & Eviction
description: Dữ liệu trong cache được xóa hoặc làm mới như thế nào và khi nào.
tags: [concept, caching, performance]
category: tech-concepts
status: draft
---

# Cache Invalidation & Eviction

::: details Q: Tại sao cache invalidation được xem là một trong những bài toán khó nhất trong khoa học máy tính?
Câu nói (thường gán cho Karlton) nắm bắt một điều rất chính xác: **biết khi nào một giá trị đã cache không còn hợp lệ** đòi hỏi phải theo dõi mọi đường dẫn có thể thay đổi dữ liệu nền. Trong hệ phân tán, tri thức đó nằm rải rác khắp nhiều service và các job bất đồng bộ. Kiểu lỗi này rất âm thầm — bạn không nhận được exception nào, mà lặng lẽ phục vụ dữ liệu sai. Độ khó còn nhân lên dưới các lần ghi đồng thời: hai tiến trình có thể đua nhau invalidate rồi nạp lại một key, và giá trị cũ của bên thua có thể thắng nếu bạn không cẩn thận.
:::

::: details Q: Có những cách tiếp cận chính nào cho cache invalidation, và chúng so với nhau ra sao?
1. **TTL / expiry** — mỗi entry có một time-to-live; nó tự động hết hạn. Vận hành đơn giản nhất. Đánh đổi: phục vụ dữ liệu cũ trong tối đa TTL giây sau khi ghi. Chọn TTL là một núm điều chỉnh giữa nhất quán và hiệu quả cache: quá ngắn thì hit rate sụp đổ; quá dài thì phục vụ dữ liệu cũ quá thường xuyên.

2. **Invalidation tường minh khi ghi** — bên ghi xóa hoặc cập nhật key trong cache mỗi khi nguồn thay đổi. Giữ cache luôn tươi mới ngay lập tức. Đánh đổi: mọi đường dẫn ghi đều phải biết đến cache. Bỏ sót một code path (một background job, một script admin, một service khác) là cache lặng lẽ lệch pha. Phần khó nhất là tính đúng đắn dưới các lần ghi đồng thời: trong khoảng giữa lần ghi DB và lần xóa cache, một reader khác có thể nạp lại cache bằng giá trị cũ.

3. **Key có version / namespace** — nhúng một version token vào key (`user:42:v7`). Invalidation nghĩa là tăng version lên; các entry cũ trở nên không thể truy cập được và tự già đi rồi biến mất qua TTL. Cho phép **invalidate hàng loạt tức thì** mà không cần quét key. Cái giá là độ phức tạp: bạn cần một store nhanh và bền cho chính bộ đếm version (mất nó đồng nghĩa bạn không dựng được key đúng), và các entry cũ tích tụ chiếm bộ nhớ cho đến khi TTL evict chúng.

Hầu hết hệ thống production kết hợp TTL (lưới an toàn) với invalidation tường minh (làm mới nhanh) cho hot path.
:::

::: details Q: Có những eviction policy nào và mỗi cái đánh lừa bạn khi nào?
| Policy | Mô tả | Cạm bẫy |
|--------|-------------|--------|
| **LRU** (Least Recently Used) | Evict entry ít được truy cập gần đây nhất | Các job quét hoặc batch làm nhiễu thứ tự recency và evict cả dữ liệu thực sự nóng |
| **LFU** (Least Frequently Used) | Evict entry ít được truy cập nhất | Các key mới nhưng đột nhiên phổ biến bị evict trước các key cũ-nhưng-từng-phổ-biến |
| **ARC** (Adaptive Replacement Cache) | Cân bằng giữa recency và frequency, tự điều chỉnh | Phức tạp hơn; ít gặp trong các hệ thống có sẵn |
| **Random** | Evict một entry ngẫu nhiên | Cạnh tranh tốt đến bất ngờ; không tốn chi phí bookkeeping; là baseline tốt |

Redis dùng LRU hoặc LFU tùy `maxmemory-policy`. LFU (`allkeys-lfu`) nhìn chung vượt LRU với các cache tồn tại lâu có hot set ổn định, nhưng nếu mẫu truy cập của bạn thay đổi đột ngột (nội dung viral, flash sale), số đếm lịch sử của LFU sẽ tụt lại phía sau và bạn evict nhầm thứ. Hãy theo dõi **eviction rate** và **hit rate** cùng lúc — eviction cao kèm hit rate đi xuống là dấu hiệu cache của bạn quá nhỏ hoặc sai policy.
:::

::: details Q: Thundering herd (cache stampede) là gì và bạn giảm thiểu nó như thế nào?
Khi một key phổ biến hết hạn, **nhiều request đồng thời cùng miss một lúc**, mỗi request độc lập truy vấn DB, và đợt tăng vọt kết quả có thể làm quá tải nó. Nguy hiểm nhất với các key đắt đỏ để tính toán và bị đánh với QPS cao.

Các biện pháp giảm thiểu và cái giá của chúng:

- **Single-flight / request coalescing**: chỉ một goroutine (hoặc thread) fetch; số còn lại chờ và dùng chung kết quả. Loại bỏ các lần đánh DB trùng lặp. Cái giá: bên chờ bị block — độ trễ tăng vọt trong lúc refresh. Hoạt động tốt cho coalescing trong tiến trình (`singleflight` trong Go, `p-limit` trong Node); khó hơn khi vượt qua ranh giới tiến trình.
- **Jittered TTL**: thêm dao động ngẫu nhiên (`TTL ± 10%`) để các key trên toàn cụm hết hạn ở những thời điểm khác nhau thay vì trong một đợt đồng bộ. Rẻ, stateless, nhưng không giúp gì cho một key đơn lẻ cực nóng.
- **Probabilistic early refresh** (XFetch / PER): trước khi key hết hạn, một phần các request chủ động refresh nó ở background, tỷ lệ thuận với mức độ gần hết hạn. Trải đều chi phí refresh mà không cần chờ đến một lần miss. Cái giá: tải trung bình cao hơn đôi chút; cần công sức triển khai.
- **Distributed lock + stale fallback**: request đầu tiên giành lock và refresh; tất cả những request khác trả về giá trị (hơi) cũ trong lúc chờ. Cái giá: một phản hồi cũ cho mỗi chu kỳ revalidation; đòi hỏi cache lưu được các entry "stale-ok" quá TTL của chúng.

Không cái nào miễn phí. Single-flight thường là lựa chọn đầu tiên cho trong tiến trình; jitter + stale fallback cho xuyên tiến trình.
:::

::: details Q: Stale-while-revalidate là gì?
Một directive HTTP `Cache-Control` — cũng áp dụng được cho cache ở tầng ứng dụng — phục vụ **phản hồi cũ trong cache ngay lập tức** trong khi một tiến trình background fetch dữ liệu tươi. Request kế tiếp nhận được giá trị đã làm mới.

Đây là kiểu "phục vụ cái cũ, refresh bất đồng bộ": loại bỏ các đợt tăng vọt độ trễ với cái giá là một phản hồi cũ thừa cho mỗi chu kỳ revalidation. Tham số vận hành then chốt là `stale-while-revalidate=<seconds>` — bạn sẵn lòng phục vụ dữ liệu cũ bao lâu sau khi hết hạn. Giữ nó thật chặt cho dữ liệu nhạy cảm về nhất quán.
:::

::: details Q: Negative caching là gì và khi nào nó hữu ích?
**Negative caching** lưu lại chính sự kiện rằng một lần lookup không trả về gì (ví dụ một user ID không tồn tại). Không có nó, mỗi request cho một key vắng mặt đều đánh vào DB — một vector tấn công phổ biến (cache-busting bằng key ngẫu nhiên) và là nguồn gây tải không cần thiết trên các tập dữ liệu thưa.

TTL cho các negative entry nên ngắn hơn cho các positive entry, vì dữ liệu chúng đại diện (sự không-tồn-tại) có khả năng thay đổi cao hơn.
:::

::: details Q: Các cache key có version cho phép invalidate hàng loạt tức thì như thế nào?
Tất cả entry liên quan chia sẻ một version prefix được lưu trong một bảng lookup nhanh (`user_cache_version:42 = 8`). Invalidation nghĩa là tăng version. Toàn bộ key cũ giờ không thể truy cập được nữa; các lần đọc mới nạp vào những key tươi. Entry cũ tự evict qua TTL mà không cần xóa tường minh.

Cách này mở rộng lên tới việc invalidate hàng loạt cả một nhóm logic (ví dụ tất cả cache entry của một tenant) mà không cần quét. Kiểu lỗi: nếu store chứa bộ đếm version sập, bạn không dựng được key hiện hành — hãy thiết kế cho phù hợp (fallback về DB, hoặc làm cho version store có tính sẵn sàng cao).
:::

## Câu hỏi đào sâu thường gặp

- Redis `SCAN` + xóa hàng loạt so với invalidation dựa trên TTL cho các cache lưu lượng lớn thì như thế nào?
- Một negative cache entry là gì và khi nào nó hữu ích?
- Các CDN edge cache (như Cloudflare) xử lý invalidation ra sao (purge API, cache tag)?
