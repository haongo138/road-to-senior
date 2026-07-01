---
title: Các sync Primitive
description: Mutex, RWMutex, WaitGroup, Once, Pool — cách dùng đúng và những lỗi kinh điển.
tags: [concept, golang, concurrency]
category: tech-concepts
status: draft
---

# Các sync Primitive

::: details Q: Khi nào chọn Mutex thay vì RWMutex, và khi nào RWMutex gây hại?
`sync.Mutex` cho phép mỗi lần một goroutine — cả đọc lẫn ghi đều chặn lẫn nhau.

`sync.RWMutex` cho phép **nhiều reader đồng thời** (`RLock`/`RUnlock`) nhưng chỉ **một writer** (`Lock`/`Unlock`). Nó có ích khi số lần đọc áp đảo số lần ghi và critical section không hề tầm thường.

Khi nào RWMutex gây hại:
- **Critical section ngắn** (đọc/ghi một field): phần bookkeeping thêm của RWMutex có thể khiến nó chậm hơn cả một Mutex thường. Hãy benchmark trước khi đổi.
- **Workload nặng về ghi**: các writer bị đói phía sau một đám đông reader dồn dập (bản triển khai của Go có ưu tiên cho writer một khi đã có một writer chờ, nhưng mức tranh chấp vẫn cao hơn).
- **Gánh nặng nhận thức lớn hơn**: bạn phải chắc chắn các nhánh `RLock` không bao giờ mutate state — lẫn lộn giữa Lock/RLock lúc áp lực là một lỗi phổ biến.

Mặc định: hãy chọn `sync.Mutex`. Chỉ nâng cấp lên `RWMutex` sau khi profiling cho thấy có lock contention trên một nhánh nặng về đọc.
:::

::: details Q: Race kinh điển của WaitGroup là gì và bạn phòng tránh nó ra sao?
Race chính là **gọi `wg.Add(1)` bên trong goroutine** mà bạn vừa khởi chạy:

```go
// WRONG: Add races with Wait
for _, item := range items {
    go func(item Item) {
        wg.Add(1)        // might run after wg.Wait() returns
        defer wg.Done()
        process(item)
    }(item)
}
wg.Wait()
```

Nếu goroutine bị preempt trước khi kịp `Add(1)`, `Wait` có thể trả về trong khi công việc vẫn còn dang dở.

Pattern đúng — **Add trước khi go**:

```go
for _, item := range items {
    wg.Add(1)
    go func(item Item) {
        defer wg.Done()
        process(item)
    }(item)
}
wg.Wait()
```

Thêm nữa: không bao giờ copy một `WaitGroup` — bộ đếm nội bộ của bản copy là tách biệt. Luôn truyền bằng con trỏ hoặc nhúng trong một struct được truy cập qua con trỏ. `go vet` bắt được các trường hợp copy kiểu sync.
:::

::: details Q: sync.Once đảm bảo điều gì và giới hạn của nó là gì?
`sync.Once.Do(f)` đảm bảo `f` được gọi **đúng một lần** trên toàn bộ các goroutine, ngay cả khi `Do` được gọi đồng thời. Nó block tất cả các caller đồng thời cho tới khi `f` trả về.

```go
var (
    instance *DB
    once     sync.Once
)

func GetDB() *DB {
    once.Do(func() {
        instance = connect() // called once; all others block until done
    })
    return instance
}
```

Giới hạn:
- Nếu `f` panic, `Once` vẫn coi như đã xong — các lời gọi `Do` sau đó trở thành no-op. Panic lan tới caller đầu tiên nhưng không tới các caller sau (chúng trả về với `instance` vẫn còn nil). Hãy thiết kế phần khởi tạo sao cho không panic, hoặc recover ngay bên trong `f`.
- `Once` không thể reset — nó dành cho khởi tạo một lần duy nhất thực sự. Nếu bạn cần init có thể retry khi thất bại, bạn phải tự dựng một pattern riêng.
:::

::: details Q: sync.Pool là gì và khi nào nó không phải là một cache?
`sync.Pool` là một **pool các đối tượng tạm thời an toàn với thread**, giúp giảm áp lực GC bằng cách tái sử dụng các allocation. Get lấy ra một đối tượng (hoặc gọi `New` nếu pool rỗng); Put trả nó về.

```go
var bufPool = sync.Pool{
    New: func() any { return new(bytes.Buffer) },
}

func encode(v any) []byte {
    buf := bufPool.Get().(*bytes.Buffer)
    buf.Reset()
    defer bufPool.Put(buf)
    json.NewEncoder(buf).Encode(v)
    return buf.Bytes()
}
```

**Không phải một cache**: GC **dọn sạch pool mỗi lần thu gom** (cứ mỗi hai chu kỳ GC kể từ Go 1.13, thông qua cơ chế victim cache). Những đối tượng bạn bỏ vào không được đảm bảo sẽ còn ở đó vào lần Get kế tiếp. Đừng bao giờ dùng Pool cho các đối tượng phải sống sót qua các chu kỳ GC (DB connection, file đang mở, rate-limiter). Với những thứ đó, hãy dùng một connection pool hoặc một channel buffered.

Ngoài ra: luôn `Reset()` hoặc zero đối tượng trước khi trả nó về pool — bạn đang trao nó cho một caller kế tiếp không xác định.
:::

::: details Q: Quy tắc "không bao giờ copy" cho các kiểu sync là gì?
`sync.Mutex`, `sync.RWMutex`, `sync.WaitGroup`, `sync.Cond` và `sync.Once` đều chứa **state nội bộ** (lock, counter) vốn trở nên vô nghĩa khi bị copy. Copy một cái sẽ cho bạn hai primitive độc lập với cùng một state khởi đầu — bất kỳ bất biến nào chúng bảo vệ đều lập tức bị phá vỡ.

```go
type Cache struct {
    mu   sync.Mutex // embedded by value — OK
    data map[string]string
}

// WRONG: c passed by value copies the mutex
func process(c Cache) { c.mu.Lock(); ... }

// CORRECT: pass by pointer
func process(c *Cache) { c.mu.Lock(); ... }
```

`go vet` (và bộ phân tích `copylocks` bên dưới nó) sẽ bắt các trường hợp vô tình copy những kiểu này — hãy chạy nó trong CI. Sentinel `noCopy` (`sync.noCopy`) chính là cơ chế giúp việc phát hiện này khả thi.
:::

## Câu hỏi đào sâu thường gặp

- Khi nào bạn sẽ chọn `sync/atomic` thay vì một Mutex, và các đảm bảo về memory-ordering của nó là gì?
- `sync.Cond` khác một channel như thế nào khi dùng để signalling, và khi nào nó là lựa chọn tốt hơn?
- Khác biệt giữa victim cache của `sync.Pool` (Go 1.13+) và hành vi clear-on-GC cũ hơn là gì?
- Làm sao để profile mutex contention trong một Go service đang chạy?
