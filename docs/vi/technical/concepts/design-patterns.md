---
title: Design Patterns
description: Nhóm ít ỏi các pattern thực sự xuất hiện trong code backend hằng ngày — mỗi cái giải quyết vấn đề gì, khi nào nên với tới, và khi nào thì không.
tags: [concept, oop, design, patterns]
category: tech-concepts
status: draft
---

# Design Patterns

Pattern là **từ vựng chung** cho những giải pháp đã được kiểm chứng — "cái này là Strategy" nói được
nhiều hơn ba câu giải thích. Nhưng một pattern là *phương tiện*, không phải mục tiêu: chỉ với tới nó khi
nó tháo gỡ một sự căng thẳng thực sự (thay đổi, coupling, trùng lặp). Thêm pattern một cách phỏng đoán
bản thân nó là một smell — sự gián tiếp mà bạn phải trả giá nhưng có thể chẳng bao giờ dùng đến. Hầu hết
những cái này chỉ là [composition over inheritance](./composition-over-inheritance) và [SOLID](./solid-and-oop)
áp dụng vào một vấn đề lặp lại. Đặc biệt trong Go, dạng idiomatic thường nhẹ hơn phiên bản OOP kinh điển
(một function value, một interface, middleware).

::: details Strategy — tráo các thuật toán hoán đổi được lúc runtime
**Là gì:** định nghĩa một họ thuật toán đằng sau một interface và chọn implementation lúc
runtime. **Khi nào:** có nhiều cách để làm một việc (định giá, sắp xếp, phương thức thanh toán, retry policy)
và bạn muốn tránh một chuỗi `if/else`/`switch` ngày càng phình. **Đánh đổi:** thêm nhiều type; chỉ đáng
khi các biến thể thực sự thay đổi độc lập với nhau. Đây là biểu hiện thuần khiết nhất của OCP + composition.

```go
type Pricer interface{ Price(o Order) int }

type Standard struct{}
func (Standard) Price(o Order) int { return o.Base }

type Member struct{}
func (Member) Price(o Order) int { return o.Base * 9 / 10 }

func Checkout(o Order, p Pricer) int { return p.Price(o) } // inject the strategy
```
Trong Go, một strategy chỉ có một method thường chỉ đơn giản là một giá trị `func` — không cần interface.
:::

::: details Factory — tập trung việc khởi tạo, trả về một interface
**Là gì:** một function/type dựng lên object và trả lại một interface, giấu đi type cụ
thể. **Khi nào:** việc khởi tạo phụ thuộc vào config/input, hoặc bạn muốn caller phụ thuộc vào một
abstraction (DIP) thay vì một constructor cụ thể. **Đánh đổi:** thêm gián tiếp — nếu một struct literal
thuần hay một constructor `New…` là đủ, đừng thêm factory.

```go
func NewStore(kind string) (Store, error) {
	switch kind {
	case "postgres": return newPostgres()
	case "memory":   return newMemory(), nil
	default:         return nil, fmt.Errorf("unknown store %q", kind)
	}
}
```
:::

::: details Singleton — một instance dùng chung (dùng thận trọng)
**Là gì:** đảm bảo một instance duy nhất với truy cập toàn cục. **Khi nào:** một tài nguyên thực sự dùng
chung, thường là stateless — config, logger, một connection pool. **Đánh đổi / cảnh báo:** thường là một
**anti-pattern** — một biến toàn cục giấu đi các dependency và làm code khó kiểm thử tách biệt. Hãy ưu tiên
tạo một instance rồi **inject** nó. Nếu buộc phải dùng, hãy giới hạn phạm vi và làm cho việc init an toàn:

```go
var (
	once sync.Once
	pool *Pool
)
func DB() *Pool { once.Do(func() { pool = newPool() }); return pool }
```
Góc nhìn senior: "truyền dependency vào" gần như luôn thắng "với tới biến toàn cục".
:::

::: details Observer — thông báo cho subscriber về sự kiện (pub/sub)
**Là gì:** một subject duy trì một danh sách observer và thông báo cho chúng khi có gì đó thay đổi —
một-tới-nhiều, decoupled. **Khi nào:** bên sản xuất không nên biết về bên tiêu thụ của mình (domain event, cập
nhật UI, cache invalidation). **Đánh đổi:** luồng trở nên khó lần theo ("event soup"),
thứ tự không được đảm bảo, và những lần quên unsubscribe gây rò rỉ. Trong Go, một channel thường chính là
observer. Ở quy mô hệ thống, cái này trở thành một message queue — xem [Queues vs Streams](./queues-vs-streams).
:::

::: details Decorator — bọc lại để thêm hành vi, cùng một interface
**Là gì:** bọc một object trong một object khác cùng implement một interface, thêm hành vi trước/sau khi
ủy thác. **Khi nào:** xếp lớp các mối quan tâm xuyên suốt — logging, caching, retry, auth, metrics —
mà không đụng tới type lõi; xếp chồng chúng theo bất kỳ thứ tự nào. **Đánh đổi:** nhiều wrapper nhỏ, và
thứ tự có ý nghĩa quan trọng. Đây là chiến thắng OCP gọn gàng nhất và **middleware** của Go chính xác là cái này:

```go
func WithLogging(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		log.Println(r.Method, r.URL.Path)
		next.ServeHTTP(w, r)
	})
}
```
:::

::: details Adapter — làm cho một interface không tương thích khớp vào
**Là gì:** bọc một type để nó thỏa mãn interface mà code của bạn mong đợi. **Khi nào:** tích hợp một
SDK bên thứ ba hay code cũ (legacy) — giữ type ngoại lai ở rìa, đằng sau interface của *bạn* (DIP),
để phần còn lại của code (và các test của bạn) không bao giờ phụ thuộc trực tiếp vào nó. **Đánh đổi:** thêm một
lớp mỏng, nhưng đó chính là thứ giữ cho việc đổi nhà cung cấp không lan tràn khắp codebase.

```go
type Mailer interface{ Send(to, body string) error }

type sendgridAdapter struct{ c *sendgrid.Client } // wrap the vendor
func (a sendgridAdapter) Send(to, body string) error { /* translate to SDK call */ return nil }
```
:::

::: details Builder — dựng lên các object phức tạp theo từng bước
**Là gì:** lắp ráp một object từng phần thay vì một constructor với nhiều tham số. **Khi nào:**
có nhiều field tùy chọn và bạn muốn việc khởi tạo dễ đọc, an toàn (không có telescoping constructor hay
tham số vị trí gây mơ hồ). **Đánh đổi:** boilerplate. Trong Go, dạng idiomatic là **functional
options**, không phải builder kinh điển:

```go
func NewServer(opts ...Option) *Server {
	s := &Server{port: 8080}            // defaults
	for _, o := range opts { o(s) }
	return s
}
// NewServer(WithPort(9090), WithTLS(cert))
```
:::

## Câu hỏi đào sâu thường gặp

- Khi nào thì với tới một pattern là *over-engineering* — dấu hiệu nào cho thấy bạn đã thêm một cái quá sớm?
- Các idiom của Go (func value, interface, middleware, functional options) thay thế cho các dạng OOP kinh điển như thế nào?
- Những pattern nào thực ra là cùng một ý tưởng (Strategy / State / Command đều tráo hành vi đằng sau một interface)?
- Decorator pattern liên quan thế nào tới các chuỗi middleware và Open/Closed Principle?
