---
title: Data Race & Memory Model
description: Data race là gì, vì sao chúng gây ra undefined behavior, race detector, và happens-before.
tags: [concept, golang, concurrency]
category: tech-concepts
status: draft
---

# Data Race & Memory Model

::: details Q: Data race là gì và vì sao nó là undefined behavior chứ không đơn thuần là một giá trị sai?
Một data race xảy ra khi **hai goroutine truy cập cùng một vùng nhớ một cách đồng thời, có ít nhất một truy cập là write, và giữa chúng không có sự synchronization** nào.

"Undefined behavior" nghĩa là compiler và CPU được tự do sắp xếp lại, cache, hoặc tối ưu các truy cập theo hướng giả định rằng không có ai sửa đổi đồng thời. Cụ thể:
- CPU có thể giữ giá trị write trong store buffer; bên đọc có thể thấy một giá trị cũ từ cache của mình.
- Compiler có thể kéo (hoist) một lệnh read ra khỏi vòng lặp vì nó "biết" không ai khác ghi vào biến đó.
- Trên các kiến trúc weak-memory (ARM), các store từ một core có thể trở nên hiển thị với các core khác theo một thứ tự khác.

Vì vậy bug ở đây không chỉ là "bạn có thể đọc phải giá trị cũ" — mà là "hành vi của chương trình trở nên khó lường theo cách có thể làm hỏng cả những vùng nhớ không liên quan" (ví dụ, một struct bị ghi dở dang, hay một slice header có length cũ nhưng pointer đã cập nhật).

Memory model của Go (go.dev/ref/mem) nói rõ: **một data race trên bất kỳ giá trị non-atomic, non-synchronized nào đều là undefined behavior**.
:::

::: details Q: Bạn dùng race detector như thế nào, và giới hạn của nó là gì?
Bật bằng flag `-race`:

```bash
go test -race ./...
go run -race main.go
go build -race -o server_race ./cmd/server
```

Race detector **chèn instrumentation vào mọi truy cập bộ nhớ** lúc compile và theo dõi các truy cập lúc runtime. Khi hai goroutine truy cập cùng một địa chỉ một cách đồng thời mà không có synchronization, nó in ra một báo cáo chi tiết kèm stack trace của cả hai truy cập.

Chi phí: overhead CPU khoảng 5–10×, overhead bộ nhớ khoảng 2–8×. Hãy chạy trong CI và test suite, không phải production.

**Giới hạn**:
- Nó chỉ phát hiện những race **thực sự được thực thi** trong lần chạy đó. Một race nằm trong nhánh code không được test thì vô hình.
- Nó là điều kiện cần chứ không đủ: một chương trình pass `-race` không được chứng minh là race-free — chỉ là không có race nào phát ra trong lần thực thi đó.
- Nó không phát hiện được mọi lỗi concurrency (ví dụ, atomicity violation, deadlock, logic race).

Thực hành tốt: chạy `-race` trong mọi lần test (unit + integration), và trong một môi trường staging giống production với traffic thật.
:::

::: details Q: "Happens-before" nghĩa là gì trong memory model của Go và điều gì thiết lập nó?
**Happens-before** là một đảm bảo về thứ tự mang tính hình thức: nếu sự kiện A happens-before sự kiện B, thì B được đảm bảo quan sát được mọi write mà A đã thực hiện (và mọi thứ A đã quan sát).

Các thao tác synchronization thiết lập happens-before trong Go:

| Thao tác | Đảm bảo |
|-----------|-----------|
| `ch <- v` (send) | happens-before khi `<-ch` (receive) tương ứng hoàn tất |
| `close(ch)` | happens-before một receive trả về giá trị zero do channel đã đóng |
| `sync.Mutex` unlock | happens-before lần lock kế tiếp |
| `sync.WaitGroup.Done()` | happens-before khi `Wait()` trả về |
| các thao tác `sync/atomic` | happens-before các thao tác atomic sau đó trên cùng biến (từ Go 1.19) |
| hoàn tất `init()` | happens-before khi `main.main` bắt đầu |

Bất cứ điều gì không nằm trong danh sách đó đều không có thứ tự. Một write ở goroutine A rồi tới một read ở goroutine B mà giữa hai bên không có synchronization thì **không có thứ tự nào được đảm bảo**.
:::

::: details Q: Đâu là những race kinh điển trong Go hay khiến người ta vấp ngã?
**Truy cập map đồng thời**:
```go
m := map[string]int{}
go func() { m["a"] = 1 }()
go func() { _ = m["a"] }() // concurrent read+write → fatal runtime error
```
Map không an toàn khi dùng đồng thời. Runtime phát hiện các concurrent map write và panic (`concurrent map write`), nhưng read+write mà write không thực sự đồng thời thì có thể âm thầm làm hỏng dữ liệu. Hãy dùng `sync.Map` hoặc một `sync.RWMutex`.

**Bắt biến vòng lặp trước Go 1.22**:
```go
// Go < 1.22: all goroutines see the same `v` (last iteration's value)
for _, v := range items {
    go func() { process(v) }() // BUG
}
// Fix (Go < 1.22): shadow the variable
for _, v := range items {
    v := v
    go func() { process(v) }()
}
```
Từ Go 1.22 trở đi, biến vòng lặp được bắt theo giá trị ở mỗi lần lặp, khắc phục vấn đề này một cách mặc định.

**Cờ (flag) không được synchronize**:
```go
var ready bool
go func() { ready = true }()   // write
if ready { ... }               // concurrent read — data race
```
Hãy dùng `sync/atomic.Bool` hoặc một channel để báo hiệu trạng thái sẵn sàng.
:::

::: details Q: Tính đúng đắn từ race detector khác gì với tính đúng đắn từ thiết kế?
Race detector cho bạn biết một race đã xảy ra. Nó không cho bạn biết thiết kế synchronization của bạn là đúng khi không có race nào phát ra.

**Tính đúng đắn từ thiết kế** nghĩa là: với mỗi biến dùng chung, bạn đã xác định ai sở hữu nó, cái gì synchronize việc truy cập, và đã kiểm chứng rằng mọi nhánh code đều acquire đúng lock hoặc dẫn dữ liệu qua đúng primitive — trước cả khi test. Đây là cách duy nhất để tự tin về những nhánh chưa được test.

Kỷ luật thực hành:
1. Thiết kế quyền sở hữu trước: với mỗi shared resource, ghi rõ (những) goroutine nào truy cập nó và cái gì synchronize chúng.
2. Dùng `-race` để bắt các sai sót trong thiết kế.
3. Dùng `go vet` để bắt các lock bị quên và các sync-type bị copy.
4. Với code quan trọng, thêm các comment nêu bất biến (invariant, ví dụ `// mu must be held`) và cân nhắc dùng `go.uber.org/nilaway` cùng các công cụ phân tích tĩnh.

Race detector là lưới an toàn của bạn, không phải kiến trúc của bạn.
:::

## Câu hỏi đào sâu thường gặp

- `sync/atomic` so với Mutex thế nào về mặt đảm bảo memory-ordering sau Go 1.19?
- Sự khác biệt giữa một data race và một race condition (logic race) là gì?
- Bạn chẩn đoán thế nào một race chỉ xuất hiện dưới tải production nhưng không xuất hiện trong test?
- Vì sao Go runtime panic khi có concurrent map write nhưng không panic với concurrent map read?
