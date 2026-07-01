---
title: Goroutine & Scheduler
description: Cách Go lập lịch goroutine, mô hình G-M-P, và những chi phí bạn phải trả.
tags: [concept, golang, concurrency]
category: tech-concepts
status: draft
---

# Goroutine & Scheduler

::: details Q: Vì sao goroutine rẻ hơn OS thread?
Một goroutine mới khởi tạo với **stack ~2 KB có thể lớn dần** (mặc định tối đa 1 GB), so với stack cố định 1–8 MB của một OS thread thông thường. Runtime của Go ghép nhiều goroutine lên một số ít OS thread hoàn toàn trong **user space** — không có syscall context-switch xuống kernel mỗi lần chuyển, không TLB flush, và không cần đến kernel scheduler.

Các thành phần chi phí khi spawn một goroutine: cấp phát stack, đưa G vào run queue của P, và zero một struct `runtime.g`. Ở mức benchmark: khoảng 2–4 µs và tầm 3 KB bộ nhớ. Một OS thread nặng hơn 10–100× trên cả hai trục này.

Đánh đổi: goroutine rẻ, nhưng không miễn phí. Vài nghìn thì thoải mái; nhưng hàng triệu có thể cạn kiệt bộ nhớ và làm tăng độ trễ lập lịch. Một goroutine bị leak chính là một memory/handle leak mà GC không thể thu hồi.
:::

::: details Q: Giải thích mô hình scheduler G-M-P.
Scheduler có ba thực thể:

| Ký hiệu | Tên | Vai trò |
|--------|------|------|
| **G** | Goroutine | Đơn vị công việc; giữ stack và PC của nó |
| **M** | Machine (OS thread) | Thực thi G; block khi gặp syscall |
| **P** | Processor (logical CPU) | Sở hữu một run queue; M cần P mới chạy được G |

`GOMAXPROCS` quyết định có bao nhiêu P (mặc định là `runtime.NumCPU()`). Chỉ những P đang chạy trên M mới thực sự thực thi code. Khi một M block ở syscall, runtime sẽ **park** cặp M+G đó và chuyển P sang một M khác (hoặc tạo M mới), nhờ đó các goroutine khác vẫn tiếp tục chạy. Khi syscall hoàn tất, G được đưa lại vào queue còn M dư thừa thì bị park.

Work-stealing: một P đang rảnh có thể "ăn cắp" một nửa số goroutine từ run queue của P khác, giữ cho mọi P đều bận rộn.
:::

::: details Q: Async preemption là gì và vì sao nó quan trọng?
Trước Go 1.14, preemption mang tính **cooperative**: scheduler chỉ có thể chuyển tại ranh giới các lệnh gọi hàm (nơi nó chèn một stack-growth check). Một goroutine CPU-bound không hề gọi hàm nào (một tight loop) có thể giữ M vô thời hạn, làm đói các goroutine khác và chặn cả quá trình stop-the-world của GC.

Từ Go 1.14, runtime dùng **async preemption qua tín hiệu signal** (SIGURG trên Unix). Nó bắn một signal tới M ở các safepoint, ngắt goroutine đang chạy và trả M về cho scheduler. Nhờ đó, ngay cả các tight loop cũng có thể bị preempt.

Tác động thực tế: bạn không còn "vô tình" làm đói scheduler bằng các vòng lặp tính toán nữa. Điểm cần lưu ý còn lại: một goroutine đang block trong một syscall không phải của Go (ví dụ qua `syscall.Syscall`) vẫn block M của nó cho tới khi syscall trả về.
:::

::: details Q: Runtime xử lý blocking I/O mà không block OS thread bằng cách nào?
Go dùng một **netpoller** (epoll trên Linux, kqueue trên macOS). Khi một goroutine thực hiện network I/O, runtime đăng ký file descriptor với poller, park goroutine (G) đó, rồi trả M về cho scheduler. Poller chạy trong thread riêng của nó và đưa G lại vào queue khi fd sẵn sàng.

Kết quả: 10.000 goroutine, mỗi cái chờ trên một TCP connection, tiêu tốn 10.000 G (rẻ) nhưng chỉ vài M.

Ngoại lệ: các **blocking syscall** không được netpoller can thiệp (file I/O trên hầu hết hệ thống, các lệnh gọi CGo) vẫn block M của chúng. Runtime phát hiện tình trạng đình trệ này và tạo một M mới để giữ P tiếp tục chạy. Quá nhiều blocking syscall đồng thời có thể gây bùng nổ số lượng M (theo dõi `runtime.NumGoroutine` so với số thread trong `runtime/metrics`).
:::

::: details Q: Có những cạm bẫy nào với GOMAXPROCS trong môi trường container?
`runtime.NumCPU()` đọc `/proc/cpuinfo` của host, chứ không phải CPU quota của container. Một container giới hạn 0.5 CPU trên một host 32 nhân sẽ khởi tạo `GOMAXPROCS=32`, tạo ra 32 P — mỗi P cố giành thời gian CPU mà nó sẽ không có được — gây **context-switching quá mức và overhead cho scheduler**.

Cách khắc phục: dùng `uber-go/automaxprocs` (gọi `maxprocs.Set()` lúc khởi động), thư viện này đọc CPU quota của Linux từ cgroup và đặt `GOMAXPROCS` cho phù hợp. Hoặc đặt `GOMAXPROCS` tường minh qua biến môi trường.

Dấu hiệu: nếu chỉ số CPU throttling (% container bị throttle) cao mà throughput lại thấp hơn kỳ vọng, thì GOMAXPROCS sai là một nguyên nhân rất có khả năng.
:::

## Câu hỏi đào sâu thường gặp

- `runtime.Gosched()` tương tác với scheduler ra sao và khi nào bạn sẽ gọi nó?
- Trong goroutine profile của pprof, khác biệt giữa một goroutine ở trạng thái parked, runnable và running là gì?
- Quá trình stop-the-world của GC tương tác thế nào với các goroutine đang chạy dưới cơ chế async preemption?
- Vì sao `GOMAXPROCS=1` đôi khi lại cải thiện throughput cho một số loại workload nhất định?
