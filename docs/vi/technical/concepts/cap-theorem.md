---
title: CAP Theorem
description: Các đánh đổi giữa Consistency, Availability và Partition tolerance trong hệ phân tán.
tags: [concept, consistency, distributed-systems]
category: tech-concepts
status: draft
---

# CAP Theorem

::: details Q: CAP là viết tắt của gì và định lý thực sự phát biểu điều gì?
- **C — Consistency**: mọi lần đọc trả về lần ghi mới nhất hoặc một lỗi (linearizability — tương đương với một hệ thống một node từ góc nhìn của client).
- **A — Availability**: mọi request đều nhận được một phản hồi không-lỗi, nhưng nó có thể không phản ánh lần ghi mới nhất.
- **P — Partition tolerance**: hệ thống tiếp tục hoạt động khi các message mạng giữa các node bị mất hoặc trì hoãn.

Định lý (Brewer 2000; được Gilbert & Lynch chứng minh năm 2002): **trong một network partition, bạn có thể bảo đảm hoặc C hoặc A, nhưng không cả hai**. Nó không nói gì về việc bạn phải hy sinh cái gì khi mạng khỏe mạnh.
:::

::: details Q: Tại sao cách diễn đạt "chọn 2 trong 3" lại gây hiểu lầm?
Vì **P không phải là tùy chọn**. Mạng bị partition — cáp hỏng, switch rớt packet, data center mất kết nối. Tuyên bố mình là một "hệ thống CA" chỉ nghĩa là bạn chưa nghĩ đến chuyện gì xảy ra khi mạng lỗi. Một hệ thống một node (PostgreSQL trên một host) có thể là CA theo nghĩa không có replication nào để mà partition, nhưng ngay khoảnh khắc bạn thêm replication hoặc chạy trên nhiều AZ, bạn đã bước vào lãnh địa CAP.

Lựa chọn thật sự là nhị phân và chỉ kích hoạt khi có partition: **bạn hy sinh consistency (giữ availability, phục vụ dữ liệu có thể cũ) hay hy sinh availability (từ chối request cho đến khi bảo đảm được tính đúng đắn)?** Ngoài lúc partition, các hệ thống hiện đại có thể cung cấp cả hai.
:::

::: details Q: Ví dụ về hệ thống CP và AP là gì?
| Loại | Hành vi khi partition | Ví dụ |
|------|--------------------------|----------|
| **CP** | Trả về lỗi hoặc block cho đến khi đạt được quorum | etcd, Zookeeper, HBase, distributed lock |
| **AP** | Trả về dữ liệu có thể cũ; vẫn hoạt động | Cassandra (mặc định), DynamoDB (eventual read), CouchDB |
| **Tunable** | Cài đặt quorum theo từng operation cho phép bạn tự chọn | Cassandra (ONE / QUORUM / ALL), DynamoDB (strong vs eventual) |

Trong thực tế ít hệ thống nào cứng nhắc thuộc hẳn một loại — Cassandra có thể hành xử kiểu CP với các lần đọc/ghi `QUORUM` nếu bạn chịu trả cái giá độ trễ. Nhãn "AP" hay "CP" mô tả trường hợp *mặc định* và trường hợp *được tối ưu hóa cho*.
:::

::: details Q: PACELC là gì và tại sao nó hữu ích về mặt vận hành hơn CAP?
PACELC (Abadi 2012) giải quyết điểm mù của CAP: **CAP chỉ nói về partition**. Hầu hết thời gian mạng của bạn vẫn ổn — nhưng bạn vẫn đối mặt với một đánh đổi.

> "Nếu có **P**artition → chọn **A** hoặc **C**. **E**lse (mạng khỏe mạnh) → chọn **L**atency hoặc **C**onsistency."

Replicate một lần ghi tới quorum trước khi ack nó sẽ bảo đảm consistency nhưng thêm độ trễ tỷ lệ với replica chậm nhất. Đây là cái núm điều chỉnh vận hành hằng ngày mà hầu hết kỹ sư thực sự tune: Cassandra (EL — đổi consistency lấy độ trễ thấp), Spanner (EC — đổi độ trễ lấy external consistency qua TrueTime).

Cho mục đích phỏng vấn: CAP cho bạn biết bạn hy sinh cái gì khi có sự cố; PACELC cho bạn biết bạn đang trả cái gì ngay cả khi mọi thứ đang chạy tốt.
:::

::: details Q: CAP liên hệ với eventual consistency như thế nào?
Các hệ thống AP chấp nhận rằng các replica có thể phân kỳ trong một partition. Một khi partition lành lại, chúng **cuối cùng hội tụ** — đó chính là eventual consistency. CAP giải thích *tại sao* các hệ thống AP buộc phải chấp nhận eventual consistency: để giữ availability trong một partition, chúng phải cho phép đọc từ các replica có thể cũ. Chọn AP là chọn đổi các cửa sổ sai lệch lấy thời gian hoạt động (uptime).

Xem thêm: [Eventual Consistency](./eventual-consistency).
:::

::: details Q: Một hệ thống CP xử lý partition trong thực tế như thế nào?
Một hệ thống CP từ chối các request mà nó không thể trả lời một cách nhất quán. Zookeeper sẽ từ chối các lần đọc và ghi nếu leader không xác nhận được rằng một quorum các follower vẫn kết nối được — bạn nhận một lỗi, chứ không phải dữ liệu cũ. etcd hành xử tương tự. Distributed lock (Redlock, Chubby) vốn dĩ là CP: một lock có thể bị hai client giữ đồng thời do partition còn tệ hơn là không có lock nào.

Hệ quả vận hành: các hệ thống CP cần circuit breaker, retry kèm backoff, và các đường suy giảm hướng-người-dùng cho những phản hồi "hệ thống không sẵn sàng" mà chúng sẽ phát ra trong lúc partition. Các đội thường đánh giá thấp mức độ thường xuyên partition xảy ra trong các triển khai cloud đa AZ (vài chục giây mỗi tháng là chuyện phổ biến trên AWS).
:::

## Câu hỏi đào sâu thường gặp

- Linearizability vs sequential consistency vs eventual consistency khác nhau ra sao?
- Tunable consistency của Cassandra (ONE / QUORUM / ALL) ánh xạ vào phổ CP/AP như thế nào?
- Kịch bản split-brain là gì và các consensus protocol (Raft, Paxos) ngăn nó ra sao?
- Google Spanner đạt được "external consistency" bằng TrueTime như thế nào?
