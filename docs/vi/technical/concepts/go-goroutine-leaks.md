---
title: Goroutine Leak
description: Goroutine leak là gì, cách phát hiện, và các pattern để ngăn chặn.
tags: [concept, golang, concurrency]
category: tech-concepts
status: draft
---

# Goroutine Leak

::: details Q: Goroutine leak là gì và vì sao nó nghiêm trọng?
Một goroutine leak là một goroutine bị **block vô thời hạn** mà không có đường nào để thoát. Vì GC của Go chỉ thu hồi những object không còn tham chiếu sống, nên stack của một goroutine bị block (cùng mọi thứ nó tham chiếu) sẽ không bao giờ được thu hồi. Theo thời gian, các goroutine bị leak tích tụ lại:

- **Tăng trưởng bộ nhớ**: mỗi goroutine giữ một stack (tối thiểu 2 KB, tăng theo nhu cầu) cộng với mọi heap object mà nó giữ cho sống.
- **Leak handle**: nếu goroutine giữ một connection đang mở, một file descriptor, hay một lock, thì những thứ đó cũng leak theo.
- **Vô hình với bộ dò deadlock của runtime**: bộ dò chỉ kích hoạt khi *tất cả* goroutine đều bị block. Một vài goroutine bị leak bên cạnh các goroutine đang chạy thì hoàn toàn im lặng.

Trong một server chạy dài hạn, ngay cả một tỷ lệ leak nhỏ trên mỗi request (1 goroutine mỗi request × 100 req/s) cũng có thể làm cạn bộ nhớ trong vài giờ.
:::

::: details Q: Đâu là những nguyên nhân phổ biến gây goroutine leak?
**1. Send vào một channel không có receiver**:
```go
func notify(ch chan<- int, v int) {
    ch <- v // blocks forever if nobody reads ch
}
go notify(results, 42) // leaked if caller stops reading
```

**2. Receive từ một channel không bao giờ được đóng hay được ghi vào**:
```go
ch := make(chan struct{})
go func() {
    <-ch // blocks forever if nobody sends or closes
}()
// forgot to close(ch) or send
```

**3. Thiếu lời gọi `cancel()`**:
```go
ctx, cancel := context.WithTimeout(parent, 5*time.Second)
// forgot: defer cancel()
// The timer goroutine inside context leaks until parent is cancelled
```

**4. Range trên một channel không bao giờ được đóng**:
```go
go func() {
    for v := range jobs { // blocks forever if jobs is never closed
        process(v)
    }
}()
// forgot to close(jobs) after submitting all work
```

Xem [context.Context](./go-context) để biết chi tiết về cancel-leak.
:::

::: details Q: Bạn phát hiện goroutine leak như thế nào?
**Trong test — goleak**:
```go
import "go.uber.org/goleak"

func TestFetch(t *testing.T) {
    defer goleak.VerifyNone(t) // fails test if goroutines leak
    // ... test code
}
```
`goleak` chụp ảnh (snapshot) các goroutine lúc test bắt đầu và lúc kết thúc, báo cáo bất kỳ goroutine mới nào còn tồn tại sau khi test xong. Đây là phương pháp phát hiện dễ hành động nhất.

**Lúc runtime — runtime.NumGoroutine**:
```go
// Expose as a metric
metrics.Gauge("goroutines").Set(float64(runtime.NumGoroutine()))
```
Một số lượng goroutine tăng đều đơn điệu là tín hiệu then chốt của một leak.

**pprof goroutine profile**:
```
GET /debug/pprof/goroutine?debug=2
```
In ra stack trace đầy đủ của mọi goroutine. Hãy tìm những stack cùng chia sẻ một call site bị block giống nhau — đó chính là điểm leak. Có thể lấy được khi service đang chạy.

**`go tool pprof` diff**: lấy hai goroutine profile cách nhau 60 giây; những goroutine xuất hiện trong profile thứ hai mà không có trong profile thứ nhất chính là những goroutine đang leak.
:::

::: details Q: Trong thực tế bạn ngăn chặn goroutine leak như thế nào?
**Nguyên tắc 1: Luôn nối tín hiệu hủy vào các goroutine thực hiện thao tác channel**:
```go
go func() {
    select {
    case out <- result:
    case <-ctx.Done(): // escape hatch
        return
    }
}()
```

**Nguyên tắc 2: Đóng channel từ phía owner (sender)**. Bên receiver thoát khỏi vòng `range` khi channel đóng; họ không thể tự đóng channel.

**Nguyên tắc 3: Luôn `defer cancel()`** ngay sau bất kỳ lời gọi `context.With*` nào.

**Nguyên tắc 4: Dùng buffered channel để tách vòng đời của sender khỏi receiver**:
```go
results := make(chan Result, len(items)) // sender never blocks
for _, item := range items {
    go func(item Item) { results <- process(item) }(item)
}
```
Với buffer có kích thước bằng số lượng sender, mỗi goroutine có thể send rồi thoát, bất kể consumer đọc lúc nào.

**Nguyên tắc 5: Giới hạn concurrency** — một lệnh `go f()` không giới hạn trong một hot path là một quả bom leak chờ nổ dưới tải. Hãy dùng một worker pool hoặc `errgroup.SetLimit`.
:::

::: details Q: Bạn nên giám sát gì trong production và quy trình xử lý (triage) ra sao?
**Giám sát**:
- `runtime.NumGoroutine()` dưới dạng một gauge — cảnh báo khi có tăng trưởng kéo dài (ví dụ, tăng > 10% mỗi 10 phút).
- Bộ nhớ (`runtime.MemStats.HeapInuse`) — một goroutine leak cuối cùng sẽ biểu hiện dưới dạng tăng trưởng heap.
- Cả hai cùng lúc: heap tăng *và* số goroutine tăng là một tín hiệu mạnh.

**Quy trình triage**:
1. Lấy một goroutine profile: `curl https://host/debug/pprof/goroutine?debug=2 > g1.txt`
2. Đợi 60 giây, lấy thêm một cái nữa: `> g2.txt`
3. `diff g1.txt g2.txt` — các goroutine mới trong g2 chỉ ra điểm leak.
4. Tìm khung stack chung trong các goroutine bị leak — đó là lời gọi bị block.
5. Truy ngược về nơi tạo ra goroutine để tìm chỗ thiếu tín hiệu hủy hoặc thiếu lệnh đóng.

Một goroutine bị leak trong một lời gọi thư viện thì khó hơn: stack chỉ hiện khung của thư viện. Hãy kiểm tra xem thư viện có nhận context hay không và bạn có đang truyền nó đúng cách hay không.
:::

## Câu hỏi đào sâu thường gặp

- `goleak.IgnoreCurrent()` giúp gì khi test code có các background goroutine từ các package bên thứ ba?
- Cách an toàn nhất để shutdown một pattern fan-in mà không leak các merge goroutine là gì?
- Bạn thêm cảnh báo về số lượng goroutine vào một service Go được đo bằng Prometheus như thế nào?
- Một goroutine leak có thể gây leak file descriptor không, và bạn sẽ tương quan hai thứ đó trong production ra sao?
