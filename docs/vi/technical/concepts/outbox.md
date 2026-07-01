---
title: Transactional Outbox
description: Publish event một cách tin cậy bằng cách ghi chúng trong cùng DB transaction với thay đổi nghiệp vụ.
tags: [concept, concurrency, reliability]
category: tech-concepts
status: draft
---

# Transactional Outbox

::: details Q: Dual-write problem là gì?
Khi một service ghi vào database của nó rồi sau đó publish một event lên broker, hai thao tác này không hề atomic. Nếu việc publish lên broker thất bại sau khi DB đã commit, bạn có một thay đổi đã commit nhưng không có event — dữ liệu lệch nhau một cách âm thầm. Còn nếu bạn publish trước rồi việc ghi DB mới thất bại, các consumer phía sau sẽ hành động dựa trên một event "ma" chưa từng thực sự xảy ra. Không có cách nào để đảm bảo atomic trên hai hệ thống khác loại mà không dùng một distributed protocol, và [2PC](./two-phase-commit) thì quá đắt về mặt availability cho trường hợp này.
:::

::: details Q: Transactional Outbox pattern giải quyết dual-write problem như thế nào?
Service insert event vào một bảng `outbox` trong **cùng một local database transaction** với thay đổi nghiệp vụ. Cả hai dòng chia sẻ chung một lần commit ACID — hoặc cả hai cùng vào, hoặc không cái nào vào cả. Một tiến trình relay (poller hoặc CDC consumer) đọc các dòng outbox chưa được gửi và publish chúng lên broker, đánh dấu từng dòng là đã gửi sau khi nhận được acknowledgement.

```sql
BEGIN;
  INSERT INTO orders (id, customer_id, total) VALUES ($1, $2, $3);
  INSERT INTO outbox (aggregate_id, event_type, payload, sent)
    VALUES ($1, 'OrderCreated', $4, false);
COMMIT;
```

Điểm mấu chốt: bạn biến một bài toán atomicity xuyên hệ thống thành một bài toán ordering trong nội bộ một hệ thống, mà điều này thì một database ACID đơn lẻ đã giải quyết được.
:::

::: details Q: Pattern này cung cấp delivery guarantee gì, và điều đó đòi hỏi gì ở consumer?
**At-least-once**. Relay sẽ publish lại bất kỳ dòng nào chưa được acknowledge khi khởi động lại hoặc sau khi crash, nên việc trùng lặp là hoàn toàn có thể xảy ra — và là chuyện bình thường. Consumer bắt buộc phải [idempotent](./idempotency): chúng dùng `id` của event hoặc `aggregate_id + sequence` làm deduplication key, chứ không chỉ là "tôi đã thấy loại event này trước đây chưa." Một consumer idempotent-nhờ-side-effect (ví dụ INSERT … ON CONFLICT DO NOTHING) sẽ bền vững hơn so với một consumer phải kiểm tra một bảng "processed" riêng.
:::

::: details Q: CDC liên quan thế nào tới Outbox pattern, và khi nào thì polling là đủ?
Polling bảng outbox theo một khoảng thời gian cố định thì đơn giản và không cần hạ tầng gì ngoài một vòng lặp kiểu cron, nhưng nó thêm độ trễ tỉ lệ với poll interval (thường 1–30 giây) và tạo ra tải SELECT đều đặn. [CDC](./change-data-capture) bám theo transaction log của database và kích hoạt relay ngay khoảnh khắc một dòng được commit — thường end-to-end dưới 100 ms. Hãy ưu tiên CDC khi độ trễ publish quan trọng hoặc khi lượng dòng outbox lớn. Ưu tiên polling khi ưu tiên hàng đầu là sự đơn giản, khi lượng event thấp, hoặc khi DB của bạn không expose log ra một cách gọn gàng.
:::

::: details Q: Những failure mode nào bạn phải tính đến khi vận hành?
- **Relay lag**: Nếu relay bị tụt lại phía sau (broker chậm, consumer backpressure), các dòng outbox sẽ dồn ứ. Hãy monitor relay lag và số dòng chưa gửi; cảnh báo trước khi nó phình ra không kiểm soát.
- **Poison messages**: Một payload sai định dạng mà broker từ chối sẽ chặn relay vô thời hạn. Hãy xây dựng một dead-letter path — chuyển những dòng luôn thất bại sang một bảng riêng sau N lần retry.
- **Ordering trong một aggregate**: Một relay đơn luồng giữ nguyên thứ tự insert cho mỗi aggregate. Nhiều relay worker chạy song song có thể làm đảo thứ tự event giữa các aggregate; nếu bạn cần đảm bảo thứ tự trong từng aggregate, hãy phân vùng (partition) các relay worker theo `aggregate_id`.
- **Ảo tưởng exactly-once**: Pattern này là at-least-once ở cả hai phía. Consumer bỏ qua idempotency sẽ bị lặp side effect. Outbox không loại bỏ trùng lặp — nó dịch chuyển bài toán sang consumer, nơi mà bài toán đó đáng ra phải nằm.
- **Table bloat**: Các dòng đã gửi phải được dọn dẹp. Một background job xóa những dòng cũ hơn cửa sổ retention của broker (ví dụ, những dòng có `sent = true AND updated_at < now() - interval '7 days'`) sẽ giữ cho bảng gọn nhẹ.
:::

::: details Q: Khi nào nên dùng Outbox pattern thay vì các phương án khác?
Dùng Outbox khi bạn cần publish event một cách tin cậy từ một service vốn đã sở hữu một RDBMS. Đây là con đường ít overhead nhất để đạt được at-least-once delivery mà không cần đến distributed transaction.

**Đừng** viện đến nó khi: (a) service của bạn không có database và chỉ gọi các external API — outbox chẳng có gì để atomic cùng cả; (b) lượng message của bạn cao đến mức lần ghi thêm này tạo ra áp lực đáng kể lên DB — ở quy mô đó, event sourcing hoặc dùng một write-ahead log làm nơi lưu trữ chính có thể phù hợp hơn.
:::

## Câu hỏi đào sâu thường gặp

- Bạn xử lý đảm bảo ordering thế nào khi relay có nhiều worker?
- Polling vs. CDC relay — failure mode của mỗi cái là gì, và bạn vận hành chúng ra sao?
- Làm sao để ngăn bảng outbox phình to vô hạn?
- Saga pattern dùng Outbox thế nào để điều phối các workflow đa service?
