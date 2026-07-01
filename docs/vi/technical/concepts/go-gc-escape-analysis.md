---
title: GC & Escape Analysis
description: Concurrent tri-color GC của Go hoạt động thế nào, điều gì điều khiển nó, và compiler quyết định stack hay heap ra sao.
tags: [concept, golang, runtime]
category: tech-concepts
status: draft
---

# GC & Escape Analysis

::: details Q: Garbage collector của Go hoạt động thế nào, và các ràng buộc thiết kế then chốt của nó là gì?
GC của Go là một collector **concurrent, tri-color mark-sweep**. Nó chạy phần lớn song song cùng các application goroutine (không phải một pha stop-the-world cho toàn bộ quá trình thu hồi), nhờ đó giữ tail latency thấp — các mục tiêu production thường là **STW pause < 1 ms**, và < 100 µs là phổ biến.

Ba (bốn) pha:
1. **Mark setup** — một STW ngắn để bật write barrier.
2. **Concurrent mark** — các goroutine và các GC worker chạy đồng thời; write barrier đảm bảo các pointer mới cấp phát hoặc mới dời được nhìn thấy.
3. **Mark termination** — một STW ngắn để chốt lại trạng thái mark.
4. **Sweep** — chạy đồng thời, thu hồi các span chưa được đánh dấu.

Các ràng buộc thiết kế then chốt ảnh hưởng tới code của bạn:
- **Non-generational**: mỗi chu kỳ GC quét toàn bộ tập live, không chỉ các object "trẻ". Các object đoản mệnh trong thế hệ già không được gom lại để thu hồi rẻ. → Tốc độ cấp phát cao thì đắt hơn so với GC của JVM hay .NET.
- **Non-compacting**: bộ nhớ không bị dời. Địa chỉ pointer giữ nguyên ổn định (không cần pin object cho CGo), nhưng heap có thể phân mảnh theo thời gian.
- **Chi phí write barrier**: được bật trong pha concurrent mark; mỗi lần lưu một pointer đều chịu một overhead nhỏ.

Đánh đổi: latency thấp và dễ dự đoán, đổi lại có thể tốn nhiều bộ nhớ và CPU hơn với các workload cấp phát nhiều. G1/ZGC của JVM có thể đạt throughput cao hơn khi bạn sẵn lòng tinh chỉnh các generation.
:::

::: details Q: GOGC và GOMEMLIMIT điều khiển cái gì, và khi nào bạn thay đổi chúng?
**`GOGC`** (mặc định `100`) là một tỷ lệ phần trăm: GC được kích hoạt khi live heap đã tăng thêm `GOGC`% kể từ lần thu hồi trước. `GOGC=200` nghĩa là GC nổ khi heap tăng gấp đôi — ít chu kỳ hơn, dùng nhiều bộ nhớ hơn. `GOGC=off` tắt GC hoàn toàn (chỉ dùng cho batch job).

**`GOMEMLIMIT`** (Go 1.19+) đặt một **giới hạn tổng bộ nhớ mềm (soft)** cho runtime. Khi tiến trình tiến gần tới giới hạn, GC được kích hoạt gắt hơn, đè lên `GOGC`. Điều này ngăn các đợt OOM kill một cách dễ dự đoán hơn so với chỉ dựa vào `GOGC`.

Cách tinh chỉnh điển hình:
```
# container with 512 MB limit → let runtime use ~400 MB before GC fights back
GOMEMLIMIT=400MiB
GOGC=100          # keep default; GOMEMLIMIT is the real guard
```

Khi nào nên tăng `GOGC`:
- Các batch job nhạy về throughput nơi headroom bộ nhớ dồi dào.
- Profiling cho thấy GC ngốn > 5–10% CPU và việc cấp phát là không thể tránh.

Khi nào nên đặt `GOMEMLIMIT`:
- Bất kỳ workload chạy trong container nào có giới hạn bộ nhớ cứng — đây giờ là núm chỉnh chính được khuyến nghị (tài liệu Go 1.21+ gợi ý đặt nó ở khoảng ~90% giới hạn của container).

Đừng tinh chỉnh mù quáng: hãy đo bằng `runtime/metrics`, các heap profile của `pprof`, hoặc các metric Prometheus `go_gc_*` trước đã.
:::

::: details Q: Escape analysis là gì, và compiler quyết định stack hay heap như thế nào?
Compiler chạy **escape analysis** trong lúc biên dịch để xác định *vòng đời* của mỗi lần cấp phát. Các biến không sống lâu hơn frame hàm của chúng được đặt trên **stack của goroutine** (rất nhanh; không dính líu GC — được thu hồi khi frame pop). Các biến *escape* (thoát ra) được đặt trên **heap** (cấp phát chậm hơn, tạo áp lực GC).

Xem xét các quyết định escape:
```bash
go build -gcflags="-m -m" ./... 2>&1 | grep escape
```

Các tác nhân gây escape phổ biến:
- **Trả về một pointer tới một biến local**: biến local phải sống lâu hơn frame → heap.
- **Lưu vào một interface**: compiler mất thông tin về concrete type; giá trị phải đánh địa chỉ được trên heap.
- **Closure bắt một biến theo tham chiếu** (chứ không theo giá trị).
- **Các slice tăng vượt quá backing array cấp phát trên stack** (ví dụ, `make([]int, 0, n)` khi `n` quá lớn hoặc động).
- **`fmt.Println` và bạn bè của nó**: chúng nhận `interface{}`, nên các đối số escape.

```go
func stackAlloc() int {
    x := 42   // stays on stack; x doesn't escape
    return x
}

func heapAlloc() *int {
    x := 42   // escapes: pointer returned to caller
    return &x
}
```

Đánh đổi: cấp phát trên stack gần như miễn phí (bump pointer); heap thêm overhead của allocator (~25 ns mỗi lần cấp phát) cộng chi phí GC scan. Nhưng vi tối ưu các escape mà không profiling là quá sớm — hãy tập trung vào các hot loop mà `pprof` chỉ ra.
:::

::: details Q: Bạn đo lường và chẩn đoán áp lực GC trong production như thế nào?
**Các công cụ chính:**

| Tín hiệu | Cách lấy |
|---|---|
| GC CPU % | `runtime/metrics`: `/gc/cpu:user-time` |
| Heap in-use | heap profile của `pprof` (`go tool pprof -alloc_objects`) |
| GC pause | `GODEBUG=gctrace=1` in ra độ dài STW mỗi chu kỳ |
| Alloc hotspot | `pprof` với `-sample_index=alloc_space` |

```bash
# quick in-process heap profile
curl http://localhost:6060/debug/pprof/heap > heap.prof
go tool pprof -http=: heap.prof
```

Dấu hiệu cảnh báo: GC CPU > 10% tổng CPU; các đợt tăng vọt P99 request latency tương quan với các chu kỳ GC; heap in-use dao động mạnh (cho thấy nhiều lần cấp phát lớn đoản mệnh).

Chiến lược khắc phục (theo thứ tự ROI):
1. **Giảm cấp phát**: dùng `sync.Pool` cho các object hay được cấp phát/giải phóng, định kích thước trước cho slice/map, tránh `fmt.Sprintf` trong các hot path (dùng `strconv`).
2. **Giảm kích thước tập live**: giải phóng tham chiếu sớm hơn; tránh các global cache lớn không có TTL eviction.
3. **Tinh chỉnh `GOMEMLIMIT`/`GOGC`**: chỉ sau khi đã làm (1) và (2).
:::

::: details Q: sync.Pool là gì và khi nào nó giúp — hoặc gây hại?
`sync.Pool` là một cache các object tái sử dụng được **gắn phạm vi theo các chu kỳ GC**. Các object trong pool có thể bị thu hồi ở bất kỳ lần GC nào; pool không phải là một kho lưu trữ bền vững.

```go
var bufPool = sync.Pool{
    New: func() any { return new(bytes.Buffer) },
}

func handler(w http.ResponseWriter, r *http.Request) {
    buf := bufPool.Get().(*bytes.Buffer)
    buf.Reset()
    defer bufPool.Put(buf)
    // ... use buf
}
```

**Khi nào nó giúp**: các object đoản mệnh, hay được cấp phát, có kích thước tương đồng (buffer, không gian nháp của encoder). Giảm áp lực GC nhờ tái dùng bộ nhớ giữa các request.

**Khi nào nó gây hại hoặc gây hiểu lầm**:
- Object có finalizer hoặc tài nguyên bên ngoài — các item được pool sẽ không được đóng một cách đáng tin cậy.
- Các item có kích thước dao động dữ dội — bạn rốt cuộc giữ sống những lần cấp phát quá khổ.
- Dùng như một cache thông thường — object trong pool có thể bị đuổi ở bất kỳ chu kỳ GC nào; để cache bền vững, hãy dùng một map với chính sách eviction.
- Hãy đo trước khi thêm: `sync.Pool` thêm một lớp gián tiếp; nếu việc cấp phát vốn không phải nút thắt, thì nó chỉ là sự phức tạp vô nghĩa.
:::

## Câu hỏi đào sâu thường gặp

- Write barrier tương tác với việc lập lịch goroutine như thế nào trong pha concurrent mark?
- Sự khác biệt giữa `alloc_space` và `inuse_space` trong các heap profile là gì?
- Khi nào bạn dùng `runtime.GC()` một cách tường minh trong test hoặc benchmark?
- `GOGC=off` tương tác với `GOMEMLIMIT` như thế nào?
