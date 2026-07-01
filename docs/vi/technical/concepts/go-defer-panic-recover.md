---
title: defer, panic, recover
description: Ngữ nghĩa chính xác của defer (LIFO, thời điểm đánh giá đối số), sự lan truyền của panic, và ranh giới của recover.
tags: [concept, golang, language]
category: tech-concepts
status: draft
---

# defer, panic, recover

::: details Q: Ngữ nghĩa chính xác của defer là gì — LIFO, đánh giá đối số, và named return?
`defer` đẩy một lời gọi hàm lên một **stack LIFO** riêng cho từng goroutine. Các lời gọi được defer sẽ thực thi khi hàm bao quanh *return* (return bình thường hoặc panic), theo thứ tự ngược với thứ tự khai báo.

**Đối số được đánh giá ngay tại câu lệnh defer, chứ không phải khi lời gọi defer chạy:**
```go
func demo() {
    x := 1
    defer fmt.Println(x) // captures x=1 NOW
    x = 99
    // prints 1, not 99
}
```

Để nắm giá trị hiện tại tại thời điểm gọi, hãy dùng một closure:
```go
defer func() { fmt.Println(x) }() // prints 99 — x is read at call time
```

**Named return value** có thể bị chỉnh sửa bởi một closure được defer — đây là cách duy nhất mà `defer` có thể thay đổi thứ mà một hàm thực sự trả về:
```go
func readFile(path string) (err error) {
    f, err := os.Open(path)
    if err != nil {
        return
    }
    defer func() {
        if cerr := f.Close(); cerr != nil && err == nil {
            err = cerr // modifies the named return
        }
    }()
    // ...
    return
}
```
Pattern này rất hữu ích để bọc các lỗi từ Close, nhưng có thể gây bất ngờ nếu không được ghi chú rõ.
:::

::: details Q: Những cạm bẫy thường gặp với defer là gì, đặc biệt là bên trong vòng lặp?
**Defer trong vòng lặp**: các lời gọi được defer tích tụ lại cho tới khi *hàm bao quanh* return — chứ không phải khi vòng lặp kết thúc một lần chạy. Trong một vòng lặp chạy lâu, điều này nghĩa là tài nguyên (file handle, connection) bị giữ suốt vòng đời của cả hàm:

```go
// BAD: files not closed until processAll returns
func processAll(paths []string) error {
    for _, p := range paths {
        f, err := os.Open(p)
        if err != nil {
            return err
        }
        defer f.Close() // accumulates — all files open at once!
        process(f)
    }
    return nil
}

// GOOD: close each file immediately by extracting a helper
func processAll(paths []string) error {
    for _, p := range paths {
        if err := processOne(p); err != nil {
            return err
        }
    }
    return nil
}
func processOne(path string) error {
    f, err := os.Open(path)
    if err != nil {
        return err
    }
    defer f.Close() // scoped to processOne
    return process(f)
}
```

**Bắt biến vòng lặp (loop variable capture)** (trước Go 1.22): defer một closure tham chiếu tới biến vòng lặp sẽ bắt lấy *biến*, chứ không phải giá trị của nó. Từ Go 1.22+ trở đi, biến vòng lặp là riêng cho từng vòng lặp; ở các phiên bản cũ hơn bạn cần viết `p := p` bên trong vòng lặp trước câu lệnh defer.

**Method được defer trên một receiver nil**: nếu bạn defer một lời gọi method mà receiver là nil, lời gọi được defer đó sẽ panic khi nó chạy (tại thời điểm return, chứ không phải tại câu lệnh defer).
:::

::: details Q: panic và recover hoạt động ra sao, và các quy tắc là gì?
`panic` tháo gỡ (unwind) call stack của goroutine hiện tại, chạy các hàm được defer ở mỗi frame, cho tới khi một trong hai điều xảy ra:
- Một hàm được defer gọi `recover()`, việc này dừng quá trình unwind và trả về giá trị panic.
- Stack được tháo gỡ hoàn toàn → chương trình crash cùng với một stack trace.

**`recover` chỉ có tác dụng bên trong một hàm được defer và được gọi trực tiếp trong lúc panic:**
```go
func safe() (err error) {
    defer func() {
        if r := recover(); r != nil {
            err = fmt.Errorf("recovered: %v", r)
        }
    }()
    panic("oh no") // caught by the deferred func above
}
```

Nếu `recover` được gọi bên ngoài một hàm được defer (hoặc trong một hàm được defer nhưng lại được gọi từ một hàm khác), nó trả về `nil` và không làm gì cả.

**Một panic trong goroutine này không thể được recover ở goroutine khác.** Nếu nó tháo gỡ tới tận gốc của goroutine mà không được recover, toàn bộ chương trình sẽ crash. Đó là lý do các thư viện tự sinh goroutine bên trong phải recover panic ngay trong chính những goroutine đó.
:::

::: details Q: Khi nào nên dùng panic thay vì trả về error?
**Trả về error cho những tình huống dự đoán được và có thể khôi phục** — file không tìm thấy, network timeout, input người dùng không hợp lệ. Đây là phong cách chủ đạo của Go và ăn khớp với triết lý "errors are values."

**Dùng panic cho:**
1. **Lỗi lập trình** mà lẽ ra không bao giờ xảy ra trong code đúng — index out of bounds, nil dereference, type assertion trên một giá trị bắt buộc phải thuộc một kiểu cụ thể. Runtime dù sao cũng panic cho những trường hợp này.
2. **Thất bại khi khởi tạo** lúc startup (ví dụ pattern `mustCompile`) khi việc tiếp tục là vô nghĩa:
```go
var re = regexp.MustCompile(`^\d+$`) // panics at init if regex is invalid
```
3. **Vượt qua ranh giới package hoặc goroutine** để ngăn một panic rò rỉ ra khỏi thư viện và trở thành một cú crash ở phía caller — recover tại ranh giới và chuyển đổi thành error.

**Đừng bao giờ dùng panic cho luồng điều khiển thông thường** — nó tốn kém (do stack unwinding), không idiomatic, và làm cho việc lập luận về tính đúng đắn của code khó hơn. Một panic vượt qua ranh giới package là một sự vi phạm hợp đồng (contract).

Dấu hiệu cần để ý: nếu bạn thấy mình viết `recover` thường xuyên trong các đường thực thi production, thì bạn đang chống lại ngôn ngữ — hãy cân nhắc lại xem errors-as-values có mô hình hóa domain tốt hơn không.
:::

::: details Q: Làm sao dùng defer để cleanup một cách an toàn — và khi nào nó không hoạt động?
Pattern defer chuẩn mực cho việc cleanup:
```go
f, err := os.Open(path)
if err != nil {
    return err
}
defer f.Close()
```

**Kiểm tra error từ Close**: `f.Close()` trên một file có thể ghi sẽ flush các buffer và có thể thất bại. Nếu bạn dùng `defer f.Close()` một cách trơn tru, error đó sẽ bị âm thầm bỏ đi. Hãy dùng một named return để nắm lấy nó:
```go
func writeFile(path string, data []byte) (err error) {
    f, err := os.Create(path)
    if err != nil {
        return
    }
    defer func() {
        if cerr := f.Close(); cerr != nil && err == nil {
            err = cerr
        }
    }()
    _, err = f.Write(data)
    return
}
```

**Khi defer không hoạt động**: các lời gọi được defer chạy khi *hàm* return. Với các server handler sống lâu, giữ mở một database transaction xuyên suốt nhiều lời gọi con, thì một panic không được recover trong một goroutine sinh ra bên trong handler sẽ không kích hoạt được lời rollback đã được defer của transaction đó. Hãy giữ cho phần cleanup được defer có phạm vi thật gọn.

**Hiệu năng**: mỗi `defer` có một chi phí nhỏ (do runtime phải ghi sổ). Từ Go 1.14+ trở đi, inline defer (cho các defer không nằm trong vòng lặp và không có closure cấp phát trên heap) đã giảm chi phí này xuống gần như bằng không. Với những đường thực thi cực nóng, hãy đo lường trước khi loại bỏ defer vì lý do hiệu năng.
:::

## Câu hỏi đào sâu thường gặp

- Một hàm được defer có thể tự panic không? Điều gì sẽ xảy ra?
- defer tương tác với `os.Exit` như thế nào? (nó không — các hàm được defer không chạy khi gọi `os.Exit`)
- Quy ước đặt tên `must` / `MustX` là gì và khi nào thì nó phù hợp cho các API công khai?
- Làm sao recover từ một panic vượt qua ranh giới goroutine được một thư viện sinh ra?
