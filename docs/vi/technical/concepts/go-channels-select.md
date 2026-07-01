---
title: Channel & select
description: Channel unbuffered so với buffered, ngữ nghĩa của close, select, và các cạm bẫy deadlock.
tags: [concept, golang, concurrency]
category: tech-concepts
status: draft
---

# Channel & select

::: details Q: Khác biệt giữa channel unbuffered và buffered là gì, và bạn chọn buffer size như thế nào?
Một **channel unbuffered** (`make(chan T)`) đòi hỏi cả sender lẫn receiver cùng sẵn sàng tại một thời điểm — đây là một điểm đồng bộ / một cú handoff. Lệnh send block cho tới khi có receiver đến, và ngược lại. Dùng nó khi bạn muốn producer chờ consumer xác nhận đã nhận.

Một **channel buffered** (`make(chan T, n)`) cho phép gửi tối đa `n` lần trước khi block. Nó **tách rời** nhịp độ của producer và consumer: producer có thể chạy vượt lên trước tối đa `n` phần tử. Dùng nó khi:
- Producer có output dạng bùng nổ theo cụm và bạn muốn hấp thụ các đợt cao điểm mà không bỏ sót công việc.
- Buffer chính là núm điều chỉnh backpressure của bạn: khi đầy thì producer sẽ chậm lại.

Kinh nghiệm chọn kích thước: với channel jobs của một worker pool, `n = len(workers)` là một điểm khởi đầu phổ biến; với một buffer làm mượt tốc độ, hãy đo kích thước đợt bùng nổ bằng thực nghiệm. **Tránh dùng buffer lớn để thay cho việc sửa consumer chậm** — chúng che giấu backpressure và có thể phình bộ nhớ không giới hạn nếu consumer bị đình trệ.
:::

::: details Q: Các quy tắc khi close một channel là gì, và điều gì xảy ra khi bạn vi phạm chúng?
| Thao tác | Trên channel đang mở | Trên channel đã close | Trên channel nil |
|-----------|----------------|-------------------|----------------|
| Send | Block hoặc tiếp tục | **panic** | Block mãi mãi |
| Receive | Block hoặc tiếp tục | Trả về zero value, `ok=false` | Block mãi mãi |
| Close | Đóng nó | **panic** | **panic** |

Các quy tắc vàng:
1. **Chỉ sender/owner mới được close một channel** — receiver thì không bao giờ.
2. **Close đúng một lần** — dùng `sync.Once` hoặc một cờ done nếu nhiều writer cùng sở hữu.
3. Kiểm tra `ok` trong `v, ok := <-ch` khi bạn cần phân biệt một zero value thật với một channel đã close.

```go
for v := range ch { // safe: loop exits when ch is closed
    process(v)
}
```

Dạng `range` là pattern receiver đúng chuẩn idiomatic; nó tự xử lý việc kiểm tra `ok` bên trong.
:::

::: details Q: select hoạt động thế nào, và những hành vi không hiển nhiên của nó là gì?
`select` block cho tới khi một trong các case của nó có thể tiếp tục, rồi thực thi case đó. Nếu **nhiều case cùng sẵn sàng một lúc**, Go chọn một cách **ngẫu nhiên đồng đều (uniformly at random)** — điều này là cố ý để tránh starvation, nhưng nó có nghĩa là bạn không thể dựa vào thứ tự case để làm độ ưu tiên.

```go
select {
case msg := <-work:
    handle(msg)
case <-ctx.Done():
    return ctx.Err()
default:               // non-blocking: runs immediately if no case is ready
    // do other work
}
```

Các pattern chính:
- **`default`** khiến select trở nên non-blocking — hữu ích cho try-send/try-receive.
- **Timeout**: `case <-time.After(d)` tạo một timer cho mỗi lần gọi; ở các hot path hãy ưu tiên `time.NewTimer` và tái sử dụng.
- **Vô hiệu hóa một case**: gán channel bằng `nil` — một case với channel nil sẽ không bao giờ được chọn. Hữu ích để ngừng đọc từ một trong hai channel sau khi channel đó đã xong.

```go
var second <-chan int = nil // this case is permanently disabled
select {
case v := <-first:  process(v)
case v := <-second: unreachable()
}
```
:::

::: details Q: Điều gì gây ra deadlock với channel và bạn chẩn đoán nó ra sao?
Deadlock xảy ra khi mọi goroutine đều đang block chờ lẫn nhau. Runtime của Go phát hiện tình trạng **tất cả goroutine đều bị block** và panic với thông báo `fatal error: all goroutines are asleep - deadlock!`.

Các nguyên nhân phổ biến:
- Gửi tới một channel unbuffered mà không có goroutine nào nhận: `ch <- v` trong `main` mà không ai đọc.
- Nhận từ một channel không bao giờ được ghi hoặc close: `<-ch` block mãi mãi.
- Chờ vòng tròn (circular wait): goroutine A chờ goroutine B, B lại chờ A.
- Quên close channel của một vòng `range` — vòng range block mãi mãi ngay cả sau khi toàn bộ dữ liệu đã được gửi.

Chẩn đoán: thông báo deadlock in ra stack của mọi goroutine. Ngoài ra, hãy dùng goroutine profile của `pprof` (`/debug/pprof/goroutine?debug=2`) trong các service chạy dài để tìm các goroutine bị kẹt ở thao tác channel.

Bộ phát hiện deadlock của runtime chỉ kích hoạt khi **tất cả** goroutine đều bị block. Một deadlock cục bộ (một số goroutine leak, số khác vẫn chạy) thì nó không thấy được — đó chính là vấn đề goroutine leak.
:::

::: details Q: Khi nào nên ưu tiên channel hơn mutex, và khi nào channel là công cụ sai?
Channel tỏa sáng khi:
- **Chuyển giao quyền sở hữu**: trao một giá trị cho đúng một consumer — không hề có shared state.
- **Pipeline và fan-out**: các goroutine nối với nhau bằng channel vốn dĩ dễ ghép nối tự nhiên.
- **Signaling / sự kiện vòng đời**: `close(done)` để broadcast tín hiệu hoàn thành tới N receiver.

Channel là công cụ sai khi bạn chỉ cần **bảo vệ một field dùng chung**. Bọc một counter trong `chan int` để tăng/giảm sẽ thêm overhead goroutine, một vòng round-trip đầy đủ qua scheduler, cùng rủi ro deadlock — trong khi `sync/atomic` hoặc `sync.Mutex` vừa đơn giản hơn vừa nhanh hơn 10–100×.

Quy tắc thực dụng: nếu bạn đang "giao tiếp" (trao đi dữ liệu hoặc quyền sở hữu), hãy dùng channel. Nếu bạn đang "canh giữ" (nhiều goroutine cần đọc/ghi cùng một vùng nhớ), hãy dùng mutex hoặc atomic. Xem [Channels vs Mutexes](./go-channels-vs-mutexes) để có so sánh sâu hơn.
:::

## Câu hỏi đào sâu thường gặp

- Bạn triển khai pattern timeout-kèm-retry bằng `select` và `time.NewTimer` như thế nào?
- Overhead bộ nhớ của một channel buffered so với một slice dùng làm queue là bao nhiêu?
- Vì sao `time.After` gây leak bộ nhớ trong các vòng lặp và bạn khắc phục ra sao?
- Làm sao để fan-in kết quả từ N goroutine vào một channel một cách an toàn mà không gặp data race?
