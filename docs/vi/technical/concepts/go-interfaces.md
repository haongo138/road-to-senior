---
title: Interface & cái bẫy nil-interface
description: Interface của Go hoạt động ra sao dưới lớp vỏ, bug nil-interface kinh điển, và các nguyên tắc thiết kế.
tags: [concept, golang, language]
category: tech-concepts
status: draft
---

# Interface & cái bẫy nil-interface

::: details Q: Go thỏa mãn interface như thế nào, và bố cục (layout) của một interface value ra sao?
Go dùng **thỏa mãn theo cấu trúc (structural / implicit)**: một type thỏa mãn một interface nếu nó hiện thực tất cả các method của interface đó — không có keyword `implements`, không cần đăng ký. Điều này được quyết định lúc compile time.

Lúc runtime, một interface value là một **fat pointer hai từ (two-word)**:
```
[ itab pointer | data pointer ]
```
- **itab** (interface table): mã hóa concrete type và một bảng dispatch các con trỏ method. Được chia sẻ giữa mọi giá trị của cùng một cặp `(interface, concrete-type)`.
- **data pointer**: trỏ tới concrete value (hoặc giữ nó inline nếu nó vừa trong một từ và có kích thước bằng pointer).

Hệ quả: gọi một method qua interface kéo theo một lần dereference con trỏ thêm (tới itab) và một lời gọi con trỏ hàm — compiler không thể inline nó. Với các inner loop nóng thì điều này có ý nghĩa; với code server thông thường thì không.

Một interface là `nil` chỉ khi **cả hai** itab pointer và data pointer đều nil.
:::

::: details Q: Giải thích cái bẫy nil-interface — bug typed-nil error kinh điển.
Đây là một trong những bất ngờ hay gặp nhất của Go. Một interface giữ một **concrete pointer nil** thì bản thân nó lại **không nil**, vì từ itab là non-nil (nó mã hóa type).

```go
type MyError struct{ msg string }
func (e *MyError) Error() string { return e.msg }

func mayFail(fail bool) error {
    var err *MyError // typed nil pointer
    if fail {
        err = &MyError{"boom"}
    }
    return err // BUG: returns (type=*MyError, value=nil) — NOT a nil interface
}

func main() {
    err := mayFail(false)
    if err != nil { // true! even though the value is nil
        fmt.Println("unexpected error:", err) // panics on err.Error() — nil receiver
    }
}
```

**Cách sửa**: trả về interface `error` dưới dạng một `nil` trần, không phải một typed nil.
```go
func mayFail(fail bool) error {
    if fail {
        return &MyError{"boom"}
    }
    return nil // untyped nil → both itab and data are nil → interface is nil
}
```

Quy tắc bỏ túi: **đừng bao giờ trả về một typed nil qua một interface**. Nếu bạn buộc phải tính ra một concrete error rồi trả về, hãy trả về interface trực tiếp:
```go
var result *MyError = compute()
if result == nil {
    return nil   // not return result
}
return result
```
:::

::: details Q: Type assertion và type switch là gì, và khi nào chúng báo hiệu một design smell?
**Type assertion** trích xuất một concrete type ra khỏi một interface:
```go
var r io.Reader = os.Stdin

// panics if r is not *os.File
f := r.(*os.File)

// safe form — always prefer this
f, ok := r.(*os.File)
if ok {
    _ = f.Fd()
}
```

**Type switch** phân nhánh theo dynamic type:
```go
func describe(i any) string {
    switch v := i.(type) {
    case int:
        return fmt.Sprintf("int: %d", v)
    case string:
        return fmt.Sprintf("string: %q", v)
    default:
        return fmt.Sprintf("unknown: %T", v)
    }
}
```

Design smell: nếu bạn thấy mình thường xuyên type-switch trên các concrete type, thì abstraction đang sai — hãy thêm hành vi đó vào interface. Type assertion xuyên qua các package sẽ gắn chặt code với các unexported type và gãy khi concrete type thay đổi.

`errors.As` (xem note về error handling) là pattern được thừa nhận để kiểm tra kiểu của error.
:::

::: details Q: "Accept interfaces, return concrete types" nghĩa là gì, và vì sao?
Idiom này tối đa hóa sự linh hoạt ở cả hai phía:

- **Accept interfaces**: bên gọi truyền vào bất kỳ concrete type nào thỏa mãn hợp đồng. Điều này cho phép test với mock, tách rời các package, và giữ cho hàm tái sử dụng được.
- **Return concrete types**: bên gọi biết chính xác họ nhận được gì; họ có thể gọi các method không có trên interface mà không cần type assertion. Trả về một interface sẽ giấu đi type thật và buộc bên gọi phải assert — hoặc họ không mở rộng hành vi được.

```go
// GOOD: accepts io.Reader (any source), returns *csv.Reader (concrete — caller can set LazyQuotes etc.)
func newCSVReader(r io.Reader) *csv.Reader {
    return csv.NewReader(r)
}

// AVOID: returning interface loses the richer type
func newCSVReader(r io.Reader) io.Reader { ... } // caller can't set LazyQuotes
```

Ngoại lệ: trả về một interface error là idiomatic Go — error là một interface phổ quát và bên gọi mong đợi nó.

Hãy giữ interface **nhỏ và do consumer định nghĩa**: định nghĩa chúng trong package *sử dụng* chúng, không phải package hiện thực chúng. Một interface 1–3 method gần như luôn là kích thước đúng; io.Reader, io.Writer là chuẩn mực vàng.
:::

::: details Q: Empty interface (any) là gì, và cái giá của nó là gì?
`any` (alias của `interface{}`, Go 1.18+) chấp nhận bất kỳ giá trị nào. Nó được dùng cho các generic container thời chưa có generics, cho định dạng của `fmt`, và cho việc unmarshal JSON vào các hình dạng chưa biết.

Cái giá:
1. **Mất type safety lúc compile time** — sai lệch trở thành runtime panic.
2. **Cấp phát**: lưu một giá trị non-pointer vào một `any` thường gây một lần cấp phát trên heap (giá trị bị "đóng hộp" — boxed). Lưu một `uint32` vào `any` thì cấp phát; `*uint32` thì không (pointer được lưu trực tiếp trong từ data).
3. **Không inline**: dispatch động qua interface.

```go
// This allocates for each integer stored
var m map[string]any
m["count"] = 42 // 42 is boxed onto the heap

// Prefer typed maps or generics for performance-sensitive code
var m map[string]int
m["count"] = 42  // no allocation
```

Hãy với tới generics hoặc concrete type trước khi dùng `any` trong code mới. `any` phù hợp cho dữ liệu thực sự không đồng nhất (JSON, hệ thống plugin, các framework dựa trên reflection).
:::

## Câu hỏi đào sâu thường gặp

- Compiler quyết định khi nào các lời gọi method qua interface có thể được devirtualize/inline như thế nào?
- Vì sao bạn không thể so sánh hai interface value giữ các underlying type không so sánh được?
- Sự khác biệt giữa một nil pointer receiver và một nil interface trong dispatch method là gì?
- `errors.Is` và `errors.As` dùng type assertion nội bộ như thế nào?
