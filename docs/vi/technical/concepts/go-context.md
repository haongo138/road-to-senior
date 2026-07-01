---
title: context.Context
description: Lan truyền cancellation, deadline và các giá trị theo phạm vi request qua ranh giới goroutine.
tags: [concept, golang, concurrency]
category: tech-concepts
status: draft
---

# context.Context

::: details Q: context.Context giải quyết vấn đề gì, và không giải quyết được gì?
**Vấn đề**: trong một server, một request đến sẽ sinh ra nhiều goroutine (query DB, gọi RPC, việc chạy nền). Khi client ngắt kết nối hoặc một deadline hết hạn, bạn cần tất cả các goroutine đó dừng lại — nhưng Go không có cách dựng sẵn để "giết" một goroutine. `context.Context` cung cấp một **tín hiệu cancellation và deadline dùng chung**, luồng qua các ranh giới API và goroutine mà không cần biến toàn cục.

Những gì nó giải quyết: lan truyền cancellation, deadline, và các giá trị theo phạm vi request (trace ID, auth token) xuyên suốt chuỗi lời gọi.

Những gì nó không giải quyết: **cancellation mang tính cooperative**. Nếu một callee không bao giờ kiểm tra `ctx.Done()`, thì cancellation chẳng làm được gì. Một goroutine đang block trong một vòng lặp tính toán thuần túy hoặc một thư viện không nhận biết ctx sẽ không bị ngắt. Tín hiệu context chỉ mang tính khuyến nghị — callee phải chủ động hưởng ứng nó.
:::

::: details Q: Có những constructor nào cho context và bạn dùng mỗi cái khi nào?
| Constructor | Trường hợp dùng |
|-------------|----------|
| `context.Background()` | Gốc cấp cao nhất: `main`, `init`, test, đầu một server handler |
| `context.TODO()` | Placeholder khi bạn chưa chắc nên dùng context nào — là một code smell nếu nó tồn tại lâu dài |
| `WithCancel(parent)` | Cancel thủ công; trả về `ctx, cancel` |
| `WithTimeout(parent, d)` | Cancel sau một khoảng thời gian tính từ bây giờ |
| `WithDeadline(parent, t)` | Cancel tại một thời điểm tuyệt đối |
| `WithValue(parent, key, val)` | Gắn dữ liệu theo phạm vi request |

Mọi context dẫn xuất tạo thành một **cây (tree)**: cancel một parent sẽ cancel tất cả các con. `WithTimeout`/`WithDeadline` cũng cancel toàn bộ con khi thời gian hết hạn.

```go
ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
defer cancel() // always call to release resources even if timeout fires first
```
:::

::: details Q: Các quy tắc để dùng context cho đúng là gì?
1. **Truyền làm tham số đầu tiên**: `func DoWork(ctx context.Context, ...)` — quy ước được `go vet` và các linter thực thi.
2. **Không bao giờ lưu trong một field của struct** (trừ các wrapper để tương thích ngược). Lưu trữ làm vòng đời trở nên mờ mịt; còn truyền vào thì làm nó tường minh tại mọi call site.
3. **Luôn `defer cancel()`** ngay sau `WithCancel`/`WithTimeout`/`WithDeadline`. Ngay cả khi timeout kích hoạt, hàm cancel vẫn giải phóng goroutine timer cùng các tài nguyên nội bộ của context. Quên nó sẽ leak một goroutine cho tới khi parent bị cancel.
4. **`WithValue` chỉ dành cho dữ liệu theo phạm vi request với key có kiểu không export** — không bao giờ dùng cho các tham số hàm tùy chọn.

```go
type ctxKey string
const traceIDKey ctxKey = "traceID"

ctx = context.WithValue(ctx, traceIDKey, "abc-123")
id, _ := ctx.Value(traceIDKey).(string)
```

Dùng một kiểu không export giúp ngăn xung đột key giữa các package.
:::

::: details Q: Làm sao để select trên ctx.Done() song song với công việc thực đúng cách?
```go
func process(ctx context.Context, jobs <-chan Job) error {
    for {
        select {
        case <-ctx.Done():
            return ctx.Err() // context.Canceled or context.DeadlineExceeded
        case j, ok := <-jobs:
            if !ok {
                return nil // channel closed, done
            }
            if err := doWork(ctx, j); err != nil {
                return err
            }
        }
    }
}
```

Các điểm mấu chốt:
- Kiểm tra `ctx.Err()` để phân biệt `Canceled` (cancel tường minh) với `DeadlineExceeded` (timer kích hoạt) — hữu ích cho metrics/logging.
- Truyền `ctx` vào mọi sub-call để chúng cũng có thể short-circuit.
- Nếu `doWork` là đồng bộ và kéo dài, bản thân nó cũng phải select trên `ctx.Done()` bên trong, nếu không nó sẽ không tôn trọng cancellation.
:::

::: details Q: Những cạm bẫy phổ biến với context là gì và bạn phát hiện chúng ra sao?
**Leak do quên cancel**: `WithTimeout` sinh ra một goroutine timer; quên `defer cancel()` sẽ leak nó cho tới khi parent context kết thúc. Dùng `go.uber.org/goleak` trong test để bắt lỗi này. Xem [Goroutine Leaks](./go-goroutine-leaks).

**Bỏ qua ctx trong thư viện**: bọc một thư viện không nhận context nghĩa là bạn không thể cancel công việc của nó. Cách xử lý tạm: chạy nó trong một goroutine, select trên ctx.Done() rồi giết/bỏ qua kết quả khi bị cancel (đồng thời cẩn thận với việc dọn dẹp).

**Lạm dụng WithValue**: các giá trị lưu trong context là `interface{}` — không có type safety lúc biên dịch, và việc truy xuất là một cuộc duyệt tuyến tính ngược lên cây context. Đừng nhét các struct lớn hay tham số hàm tùy chọn vào context; hãy truyền chúng như các đối số tường minh.

**Truyền một context đã cancel vào một request mới**: sau khi một handler trả về, context của nó đã bị cancel. Tạo công việc nền bằng nó sẽ thất bại ngay lập tức. Dùng `context.WithoutCancel(ctx)` (Go 1.21+) hoặc `context.Background()` cho các job nền cần sống lâu hơn request.
:::

## Câu hỏi đào sâu thường gặp

- Làm sao để lan truyền trace ID từ một HTTP request đến qua tất cả các lời gọi downstream?
- Tại call site, khác biệt giữa `context.Canceled` và `context.DeadlineExceeded` là gì?
- `context.WithoutCancel` (Go 1.21) khác thế nào so với việc dùng `context.Background()` cho các goroutine kiểu fire-and-forget?
- Làm sao để unit-test code có kiểm tra `ctx.Done()` mà không cần timer thật?
