---
title: SQL vs NoSQL
description: Khi nào nên chọn một relational database thay vì một kho NoSQL, và những đánh đổi thực sự giữa chúng.
tags: [concept, database, modeling]
category: tech-concepts
status: draft
---

# SQL vs NoSQL

::: details Q: Điều gì về bản chất phân biệt relational (SQL) với NoSQL database?
Relational database mô hình hóa dữ liệu thành các bảng với schema định trước, hỗ trợ JOIN tùy ý trên bất kỳ cột nào, và cung cấp full ACID transaction xuyên nhiều bảng. Engine tự bắt buộc tính toàn vẹn (foreign key, constraint, kiểu dữ liệu) — dữ liệu xấu bị từ chối ngay lúc ghi.

NoSQL là một họ đa dạng, được gắn kết bởi chính thứ mà mỗi thành viên *nới lỏng*. Phần lớn đánh đổi một tổ hợp nào đó gồm độ cứng nhắc của schema, khả năng JOIN, hoặc đảm bảo ACID nhiều-record để lấy write throughput cao hơn, khả năng scale ngang, hoặc một data model hợp hơn với các pattern truy cập cụ thể. Từ khóa chính là *nới lỏng* — bạn không được nâng cấp miễn phí, bạn đang thực hiện một đánh đổi tường minh.
:::

::: details Q: Các họ data model chính của NoSQL là gì?
| Họ | Model | Hợp nhất cho | Ví dụ |
|---|---|---|---|
| **Key-value** | Một blob mờ đục cho mỗi key | Session, cache, tra cứu đơn giản | Redis, DynamoDB (cơ bản), Riak |
| **Document** | Một document JSON/BSON cho mỗi key | Schema linh hoạt, dữ liệu lồng nhau, nội dung | MongoDB, CouchDB, Firestore |
| **Wide-column** | Row với tập cột động; tối ưu cho việc đọc theo column-family | Ghi nặng, time-series, analytics | Cassandra, HBase, Bigtable |
| **Graph** | Node và edge kèm thuộc tính | Dữ liệu nặng về quan hệ (mạng xã hội, đồ thị gian lận) | Neo4j, Amazon Neptune |

Mỗi họ tối ưu cho những pattern truy cập cụ thể. Chọn nhầm họ cho pattern truy cập của bạn còn tệ hơn cả chọn nhầm thương hiệu.
:::

::: details Q: Khi nào NoSQL thắng SQL?
- **Quy mô ghi khổng lồ**: các wide-column store (Cassandra) được thiết kế cho workload ghi nặng, throughput cao, vượt quá những gì một SQL leader đơn lẻ chịu nổi — hàng trăm nghìn write/giây trải trên các node phổ thông.
- **Schema linh hoạt / tiến hóa nhanh**: document store cho phép các record khác nhau có các field khác nhau mà không cần migration ALTER TABLE — hữu ích khi hình dạng dữ liệu được khám phá dần theo từng vòng lặp.
- **Pattern truy cập đơn giản, đã biết trước**: nếu mọi query đều là "lấy document theo ID" hoặc "lấy tất cả event của user X", thì một NoSQL model sẽ đơn giản hơn và tránh được chi phí join. Lưu ý: nếu pattern truy cập của bạn thay đổi và cần một pattern query mới, bạn có thể phải nhân bản dữ liệu hoặc mô hình hóa lại từ đầu. SQL hỗ trợ query ad-hoc; NoSQL phần lớn thì không.
- **Scale ngang mặc định**: nhiều hệ NoSQL tự động shard, hợp với những team kỳ vọng tăng trưởng khổng lồ và muốn scale-out là một nguyên tắc thiết kế hạng nhất.
:::

::: details Q: Khi nào SQL thắng NoSQL?
- **Query phức tạp, ad-hoc**: optimizer giàu tính biểu đạt của SQL xử lý được các join nhiều bảng và các phép tổng hợp mà ở phần lớn hệ NoSQL sẽ đòi hỏi lắp ráp ở phía ứng dụng — nhiều round trip, logic merge, không có optimizer.
- **Transaction nhiều thực thể**: ACID xuyên nhiều record được hỗ trợ tốt trong relational database và thật sự khó làm cho đúng ở phần lớn kho NoSQL (saga, compensating transaction, eventual consistency đều đẩy độ phức tạp về phía code ứng dụng).
- **Toàn vẹn dữ liệu do engine đảm bảo**: foreign key và constraint nghĩa là dữ liệu xấu không thể nào ghi được, chứ không chỉ là khó xảy ra. Trong document store, các reference mồ côi và field thiếu cứ âm thầm tích tụ.
- **Reporting và BI**: hệ sinh thái SQL — ORM, dashboard, công cụ BI — trưởng thành hơn nhiều. Cắm một MongoDB collection vào công cụ BI là cực hình; một bảng Postgres thì dễ như trở bàn tay.
:::

::: details Q: "NoSQL nghĩa là không có schema" — nói vậy có chính xác không?
Không, và đây là một cái bẫy phổ biến. Các kho NoSQL nên được mô tả là **schema-on-read** thì đúng hơn là schemaless. Cấu trúc được ngầm định trong code ứng dụng. Nếu một field bị đổi tên, các document cũ vẫn dùng tên cũ — reader phải tự xử lý cả hai phiên bản. Cách này linh hoạt hơn nhưng dời việc bắt buộc từ database sang code. Gánh nặng đó dồn lại theo thời gian: migration, validation và việc bắt buộc bất biến đều rơi hết vào logic ứng dụng, và khi hỏng thì tạo ra dữ liệu trôi lệch âm thầm thay vì bị từ chối ghi.

**Schema-on-write** của SQL từ chối dữ liệu không đúng chuẩn ngay lúc insert. Schema chính là tài liệu mà engine bắt buộc thực thi — không cần một tầng validation riêng nào cả.
:::

::: details Q: Lựa chọn SQL vs. NoSQL đã bớt tính nhị phân (binary) chưa?
Rồi, và một cách đáng kể:

- **NewSQL** (CockroachDB, Google Spanner, TiDB) cung cấp ngữ nghĩa SQL, full ACID và sharding ngang tự động — thu hẹp khoảng cách lịch sử giữa "tính năng SQL" và "quy mô NoSQL."
- **Postgres đã thêm các tính năng kiểu NoSQL**: cột `JSONB` cho lưu trữ document không cần schema, full-text search và array bao phủ được phần lớn use case của document store mà không phải từ bỏ ACID hay truy vấn quan hệ.
- **Các hệ NoSQL mọc thêm tính năng kiểu SQL**: Cassandra có CQL; MongoDB đã thêm multi-document ACID transaction từ v4, dù kèm theo overhead đáng kể so với transaction native của RDBMS.

Hàm ý thực tế: **quyết định nên xuất phát từ pattern truy cập trước, chứ không phải từ công nghệ trước**. Hãy bắt đầu bằng câu hỏi "query nào phải nhanh?" và "tính nhất quán cần mạnh đến đâu?" — chứ không phải "đây có phải startup dùng MongoDB không?". Những team chọn NoSQL sớm vì trải nghiệm lập trình dễ chịu của nó thường rốt cuộc lại tự đi xây join, transaction và việc bắt buộc schema trong code ứng dụng với chi phí phức tạp không nhỏ. Điều đó không sai — chỉ là một đánh đổi mà bạn nên thực hiện một cách có ý thức.
:::

## Câu hỏi đào sâu thường gặp

- CAP theorem liên hệ ra sao với lựa chọn SQL vs. NoSQL? (partition tolerance + consistency so với availability; đa số hệ NoSQL nghiêng về AP)
- Eventual consistency là gì và những hệ NoSQL nào dùng nó mặc định? (Cassandra, DynamoDB mặc định; strong consistency là tùy chọn kèm cái giá phải trả)
- Bạn sẽ di trú một document store sang mô hình relational ra sao khi yêu cầu thay đổi? (dual-write, backfill, cut-over; không bao giờ đơn giản)
- Khi nào bạn kết hợp cả SQL và NoSQL trong cùng một hệ thống (polyglot persistence), và nó thêm vào những phức tạp vận hành nào?
