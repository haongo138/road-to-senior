---
title: Sự cố / Gián đoạn trên Production
description: Thể hiện sự bình tĩnh dưới áp lực, tư duy ưu tiên khắc phục trước, giao tiếp rõ ràng, và khâu xử lý hậu sự cố không đổ lỗi.
tags: [behavioral, ownership]
category: behavioral
status: draft
---

# Sự cố / Gián đoạn trên Production

**Câu hỏi** — "Hãy kể về một lần bạn xử lý một sự cố hoặc gián đoạn trên production."
Biến thể: "Mô tả một lần một hệ thống bạn làm chủ bị sập — bạn đã làm gì?", "Hãy kể về một vấn đề production bạn phải giải quyết dưới áp lực."

**Điều họ đang đánh giá** — Sự điềm tĩnh và tư duy hệ thống dưới áp lực; bản năng ưu tiên khắc phục trước (cầm máu trước khi tìm nguyên nhân gốc); giao tiếp rõ ràng, kịp thời với các bên liên quan và người dùng trong lúc sự cố; khâu xử lý hậu sự cố không đổ lỗi cùng các biện pháp phòng ngừa cụ thể sau đó.

## Khung STAR-L

Điền câu chuyện của riêng bạn:

- **Tình huống —** Hệ thống nào bị sập hoặc suy giảm hiệu năng? Nó được phát hiện ra sao — alert, người dùng báo, hay bạn tự nhận ra? Tác động kinh doanh là gì (số người dùng bị ảnh hưởng, rủi ro doanh thu, vi phạm SLA)?
- **Nhiệm vụ —** Vai trò của bạn trong việc ứng phó là gì? Bạn đang on-call, là kỹ sư dẫn dắt, hay tham gia vào một quá trình ứng phó đang diễn ra?
- **Hành động —** Trình bày quá trình ứng phó theo thứ tự. Đầu tiên: bạn đã làm gì để *khắc phục* (rollback, tắt feature-flag, failover, giảm tải) trước khi biết nguyên nhân gốc? Sau đó: bạn giao tiếp với các bên liên quan trong lúc sự cố như thế nào, với tần suất ra sao? Rồi: sau khi đã cầm máu, bạn truy nguyên nhân gốc thế nào? Dùng "tôi" và nêu rõ những bước cụ thể, theo trình tự.
- **Kết quả —** Sự cố kéo dài bao lâu? Tác động đo được là gì? Bạn cầm máu nhanh thế nào, so với lúc giải quyết triệt để? Kết quả của postmortem là gì — biện pháp phòng ngừa nào đã được đưa vào?
- **Bài học —** Điều gì thay đổi trong cách bạn xây dựng, giám sát hay ứng phó? Guardrail, alert, test hay runbook cụ thể nào giờ đây tồn tại nhờ sự cố này?

## Cạm bẫy / dấu hiệu cảnh báo

- Đổ lỗi cho một cá nhân: sự cố là lỗi hệ thống; người phỏng vấn muốn thấy tư duy không đổ lỗi ngay cả khi có ai đó phạm sai lầm.
- Nhầm lẫn khắc phục với nguyên nhân gốc: lao thẳng vào tìm nguyên nhân gốc trong khi người dùng vẫn đang bị ảnh hưởng là một dấu hiệu cảnh báo lớn.
- Không giao tiếp với các bên liên quan trong lúc sự cố: im lặng không bao giờ là câu trả lời đúng khi production đang sập.
- Không có postmortem hay biện pháp phòng ngừa: "chúng tôi sửa xong rồi đi tiếp" báo hiệu rằng chính sự cố đó sẽ lặp lại.

::: details Ví dụ — Một vấn đề logging âm thầm làm sập claim service (điều chỉnh theo trải nghiệm của bạn)
**Tình huống:** Trong một phiên livestream, claim service bắt đầu trả về lỗi 503 ngay khoảnh khắc game kết thúc và khán giả đổ xô vào claim. Một alert đã nổ — nhưng kỳ lạ thay, log và dashboard lại im bặt, gần như không hiện gì đúng vào lúc chúng tôi cần chúng nhất.

**Nhiệm vụ:** Tôi là kỹ sư on-call và đứng ra dẫn dắt xử lý sự cố — với streamer đang phát trực tiếp, từng phút đều bị soi rõ.

**Hành động:** Khắc phục trước, chẩn đoán sau. Vì chính log đã im bặt, tôi xem sự im lặng đó là một manh mối và kiểm tra thẳng trên host — đĩa đã đầy. Trong cơn đổ xô claim, cứ mỗi lần claim chúng tôi lại ghi một dòng log dài dòng, theo kiểu đồng bộ; lượng ghi đó làm đầy đĩa và bão hòa I/O, khiến các luồng xử lý request bị nghẽn và bung ra lỗi 503. Mà vì đĩa đã đầy nên service cũng không ghi log được nữa — thành ra chính vấn đề tự che giấu nó, đó là lý do dashboard trông trống trơn. Tôi dọn bớt dung lượng và chuyển logging sang bất đồng bộ ở mức tối giản để khôi phục service, rồi cứ 15 phút một lần lại đăng cập nhật cho các bên liên quan ("service đang khôi phục, tiền vẫn an toàn").

**Kết quả:** Lỗi ngừng hẳn sau vài phút và các claim được thanh toán bình thường. Các đầu việc rút ra từ postmortem: chuyển logging trên hot-path sang bất đồng bộ và lấy mẫu (sampling), thêm alert cho dung lượng đĩa và lượng log (trước đó chúng tôi chỉ có alert cho tỉ lệ lỗi), và thêm log rotation với thời gian lưu hợp lý. Cả ba đều được triển khai trong vòng một tuần.

**Bài học:** Khi sự cố đang diễn ra, việc của tôi là chặn tác động lên người dùng thật nhanh, chứ không phải hiểu tại sao — nguyên nhân gốc để dành cho lúc đã cầm được máu. Bài học sâu hơn: khi log im bặt dưới tải, thì chính *sự vắng mặt* của tín hiệu đã là một tín hiệu. Logging trên một hot path là một dependency thật sự với cái giá thật sự, và một hệ thống giám sát không sống sót nổi qua đúng sự cố mà nó sinh ra để bắt là một lỗ hổng đáng phải bịt.
:::
