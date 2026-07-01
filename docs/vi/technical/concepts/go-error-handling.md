---
title: Xử lý lỗi (Error Handling)
description: Các idiom errors-as-values của Go — wrapping, sentinel vs typed vs opaque, errors.Is/As, và ranh giới panic.
tags: [concept, golang, language]
category: tech-concepts
status: draft
---

# Xử lý lỗi (Error Handling)

::: details Q: Vì sao Go dùng error như giá trị thay vì exception?
Error trong Go là những giá trị bình thường cài đặt interface `error` (`Error() string`). Caller xử lý chúng một cách tường minh ngay tại từng call site — không có chuyện stack unwinding ngầm để điều khiển luồng.

Lợi ích:
- Các đường xử lý lỗi hiện rõ trong code; không có sự lan truyền exception ẩn giấu xuyên qua các call frame.
- Trình biên dịch buộc bạn *nhận* lấy error; muốn bỏ qua nó thì phải dùng `_` (tường minh, chứ không phải vô tình).
- Giá trị error có thể mang dữ liệu có cấu trúc, có thể được kiểm tra, wrap, và truyền qua ranh giới goroutine một cách dễ dàng.
- Hiệu năng: không có bộ máy unwinding; xử lý lỗi chỉ đơn thuần là một nhánh rẽ.

Cái giá phải trả: sự dài dòng. `if err != nil { return ..., err }` lặp đi lặp lại khắp code. Đội ngũ Go thừa nhận điều này; đã có các đề xuất về cú pháp đường (syntactic sugar) nhưng chưa có cái nào được đưa vào tính đến Go 1.23.

Kỷ luật cốt lõi: **thêm ngữ cảnh khi trả về error, nhưng đừng log hai lần**. Hãy log một lần (ở đỉnh của call stack nơi bạn xử lý error) hoặc wrap để phục vụ việc kiểm tra có cấu trúc — chứ không phải cả hai.
:::

::: details Q: Làm sao để wrap error, và khác biệt giữa errors.Is và errors.As là gì?
**Wrapping** thêm ngữ cảnh vào một error trong khi vẫn giữ lại error gốc để kiểm tra:
```go
if err := db.Query(sql); err != nil {
    return fmt.Errorf("listUsers query: %w", err)
}
```
`%w` (Go 1.13+) lưu lại error gốc và làm cho nó có thể truy cập được qua `errors.Unwrap`.

**`errors.Is(err, target)`** — kiểm tra xem có error nào trong chuỗi *bằng* với `target` hay không. Dùng cho **sentinel error**:
```go
var ErrNotFound = errors.New("not found")

if errors.Is(err, ErrNotFound) { // walks the Unwrap chain
    // handle 404 case
}
// Also works with stdlib: errors.Is(err, io.EOF)
```

**`errors.As(err, &target)`** — kiểm tra xem có error nào trong chuỗi có thể **gán** được cho kiểu của `target` hay không (qua type assertion). Dùng cho **typed error** khi bạn cần đến các field:
```go
var pgErr *pgconn.PgError
if errors.As(err, &pgErr) {
    fmt.Println(pgErr.Code) // e.g. "23505" unique violation
}
```

Đừng bao giờ dùng trực tiếp `==` trên các error đã được wrap — nó chỉ so sánh giá trị ở lớp ngoài cùng và bỏ sót các nguyên nhân được wrap bên trong. Hãy dùng `errors.Is`/`errors.As` xuyên suốt.
:::

::: details Q: Sentinel, typed và opaque error là gì — khi nào dùng loại nào?
**Sentinel error** (`var ErrX = errors.New(...)`) — các biến ở cấp package, được so sánh theo định danh (identity) bằng `errors.Is`. Dùng khi caller cần rẽ nhánh theo một điều kiện cụ thể và điều kiện đó không kèm dữ liệu bổ sung. Chúng trở thành một phần trong bề mặt API của package bạn — thay đổi chúng là một breaking change.

```go
var ErrNotFound = errors.New("record not found") // callers do: errors.Is(err, repo.ErrNotFound)
```

**Typed error** — các struct cài đặt `error`, được kiểm tra bằng `errors.As`. Dùng khi caller cần dữ liệu có cấu trúc (HTTP status code, database error code, các lỗi validation của field).

```go
type ValidationError struct {
    Field   string
    Message string
}
func (e *ValidationError) Error() string {
    return fmt.Sprintf("validation: %s: %s", e.Field, e.Message)
}
```

**Opaque error** — được trả về như một `error` thuần túy, không có sentinel hay type nào được export để caller đối sánh. Dùng khi error chỉ mang tính thông tin và caller không nên rẽ nhánh theo nó — chỉ log hoặc lan truyền tiếp. Đây là dạng **ít ràng buộc nhất (decoupled nhất)**; các chi tiết cài đặt không bị rò rỉ ra ngoài.

Nguyên tắc: hãy bắt đầu với opaque. Chỉ nâng lên typed/sentinel khi một caller *chứng minh được* là cần phân biệt error đó. Phơi bày một typed error là một cam kết API công khai.
:::

::: details Q: Làm sao thêm ngữ cảnh mà không rò rỉ nội bộ hay tạo ra tiếng ồn do double-log?
**Thêm ngữ cảnh tại mỗi ranh giới return** vượt qua một tầng trừu tượng có ý nghĩa:
```go
// service layer
func (s *UserService) Create(ctx context.Context, u User) error {
    if err := s.repo.Insert(ctx, u); err != nil {
        return fmt.Errorf("UserService.Create %q: %w", u.Email, err)
    }
    return nil
}
```

**Đừng**: vừa log VỪA return — câu lệnh log ở tầng thấp tạo ra tiếng ồn khi caller cũng log:
```go
// BAD: double-log
func (r *UserRepo) Insert(ctx context.Context, u User) error {
    if err := r.db.Exec(...); err != nil {
        log.Printf("insert failed: %v", err)  // logged here...
        return fmt.Errorf("insert: %w", err)
    }
    return nil
}
// And the caller logs it again on receipt — two log lines for one failure.
```

**Đừng rò rỉ chi tiết nội bộ**: bọc một chuỗi lỗi DB nội bộ vào một API response sẽ phơi bày thông tin schema. Hãy unwrap tại ranh giới và trả về một thông điệp an toàn cho bên ngoài.

```go
// HTTP handler boundary: unwrap, classify, respond safely
if errors.Is(err, repo.ErrNotFound) {
    http.Error(w, "not found", http.StatusNotFound)
    return
}
// log the full chain internally
slog.Error("create user", "err", err)
http.Error(w, "internal error", http.StatusInternalServerError)
```
:::

::: details Q: Khi nào panic là chấp nhận được, và ranh giới panic/error nên nằm ở đâu?
Bên trong API được export của một package, hãy **trả về error**. Chỉ dùng panic cho:
1. **Vi phạm bất biến (invariant violation)** biểu thị lỗi trong code của bên gọi (ví dụ truyền một đối số nil cho một hàm đã ghi rõ non-nil là điều kiện tiên quyết).
2. **Các helper kiểu `must`** cho những thất bại lúc khởi tạo, khi việc tiếp tục là vô nghĩa:
```go
// Exported Must pattern — acceptable at package level / init
func MustParse(s string) *Template {
    t, err := Parse(s)
    if err != nil {
        panic(fmt.Sprintf("MustParse: %v", err))
    }
    return t
}
```
3. **Phần nội bộ của thư viện** khi chúng sinh goroutine: hãy recover tại gốc của goroutine và chuyển thành một error hoặc một structured log, nhờ đó ngăn một cú crash âm thầm.

**Quy tắc ranh giới**: recover ở tầng ngoài cùng nơi bạn có thể tạo ra một phản hồi lỗi có ý nghĩa — một HTTP handler, một vòng lặp background worker, một gRPC interceptor. Đừng bao giờ để một panic vượt qua ranh giới package vào code của caller vốn không lường trước điều đó.

Thước đo thực tế: nếu `recover` xuất hiện trong business logic thay vì trong code hạ tầng/framework, thì thiết kế đang có vấn đề — business logic nên dùng errors-as-values.
:::

## Câu hỏi đào sâu thường gặp

- Làm sao cài đặt một custom error type hỗ trợ cả `errors.Is` lẫn `errors.As` trên cùng một giá trị?
- `errors.Join` (Go 1.20) làm gì và khi nào nó tốt hơn wrapping?
- Structured logging của `slog` tương tác với các chuỗi error wrapping như thế nào?
- Khi nào nên dùng `panic` thay vì `log.Fatal` cho các thất bại lúc startup?
