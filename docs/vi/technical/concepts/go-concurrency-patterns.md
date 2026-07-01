---
title: Các Concurrency Pattern
description: Worker pool, fan-out/fan-in, pipeline, và errgroup — khi nào dùng cái nào và làm sao tránh leak.
tags: [concept, golang, concurrency, patterns]
category: tech-concepts
status: draft
---

# Các Concurrency Pattern

::: details Q: Worker pool là gì và vì sao bạn cần giới hạn concurrency?
Một worker pool khởi chạy N goroutine, mỗi goroutine tiêu thụ từ một jobs channel dùng chung, xử lý công việc đồng thời nhưng với một cận trên cố định.

```go
func workerPool(ctx context.Context, jobs <-chan Job, n int) {
    var wg sync.WaitGroup
    for range n {
        wg.Add(1)
        go func() {
            defer wg.Done()
            for j := range jobs { // exits when jobs is closed
                j.Process(ctx)
            }
        }()
    }
    wg.Wait()
}
```

**Vì sao cần giới hạn**: một lệnh `go process(j)` không giới hạn cho mỗi job nghĩa là mức tiêu thụ bộ nhớ và tài nguyên tăng theo độ dài hàng đợi. Với N=100 worker gọi DB, bạn thực hiện tối đa 100 lời gọi DB đồng thời — khớp với kích thước connection pool của bạn. Không có giới hạn, một đợt bùng nổ 10.000 request sẽ sinh ra 10.000 goroutine mở 10.000 connection, làm cạn pool và sập chương trình.

Chọn N: bắt đầu với `runtime.GOMAXPROCS(0)` cho công việc CPU-bound; với công việc I/O-bound, tinh chỉnh theo giới hạn tài nguyên phía dưới (kích thước DB pool, giới hạn rate của API).

Mẫu drain: đóng `jobs` channel sau khi đã submit hết công việc; các worker thoát khỏi vòng `range` một cách tự nhiên. Luôn gọi `wg.Wait()` trước khi return.
:::

::: details Q: Mô tả pattern fan-out/fan-in và khi nào áp dụng nó.
**Fan-out**: phân phối công việc từ một input channel tới N worker goroutine, mỗi goroutine xử lý độc lập và ghi vào output channel riêng của nó.

**Fan-in**: gộp N output channel thành một channel duy nhất cho một consumer phía dưới.

```go
func fanIn(ctx context.Context, channels ...<-chan Result) <-chan Result {
    out := make(chan Result)
    var wg sync.WaitGroup
    for _, ch := range channels {
        wg.Add(1)
        ch := ch
        go func() {
            defer wg.Done()
            for r := range ch {
                select {
                case out <- r:
                case <-ctx.Done():
                    return
                }
            }
        }()
    }
    go func() { wg.Wait(); close(out) }()
    return out
}
```

Dùng khi: các task độc lập và kết quả có thể được xử lý theo bất kỳ thứ tự nào. Tránh khi: thứ tự quan trọng (thay vào đó hãy dùng kết quả có đánh index) hoặc khi overhead của fan-in vượt quá lợi ích của song song hóa (vòng lặp chặt với công việc không đáng kể).

Điểm mấu chốt: luôn nối `ctx` vào các merge goroutine. Nếu không, các goroutine sẽ block mãi mãi tại `out <- r` khi consumer dừng lại. Xem [Goroutine Leaks](./go-goroutine-leaks).
:::

::: details Q: Pattern pipeline hoạt động thế nào và bạn lan truyền tín hiệu shutdown ra sao?
Một pipeline nối các stage qua các channel: mỗi stage đọc từ input channel của nó, biến đổi dữ liệu, rồi ghi vào output channel của nó.

```go
func generate(ctx context.Context, nums ...int) <-chan int {
    out := make(chan int)
    go func() {
        defer close(out)
        for _, n := range nums {
            select {
            case out <- n:
            case <-ctx.Done():
                return
            }
        }
    }()
    return out
}

func square(ctx context.Context, in <-chan int) <-chan int {
    out := make(chan int)
    go func() {
        defer close(out)
        for n := range in {
            select {
            case out <- n * n:
            case <-ctx.Done():
                return
            }
        }
    }()
    return out
}
```

Lan truyền shutdown: hủy context → mọi stage thấy `ctx.Done()` và return → `defer close(out)` được kích hoạt → các stage phía dưới thoát khỏi vòng `range` của chúng. Đây là đường shutdown đúng chuẩn idiomatic.

Cách thay thế (một `done <-chan struct{}` mà bạn tự đóng thủ công) vẫn chạy được nhưng thêm boilerplate. Hãy ưu tiên context vì nó kết hợp được với deadline và truyền xuyên suốt qua các lời gọi thư viện. Xem [context.Context](./go-context).
:::

::: details Q: errgroup mang lại gì so với một WaitGroup thuần?
`golang.org/x/sync/errgroup` bọc `WaitGroup` với:
1. **Lan truyền error đầu tiên**: `Wait()` trả về error non-nil đầu tiên từ bất kỳ goroutine nào.
2. **Hủy context**: `errgroup.WithContext` tạo một context dẫn xuất, được hủy khi goroutine đầu tiên trả về error — báo hiệu cho các goroutine anh em dừng lại.
3. **Giới hạn concurrency**: `g.SetLimit(n)` giới hạn số goroutine chạy đồng thời (giống một semaphore), không cần một worker pool riêng.

```go
g, ctx := errgroup.WithContext(context.Background())
g.SetLimit(10) // at most 10 concurrent goroutines

for _, url := range urls {
    url := url
    g.Go(func() error {
        return fetch(ctx, url)
    })
}

if err := g.Wait(); err != nil {
    log.Fatal(err) // first error; siblings have been cancelled via ctx
}
```

Đánh đổi: errgroup chỉ thu về error **đầu tiên**. Nếu bạn cần tất cả error (ví dụ, một batch validation), hãy tích lũy chúng riêng bằng một slice được bảo vệ bởi mutex. Ngoài ra: sau `Wait()` thì context đã done — đừng tái sử dụng nó cho công việc tiếp theo.
:::

::: details Q: Mỗi concurrency pattern có thể leak goroutine như thế nào, và bạn ngăn chặn ra sao?
Mỗi pattern đều có một "đường leak" — một goroutine bị block mãi mãi vì đối tác của nó đã biến mất:

| Pattern | Kịch bản leak | Cách ngăn chặn |
|---------|--------------|------------|
| Worker pool | Consumer thoát sớm; các worker block tại `jobs <- item` | Đóng `jobs` sau khi submit; drain khi ctx bị hủy |
| Fan-in | Merge goroutine block tại `out <- r` mà không có ai đọc | Nối `ctx.Done()` vào mọi lệnh send trong các merge goroutine |
| Pipeline | Stage goroutine block tại channel phía dưới mà không có ai đọc | Hủy context; các stage kiểm tra `ctx.Done()` ở mỗi lệnh send |
| errgroup | Các goroutine anh em phớt lờ context đã bị hủy | Truyền ctx vào mọi lời gọi con; kiểm tra `ctx.Err()` trong các vòng lặp |

Nguyên tắc chung:
- Mỗi goroutine thực hiện một lệnh send trên channel cũng phải select trên một tín hiệu hủy.
- Đóng channel từ phía **sender**; bên receiver thoát khỏi vòng `range` một cách gọn gàng.
- Trong test, dùng `goleak.VerifyNone(t)` ở cuối để khẳng định không có goroutine nào bị leak.

Xem [Goroutine Leaks](./go-goroutine-leaks) để biết các công cụ phát hiện và tín hiệu giám sát.
:::

## Câu hỏi đào sâu thường gặp

- Bạn triển khai backpressure trong một pipeline thế nào khi một stage phía dưới chậm khiến phía trên bị nghẽn?
- Sự khác biệt giữa `errgroup.SetLimit` và một semaphore hiện thực bằng buffered channel là gì?
- Bạn thu về tất cả error (không chỉ error đầu tiên) từ một batch song song bằng errgroup như thế nào?
- Khi nào bạn chọn một pipeline thay vì một worker pool cho cùng một khối lượng công việc?
