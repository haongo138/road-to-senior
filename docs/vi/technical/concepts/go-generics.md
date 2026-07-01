---
title: Generics
description: Generics trong Go — type parameter, constraint, GC-shape stenciling, và khi nào dùng generics thay vì interface hay kiểu cụ thể.
tags: [concept, golang, language]
category: tech-concepts
status: draft
---

# Generics

::: details Q: Type parameter và constraint trong Go generics là gì?
Go 1.18 giới thiệu generics thông qua **type parameter** — đặt trong dấu ngoặc vuông sau tên hàm hoặc tên kiểu:
```go
func Map[S, T any](slice []S, f func(S) T) []T {
    out := make([]T, len(slice))
    for i, v := range slice {
        out[i] = f(v)
    }
    return out
}
```

Một **constraint** là một interface giới hạn những kiểu nào có thể được thế vào cho một type parameter. `any` có sẵn cho phép mọi kiểu; `comparable` cho phép những kiểu hỗ trợ `==`/`!=` (bắt buộc để làm key của map).

Toán tử `~` khớp với một kiểu **và mọi kiểu có underlying type đó**:
```go
type Celsius float64

type Number interface {
    ~int | ~int64 | ~float32 | ~float64
}
// Celsius satisfies Number because its underlying type is float64
```

Các package thư viện chuẩn `cmp`, `slices`, và `maps` (Go 1.21) được xây dựng dựa trên các constraint này và thay thế cho nhiều hàm tiện ích viết tay:
```go
slices.Sort(s)                     // works for any []E where E is cmp.Ordered
slices.Contains(s, v)
maps.Keys(m)
```
:::

::: details Q: Generics trong Go được cài đặt ra sao — và GC-shape stenciling nghĩa là gì?
Generics trong Go dùng **GC-shape stenciling** — *chứ không phải* monomorphization đầy đủ (một bản biên dịch riêng cho mỗi kiểu cụ thể) như template của C++ hay generics của Rust.

Trình biên dịch nhóm các kiểu theo **GC shape** của chúng — nói nôm na là những kiểu có cùng bố cục con trỏ (pointer layout) sẽ dùng chung một bản instantiation đã biên dịch. Mọi kiểu con trỏ (`*T` với bất kỳ `T` nào) dùng chung một shape; mọi kiểu non-pointer cỡ `int` dùng chung một shape khác.

Khi hai kiểu dùng chung một shape, runtime dùng một **dictionary** (một đối số ẩn thêm vào) để giữ metadata riêng của từng kiểu (kích thước, hàm so sánh bằng, hàm hash, bảng method của interface). Code generic gọi thông qua dictionary này để thực hiện các thao tác phụ thuộc vào kiểu.

Các hệ quả thực tế:
- **Ít phình code hơn** so với monomorphization đầy đủ — kích thước binary tăng ít hơn.
- **Nhiều lớp gián tiếp (indirection) hơn** so với monomorphization đầy đủ — việc gọi qua dictionary ngăn cản một số tối ưu (inlining, devirtualization). Một hàm generic trên các kiểu con trỏ có thể chậm hơn một hàm chuyên biệt cho kiểu trong các đường thực thi nóng.
- **Không phải zero-cost**: các benchmark trên vòng lặp chặt (sort, min/max) cho thấy generics có thể nằm trong khoảng 5–10% so với các phiên bản cụ thể viết tay; với interface constraint thì khoảng cách có thể lớn hơn.

Đây là một chi tiết cài đặt, không phải một cam kết của ngôn ngữ. Đội ngũ Go có thể cải thiện stenciling theo thời gian. Hãy đo bằng benchmark trước khi kết luận rằng generics quá chậm.
:::

::: details Q: Khi nào nên dùng generics thay vì interface hay kiểu cụ thể?
**Dùng generics** khi:
- Logic **giống hệt nhau qua nhiều kiểu** và chỉ khác ở kiểu (các kiểu container: `Stack[T]`, `Set[T]`; các thuật toán: `slices.Sort`, `Map`, `Filter`, `Reduce`).
- Bạn muốn **an toàn kiểu tại thời điểm biên dịch** mà không phải chịu overhead runtime của việc boxing interface.
- Bạn đang viết một thư viện nơi caller cung cấp kiểu.

**Dùng interface** khi:
- Logic phụ thuộc vào **hành vi** — các kiểu cụ thể khác nhau cài đặt cùng một method theo cách khác nhau (đa hình). Một `io.Writer` bọc rất nhiều loại output khác nhau; đó là chuyện hành vi, chứ không phải cấu trúc.
- Bạn muốn **sự linh hoạt lúc chạy** — kiểu cụ thể không biết được tại thời điểm biên dịch.

**Dùng kiểu cụ thể** khi:
- Chỉ có một hai kiểu tham gia và chúng khó có khả năng mở rộng thêm. Đừng generic hóa quá sớm.
- Hàm nhỏ và inlining quan trọng — các lời gọi generic có thể không inline gọn gàng.

Nguyên tắc từ đội ngũ Go: **nếu bạn chưa thể viết hàm đó ít nhất hai lần với các kiểu khác nhau trước khi với tay tới một type parameter, thì có lẽ bạn chưa cần generics.**

```go
// RIGHT: generic — same logic for any ordered type
func Min[T cmp.Ordered](a, b T) T {
    if a < b {
        return a
    }
    return b
}

// WRONG: genericizing a function that only ever serves one type
func ProcessUser[T User](u T) { ... } // just use User directly
```
:::

::: details Q: Làm sao viết một hàm generic hữu ích với một constraint có ý nghĩa?
Một pattern phổ biến: một hàm generic hoạt động trên bất kỳ map nào có key là string và value là kiểu số:
```go
import "golang.org/x/exp/constraints" // or define your own

type Number interface {
    constraints.Integer | constraints.Float
}

func SumMap[V Number](m map[string]V) V {
    var total V
    for _, v := range m {
        total += v
    }
    return total
}

// Usage — no explicit type argument needed; compiler infers V
totals := map[string]int{"a": 1, "b": 2}
fmt.Println(SumMap(totals)) // 3
```

Những điểm chính:
- **Type inference** loại bỏ hầu hết các chú thích `[T]` tường minh tại call-site.
- `var total V` khởi tạo về zero value của `V` — code generic có thể dựa vào zero value.
- Các constraint ghép bằng `|` là **union constraint** — chỉ những thao tác mà *tất cả* các kiểu trong union đều hỗ trợ mới dùng được bên trong hàm (nên phép tính số học chạy được với `Integer | Float`, nhưng không chạy được với `comparable`).

Các **kiểu generic** (chứ không chỉ hàm) rất hữu ích cho các container:
```go
type Stack[T any] struct{ items []T }
func (s *Stack[T]) Push(v T) { s.items = append(s.items, v) }
func (s *Stack[T]) Pop() (T, bool) {
    if len(s.items) == 0 {
        var zero T
        return zero, false
    }
    v := s.items[len(s.items)-1]
    s.items = s.items[:len(s.items)-1]
    return v, true
}
```
:::

::: details Q: Những đánh đổi về khả năng đọc và thời gian biên dịch của generics là gì?
**Chi phí về khả năng đọc**:
- Các dấu ngoặc type parameter thêm nhiễu thị giác, đặc biệt khi có nhiều tham số bị ràng buộc: `func Merge[K comparable, V any](a, b map[K]V) map[K]V`.
- Các thông báo lỗi khi vi phạm constraint có thể khó hiểu — trình biên dịch báo cáo constraint không được thỏa mãn, chứ không phải ý định của call site gây lỗi.
- Debug: `reflect.TypeOf` trên một type parameter generic đòi hỏi phải có instantiation; stack trace và output của profiler dùng tên đã instantiate (ví dụ `Stack[string]`), có thể khá dài dòng.

**Chi phí về thời gian biên dịch**:
- Code generic làm tăng thời gian biên dịch — trình biên dịch phải instantiate và kiểm tra kiểu cho mỗi tổ hợp shape duy nhất. Trong các codebase lớn với nhiều type parameter, chi phí này đo được (tính bằng giây, chứ không phải mili-giây). Hãy ưu tiên kiểu cụ thể cho các tiện ích ít dùng.

**Kích thước binary**:
- GC-shape stenciling hạn chế được sự phình code so với template của C++, nhưng mỗi GC shape duy nhất vẫn sinh ra một đường code riêng. Profiling bằng `go tool nm` có thể để lộ những instantiation ngoài dự kiến.

**Nguyên tắc về khả năng đọc**: chỉ thêm type parameter khi sự trừu tượng hóa rõ ràng là chính đáng — `slices.Sort` và các bản kế nhiệm của `sync.Map` là những thắng lợi rõ ràng. Hãy tránh bọc generic quanh những hàm đơn giản chỉ để né việc viết hai bản cụ thể khác nhau đúng 3 dòng. Trùng lặp thường rõ ràng hơn là trừu tượng hóa quá sớm.
:::

## Câu hỏi đào sâu thường gặp

- Một hàm generic có thể là một method trên một kiểu không-generic không? (Không — chỉ kiểu mới có thể có type parameter; method không thể tự giới thiệu type parameter mới.)
- `comparable` cho phép điều gì mà `any` không cho phép, và những kiểu nào là không comparable?
- `cmp.Compare` (Go 1.21) khác gì so với việc tự viết một comparator?
- Liệu Go có bao giờ hỗ trợ full monomorphization để loại bỏ overhead của dictionary không?
