---
title: Channel so với Mutex
description: Khi nào dùng channel để giao tiếp và khi nào dùng mutex để bảo vệ shared state.
tags: [concept, golang, concurrency]
category: tech-concepts
status: draft
---

# Channel so với Mutex

::: details Q: "Don't communicate by sharing memory; share memory by communicating" thực sự nghĩa là gì trong thực tế?
Câu châm ngôn này là một nguyên tắc thiết kế, không phải một quy tắc tuyệt đối. Nó có nghĩa: thay vì cho nhiều goroutine truy cập trực tiếp vào cùng một biến (rồi bảo vệ nó bằng một lock), hãy **chuyển giao quyền sở hữu dữ liệu qua channel** để tại mỗi thời điểm chỉ một goroutine giữ dữ liệu đó.

Diễn giải cụ thể:
- Chia sẻ bộ nhớ (mutex): hai goroutine cùng giữ một con trỏ tới một `map`; chúng lock/unlock để đọc và ghi.
- Giao tiếp (channel): một goroutine sở hữu map; những goroutine khác gửi yêu cầu qua channel và nhận về phản hồi.

Cách tiếp cận bằng channel loại bỏ hoàn toàn shared mutable state — không còn gì để lock cả. Nó cũng làm cho luồng dữ liệu và quyền sở hữu trở nên tường minh ngay trong code.

Giới hạn của câu châm ngôn: nó không có nghĩa là "luôn dùng channel". Biến mọi counter dùng chung thành một vòng request-response qua channel là một anti-pattern với overhead thực sự và độ phức tạp không cần thiết. Câu châm ngôn dẫn dắt bạn tới đúng *thiết kế* — channel cho quyền sở hữu và pipeline, mutex cho việc bảo vệ shared state một cách hiệu quả.
:::

::: details Q: Khi nào bạn nên dùng channel thay vì mutex?
Dùng channel khi:

1. **Chuyển giao quyền sở hữu**: bạn muốn tại mỗi thời điểm đúng một goroutine sở hữu một giá trị — sender từ bỏ quyền truy cập ngay khi send.
2. **Pipeline**: các stage sản xuất và tiêu thụ những luồng giá trị.
3. **Fan-out / fan-in**: phân phối công việc cho N worker hoặc gom kết quả từ N goroutine.
4. **Signaling vòng đời**: broadcast một sự kiện done/cancel tới nhiều goroutine qua `close(done)`.
5. **Rate limiting / throttling**: một channel buffered chứa N token chính là một semaphore.

Channel trở nên vụng về khi: state cần được đọc kiểu random-access bởi nhiều goroutine (ví dụ một cache dùng chung với các lượt tra cứu đồng thời), vì bạn sẽ phải dựng một nút cổ chai serialize theo từng key.

Xem [Channels & select](./go-channels-select) để nắm ngữ nghĩa close và các pattern của select.
:::

::: details Q: Khi nào bạn nên dùng mutex thay vì channel?
Dùng mutex (hoặc atomic) khi:

1. **Bảo vệ các field của một struct**: một `Cache` với một `map` và một `sync.RWMutex` là cách làm thẳng thắn; bọc việc truy cập map trong channel chỉ thêm goroutine, overhead scheduler, và rủi ro deadlock.
2. **Counter / gauge dùng chung**: `sync/atomic` hoặc một Mutex quanh một `int64` mất 5–50 ns; còn một vòng round-trip qua channel mất 200–500 ns.
3. **Shared state nặng về đọc**: `sync.RWMutex` cho phép nhiều reader tiến hành đồng thời.
4. **Tránh bùng nổ số lượng goroutine**: channel đòi hỏi goroutine ở cả hai đầu; mutex thì không.

Quy tắc thực dụng: nếu critical section là "đọc hoặc ghi một field", hãy dùng mutex. Nếu critical section là "trao giá trị này cho một goroutine khác xử lý", hãy dùng channel.

Xem [sync Primitives](./go-sync-primitives) để có hướng dẫn về mutex/RWMutex.
:::

::: details Q: Mỗi cách tiếp cận có những kiểu hỏng hóc (failure mode) đặc trưng nào?
**Các failure mode của channel**:
- **Deadlock**: send không có receiver, receive không có sender, hoặc chờ vòng tròn. Runtime phát hiện được trường hợp tất cả goroutine cùng block; còn các deadlock cục bộ (goroutine leak) thì nó không thấy.
- **Goroutine leak**: một goroutine block mãi mãi trên một channel không có đối tác. Xem [Goroutine Leaks](./go-goroutine-leaks).
- **Overhead trên các hot path**: một thao tác channel kéo theo một chu kỳ park/unpark goroutine qua scheduler (~200–500 ns). Với một counter được tăng hàng triệu lần mỗi giây, mức này là không chấp nhận được.

**Các failure mode của mutex**:
- **Quên unlock**: nếu bạn return sớm mà chưa unlock, mọi locker sau đó sẽ deadlock. Luôn `defer mu.Unlock()`.
- **Lock contention**: một mutex "nóng" sẽ serialize các goroutine. Hãy profile bằng mutex profile của `go tool pprof`.
- **Copy các kiểu sync**: copy một Mutex cho ra hai primitive độc lập và âm thầm phá vỡ bất biến (`go vet` bắt được).
- **Vi phạm thứ tự lock** với nhiều mutex: luôn acquire theo một thứ tự toàn cục nhất quán để ngăn deadlock.
:::

::: details Q: Có một flowchart quyết định cho lựa chọn channel-vs-mutex không?
Một heuristic thực dụng:

```
Are you transferring ownership or coordinating a pipeline?
  YES → channel

Are you signalling completion to multiple waiters (broadcast)?
  YES → close(chan struct{}) or sync.Cond

Are you protecting shared fields / a cache / a counter?
  YES → sync.Mutex or sync.RWMutex or sync/atomic

Is it a simple integer counter under very high contention?
  YES → sync/atomic (LoadInt64 / AddInt64)
```

Khi cả hai đều dùng được, hãy ưu tiên cái có **ít goroutine hơn** và **mô hình sở hữu đơn giản hơn**. Channel thêm tính đồng thời; chúng không tự động giảm độ phức tạp một cách miễn phí. Code nhạy cảm về hiệu năng nên benchmark cả hai — khác biệt có thể lên tới 10×.
:::

## Câu hỏi đào sâu thường gặp

- Làm sao để triển khai một semaphore trong Go và khi nào một channel buffered là primitive phù hợp?
- `sync/atomic` là gì và nó khác một Mutex thế nào về các đảm bảo memory-ordering?
- Bạn sẽ thiết kế một concurrent LRU cache trong Go ra sao — kiểu actor dựa trên channel hay một struct được canh giữ bằng mutex?
- Khi nào `sync.Map` đáng dùng hơn một `map` + `sync.RWMutex`?
