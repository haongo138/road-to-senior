---
title: Saga Pattern
description: Điều phối các business transaction đa service bằng local transaction và compensating action.
tags: [concept, concurrency, distributed-transactions]
category: tech-concepts
status: draft
---

# Saga Pattern

::: details Q: Saga pattern giải quyết vấn đề gì?
Một business workflow trải dài qua nhiều service — reserve inventory → charge payment → create shipment — không thể gói gọn trong một transaction ACID duy nhất, vì mỗi service sở hữu database riêng của nó. Một lần thất bại ở giữa chừng để hệ thống trong trạng thái áp dụng dở dang, không có cơ chế rollback sẵn có. [2PC](./two-phase-commit) có thể ép buộc atomicity, nhưng nó block khi coordinator gặp sự cố và giết chết throughput khi có tranh chấp. Saga điều phối workflow mà không cần một distributed lock: mỗi bước commit cục bộ, và Saga xử lý thất bại bằng cách chạy các compensating action.
:::

::: details Q: Saga là gì?
Một Saga là một chuỗi các **local transaction**, mỗi service tham gia một cái. Mỗi bước publish một event hoặc gửi một command để kích hoạt bước tiếp theo. Nếu bước *N* thất bại, Saga chạy các compensating transaction cho các bước từ *N-1* ngược về *1*. Mọi bước có thể thất bại đều phải có một compensation được định nghĩa rõ ràng, và bản thân compensation đó cũng phải idempotent và retry được — một compensation có thể thất bại chẳng qua chỉ là một failure mode nữa mà bạn chưa xử lý.
:::

::: details Q: Choreography vs. orchestration — khi nào thì mỗi cách hợp lý?
**Choreography**: Mỗi service lắng nghe event và tự phản ứng một cách độc lập. Không có coordinator trung tâm; các service loosely coupled. Cách này hoạt động tốt cho những luồng tuyến tính đơn giản (3–4 service). Khi độ phức tạp tăng lên, luồng ngầm định trở nên khó quan sát — debug một Saga bị treo đòi hỏi phải tái dựng lại trạng thái từ event nằm rải rác trong log của nhiều service.

**Orchestration**: Một orchestrator chuyên biệt (state machine hoặc workflow engine như Temporal, Conductor, hay AWS Step Functions) ra lệnh cho từng participant theo trình tự, theo dõi trạng thái một cách tường minh, và điều khiển các compensation khi thất bại. Toàn bộ luồng hiển thị ở một nơi và việc retry được quản lý tập trung. Cái giá: orchestrator trở thành một shared-state dependency mà tất cả participant đều bị coupling vào.

Với các hệ thống production có hơn ~4 service hoặc luồng phi tuyến tính (fan-out, nhánh điều kiện), orchestration gần như luôn thắng về khả năng vận hành.
:::

::: details Q: Saga xử lý isolation ra sao? Việc thiếu ACID isolation tạo ra những rủi ro gì?
Saga **không cung cấp isolation giữa các saga với nhau**. Trong khi một Saga đang tiến hành, trạng thái trung gian đã được commit cục bộ và hiển thị cho các request đồng thời. Điều này dẫn tới một số anomaly:

- **Dirty read xuyên service**: Một Saga thứ hai đọc inventory đã được "reserved" bởi Saga thứ nhất mà sau đó Saga thứ nhất lại compensate. Saga thứ hai hành động dựa trên dữ liệu không còn đúng nữa.
- **Lost update**: Hai Saga đồng thời cùng đọc một balance rồi cùng trừ nó — một lần trừ bị mất một cách âm thầm.
- **Compensation cascade**: Nếu một compensation thất bại (ví dụ, payment provider từ chối lời gọi API refund), Saga bị kẹt trong trạng thái đã bù trừ dở dang. Bạn cần một retry strategy, một dead-letter mechanism, và nhiều khả năng là một cảnh báo cần con người can thiệp.

Cách giảm thiểu:
- **Semantic lock**: đánh dấu record là "pending" ngay từ bước 1; các thao tác khác quan sát lock này và hoặc chờ hoặc fail nhanh.
- **Commutative update**: thiết kế các bước sao cho thứ tự áp dụng không ảnh hưởng đến kết quả cuối cùng, nhờ đó concurrency trở nên an toàn.
- **Pivot transaction**: điểm không thể quay đầu — chỉ xây compensation cho các bước trước pivot; các bước sau pivot được kỳ vọng là thành công hoặc retry tiến tới.
:::

::: details Q: Khi nào bạn sẽ chọn Saga thay vì 2PC?
Gần như luôn luôn trong một kiến trúc microservices. [2PC](./two-phase-commit) đòi hỏi participant phải giữ lock xuyên suốt một network round-trip, block nếu coordinator crash, và không khả dụng cho bất kỳ service nào chạy database riêng của nó. Saga đánh đổi ACID isolation để lấy availability và khả năng scale theo chiều ngang — đây là trade-off đúng đắn khi mỗi service sở hữu dữ liệu của chính mình.

Chỉ viện đến 2PC khi tất cả participant đều là các resource XA-capable trong một môi trường được kiểm soát (cùng data center, mạng đáng tin cậy) và yêu cầu consistency nghiêm ngặt đến mức bạn không thể chấp nhận dù chỉ một trạng thái dở dang trong khoảnh khắc. Kịch bản đó ngày càng hiếm.
:::

::: details Q: Outbox pattern liên quan thế nào tới Saga?
Mỗi bước Saga nên dùng [Transactional Outbox](./outbox) để phát ra event hoặc command kích hoạt bước tiếp theo. Nếu không có Outbox, lần ghi local DB và lần publish lên broker trở thành một dual-write: nếu việc publish thất bại sau khi commit, Saga bị đình trệ mà không có cơ chế retry. Với Outbox, relay đảm bảo at-least-once delivery cho trigger, và idempotency key của mỗi bước ngăn việc thực thi hai lần khi retry.
:::

## Câu hỏi đào sâu thường gặp

- Bạn hiện thực một compensating transaction thế nào cho một payment đã được settle với một third-party processor?
- Bạn quan sát hoặc debug một Saga kiểu choreography ra sao trong production khi một bước âm thầm làm rơi một event?
- Chuyện gì xảy ra nếu bản thân một compensation thất bại — bạn xử lý các Saga bị "kẹt" thế nào và khi nào thì escalate lên cho con người?
- Một orchestrator xử lý idempotency ra sao khi nó retry một command bước đã thất bại?
