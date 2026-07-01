---
title: Bên trong Slice & Map
description: Cách slice header, append và cơ chế nội bộ của map hoạt động — aliasing, rò rỉ bộ nhớ và các cạm bẫy về concurrency.
tags: [concept, golang, language]
category: tech-concepts
status: draft
---

# Bên trong Slice & Map

::: details Q: Slice header là gì và append hoạt động ra sao?
Một slice là một **struct ba từ máy (three-word struct)** trong Go runtime:
```
[ ptr *T | len int | cap int ]
```
- `ptr`: con trỏ tới backing array.
- `len`: số phần tử có thể truy cập được.
- `cap`: tổng số phần tử trong backing array tính từ `ptr` trở đi.

Khi bạn truyền một slice vào hàm, chỉ *header* được sao chép — còn backing array thì dùng chung. Vì vậy, việc thay đổi giá trị các phần tử sẽ thấy được ở phía caller; nhưng nếu `append` bên trong hàm gây ra reallocation thì nó sẽ không ảnh hưởng tới header của caller.

Hành vi của `append`:
- Nếu `len < cap`: ghi phần tử mới vào `ptr[len]`, trả về một header với `len+1`. Backing array được **tái sử dụng** — slice của caller vẫn trỏ vào cùng mảng đó nhưng không thấy phần tử mới (vì `len` của nó không đổi).
- Nếu `len == cap`: cấp phát một mảng mới lớn hơn (hệ số tăng trưởng: 2× cho tới khoảng 256 phần tử, sau đó khoảng 1.25× có làm mượt), sao chép dữ liệu cũ sang, rồi ghi phần tử mới. Kết quả trả về là một header với **`ptr` khác**.

```go
a := make([]int, 3, 5) // len=3, cap=5
b := append(a, 99)     // len=4, cap=5 — same backing array!
a[0] = 7               // visible through b[0] as well
fmt.Println(b[0])      // 7 — aliasing!
```

Luôn gán kết quả của `append` trở lại biến gốc, hoặc gán vào một biến mới một cách có chủ đích.
:::

::: details Q: Cạm bẫy slice aliasing là gì, và làm sao một sub-slice có thể gây rò rỉ bộ nhớ?
Hai slice **alias** với nhau khi chúng dùng chung một backing array. Điều này dẫn tới những lỗi thay đổi giá trị rất khó lường:

```go
orig := []int{1, 2, 3, 4, 5}
sub := orig[1:3]       // sub = [2, 3]; shares orig's array
sub[0] = 99            // orig[1] is now 99
fmt.Println(orig)      // [1 99 3 4 5]
```

**Rò rỉ bộ nhớ qua sub-slice**: một sub-slice giữ cho **toàn bộ** backing array còn sống chừng nào sub-slice đó còn tồn tại. Nếu bạn trích một slice nhỏ ra từ một mảng lớn (ví dụ đọc một network buffer 4 KB rồi trả về một slice 6 byte), thì cả 4 KB vẫn nằm trên heap.

```go
// BAD: small slice keeps large buffer alive
func first6(data []byte) []byte {
    return data[:6]
}

// GOOD: copy to new, minimal backing array
func first6(data []byte) []byte {
    out := make([]byte, 6)
    copy(out, data[:6])
    return out
}
```

**Three-index slice** `s[lo:hi:max]` cho phép bạn giới hạn capacity của một sub-slice, nhờ đó tránh việc vô tình ghi vượt quá `hi` — rất hữu ích khi truyền một sub-slice cho đoạn code có thể `append` vào nó:
```go
safe := buf[lo:hi:hi]  // cap == len; any append will reallocate
```

Khi còn phân vân: hãy `copy` sang một slice mới cho những dữ liệu sống lâu được dẫn xuất từ một buffer lớn.
:::

::: details Q: Map trong Go hoạt động nội bộ ra sao, và những ràng buộc chính của nó là gì?
Map trong Go là **hash table** được cài đặt trong runtime (`runtime/map.go`). Những điểm chính:

- **Cấu trúc bucket**: các entry được gom thành các bucket 8 phần tử; các overflow bucket được nối chuỗi với nhau.
- **Load factor** khoảng 6.5 phần tử/bucket sẽ kích hoạt growth (gấp đôi số bucket); quá trình growth là **incremental** — các bucket cũ được di dời (evacuate) một cách lười biếng khi có thao tác ghi.
- **Thứ tự lặp ngẫu nhiên**: bucket bắt đầu được chọn ngẫu nhiên mỗi lần bạn gọi `range`. Đây là chủ đích — code không bao giờ được phụ thuộc vào thứ tự lặp của map.
- **Zero value**: một nil map thì *đọc* vẫn an toàn (trả về zero value và `false`), nhưng ghi vào một nil map sẽ panic.

```go
var m map[string]int  // nil map
_ = m["key"]          // ok: returns 0, false
m["key"] = 1          // PANIC: assignment to entry in nil map
```

- **Không thể lấy địa chỉ của một phần tử map**: `&m["key"]` không biên dịch được. Các giá trị không nằm ở địa chỉ ổn định vì quá trình growth sẽ dời chúng đi.
- **Delete trong khi lặp**: an toàn — `delete` một key mà bạn chưa duyệt tới thì đơn giản là nó sẽ bị bỏ qua khi bạn duyệt tới nơi.
:::

::: details Q: Vì sao map không an toàn với concurrency, và có những phương án thay thế nào?
Map trong Go **không an toàn khi đọc-ghi đồng thời (concurrent read-write)**. Một thao tác ghi đồng thời (từ bất kỳ goroutine nào) trong khi một goroutine khác đang đọc hoặc ghi sẽ kích hoạt một **lỗi runtime nghiêm trọng (fatal)** — không phải kiểu data race mà race detector phát hiện sau đó, mà là một cú crash tức thì:
```
fatal error: concurrent map read and map write
```

Runtime đã bổ sung một cơ chế phát hiện (cờ "hashWriting") chính là vì nếu không thì sự hỏng dữ liệu diễn ra âm thầm và rất nguy hiểm.

**Các phương án thay thế**:

1. **`sync.RWMutex` bọc quanh một map thường**: phổ biến nhất; cho bạn toàn quyền kiểm soát mức độ chi tiết của khóa.
```go
type SafeMap struct {
    mu sync.RWMutex
    m  map[string]int
}
func (s *SafeMap) Get(k string) (int, bool) {
    s.mu.RLock()
    defer s.mu.RUnlock()
    v, ok := s.m[k]
    return v, ok
}
func (s *SafeMap) Set(k string, v int) {
    s.mu.Lock()
    defer s.mu.Unlock()
    s.m[k] = v
}
```

2. **`sync.Map`**: được tối ưu cho hai kịch bản cụ thể — entry được ghi một lần và đọc nhiều lần, hoặc các tập goroutine tách biệt đọc/ghi những key khác nhau. Nó dùng cơ chế tách read/write nội bộ để giảm contention. Trong trường hợp tổng quát, nó chậm hơn một map được bảo vệ bằng mutex; và cũng khó range hơn.

3. **Sharding**: với throughput rất cao, hãy chia map thành N phần (shard), mỗi phần có mutex riêng, băm key để chọn shard.

Chạy với `go test -race` hoặc `go run -race` để bắt các truy cập không được đồng bộ trong quá trình phát triển.
:::

::: details Q: Khác biệt giữa nil slice và empty slice là gì, và vì sao điều đó quan trọng?
```go
var s []int          // nil slice: ptr=nil, len=0, cap=0
e := []int{}         // empty slice: ptr=(non-nil sentinel), len=0, cap=0
e2 := make([]int, 0) // also empty (non-nil)
```

Cả hai đều an toàn để `range`, để `append`, và để lấy `len`/`cap`. Trong hầu hết trường hợp, chúng có thể thay thế cho nhau.

**Nơi mà sự khác biệt trở nên quan trọng:**

- **JSON marshaling**: một nil slice mã hóa thành `null`; một empty slice mã hóa thành `[]`.
```go
type Resp struct{ Items []string }
json.Marshal(Resp{})           // {"Items":null}
json.Marshal(Resp{Items: []string{}}) // {"Items":[]}
```
Các API client thường xử lý khác nhau giữa `null` và `[]`. Hãy trả về `[]string{}` (hoặc `make([]string, 0)`) khi bạn muốn nói "danh sách rỗng".

- **`reflect.DeepEqual`**: nil slice và empty slice *không* bằng nhau, điều này có thể khiến test thất bại.
```go
reflect.DeepEqual([]int(nil), []int{}) // false
```

- **So sánh**: `s == nil` kiểm tra nil; bạn không thể so sánh `==` giữa các slice non-nil (dùng `reflect.DeepEqual` hoặc `slices.Equal`).

Quy ước: trả về nil slice khi "không có dữ liệu" mang ý nghĩa ngữ nghĩa rõ ràng (ví dụ một hàm có thể không trả về gì cả); trả về empty slice khi bạn luôn có ý định trả về một collection (dù rỗng) — đặc biệt ở các ranh giới JSON API.
:::

## Câu hỏi đào sâu thường gặp

- Biểu thức three-index slice `s[lo:hi:max]` ngăn rò rỉ capacity trong thực tế như thế nào?
- Điều gì xảy ra với bộ nhớ của map sau một số lượng lớn thao tác delete — nó có co lại không?
- Khi nào thì `sync.Map` thực sự nhanh hơn `sync.RWMutex` + map?
- `slices.Clip` giúp gì cho việc rò rỉ bộ nhớ do backing-array?
