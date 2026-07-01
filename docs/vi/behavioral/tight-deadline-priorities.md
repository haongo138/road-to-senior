---
title: Deadline Gấp / Ưu tiên Chồng chéo
description: Cho thấy bạn biết ưu tiên dứt khoát, đưa ra những đánh đổi rõ ràng, và giao tiếp mạch lạc dưới áp lực.
tags: [behavioral, execution]
category: behavioral
status: draft
---

# Deadline Gấp / Ưu tiên Chồng chéo

**Câu hỏi** — "Hãy kể về một lần bạn phải bàn giao dưới một deadline cực kỳ gấp với các ưu tiên chồng chéo nhau."
Các biến thể: "Hãy mô tả một lần bạn có nhiều việc hơn thời gian cho phép — bạn đã xử lý thế nào?", "Hãy kể về một lần bạn phải đưa ra những đánh đổi khó khăn để kịp bàn giao đúng hạn."

**Điều họ đang đánh giá** — Khả năng ưu tiên và khoanh vùng phạm vi dưới áp lực; biết ra quyết định đánh đổi rõ ràng thay vì gồng mình theo kiểu anh hùng; chủ động báo cho các bên liên quan biết việc gì đang bị hoãn và tại sao; sự điềm tĩnh khi kế hoạch thay đổi.

## Khung STAR-L

Điền câu chuyện của riêng bạn:

- **Tình huống —** Dự án hoặc bản phát hành là gì? Điều gì khiến tiến độ trở nên bất khả thi — phạm vi phình ra (scope creep), một thay đổi đột ngột, hay một dependency về trễ? Bạn sẽ mất gì nếu trễ hạn?
- **Nhiệm vụ —** Bạn chịu trách nhiệm bàn giao điều gì? Ai là những bên liên quan đang trông cậy vào bạn?
- **Hành động —** Bạn đã phân loại (triage) công việc như thế nào? Bạn dựa vào khung hay tiêu chí nào để quyết định việc gì bắt buộc phải có, việc gì có thể hoãn? Bạn đã trao đổi với ai, nói gì, và vào lúc nào? Dùng "tôi" và nêu hành vi cụ thể (ví dụ: "Tôi liệt kê mọi việc còn dang dở, chấm điểm từng việc theo tác động kinh doanh trên công sức bỏ ra, rồi gọi cho PM để cùng rà soát xem thực tế có thể cắt những gì").
- **Kết quả —** Rốt cuộc bạn bàn giao được gì? Việc gì được hoãn lại một cách minh bạch? Bạn có kịp deadline không? Định lượng khi có thể (số tính năng bị cắt, số giờ tiết kiệm được, sự cố né được, ảnh hưởng tới khách hàng né được).
- **Bài học —** Cách bạn khoanh vùng phạm vi hay báo sớm cho mọi người đã thay đổi ra sao? Bây giờ bạn làm gì khác đi khi thấy một rủi ro về tiến độ đang manh nha?

## Cạm bẫy / dấu hiệu cảnh báo

- Tô hồng chuyện cày cuốc kiệt sức: "Tôi cứ làm cả cuối tuần cho đến khi xong" — kiểu đó cho thấy lập kế hoạch kém và thiếu tư duy đánh đổi.
- Thiếu khung ưu tiên: không giải thích được *tại sao* một số thứ bị cắt trước.
- Âm thầm cắt giảm chất lượng mà không báo các bên liên quan — người phỏng vấn muốn thấy giao tiếp rõ ràng, chủ động.
- Kể một câu chuyện mà ai cũng đồng thuận, chẳng có chút khó khăn nào — chính sự căng thẳng mới là điểm mấu chốt.

::: details Ví dụ (ví dụ chung — thay bằng câu chuyện của bạn)
**Tình huống:** Ba tuần trước một buổi demo đã cam kết với khách hàng, roadmap sản phẩm bị nới thêm hai mảng tính năng mới — gần như nhân đôi phạm vi ban đầu. Đội sales đã chốt ngày demo với một khách hàng tiềm năng chiến lược.

**Nhiệm vụ:** Tôi là kỹ sư chủ trì phần backend và phối hợp với hai kỹ sư frontend. Rõ ràng là không đời nào dựng xong mọi thứ trong ba tuần mà không phải hy sinh độ đúng đắn.

**Hành động:** Tôi liệt kê mọi việc còn dang dở và chấm điểm từng việc: thiếu nó thì buổi demo có đổ bể không, và nó tốn bao lâu? Tôi khoanh ra được một nhóm cốt lõi gồm năm tính năng thiết yếu cho demo; chín tính năng còn lại thì hoặc chỉ mang tính bề ngoài, hoặc có thể giả lập bằng dữ liệu tĩnh. Tôi hẹn một cuộc gọi 30 phút với PM và trưởng nhóm sales, dẫn họ đi qua toàn bộ phần triage, rồi đề xuất: làm hoàn chỉnh năm tính năng thật, giả lập hai tính năng khác ở mức chỉ có UI, và hoãn hẳn bảy tính năng còn lại sang sprint kế tiếp. Họ đồng ý. Tôi cập nhật bảng công việc để đánh dấu rõ các mục bị hoãn và gửi một bản tóm tắt bằng văn bản để sau này khỏi nhầm lẫn.

**Kết quả:** Chúng tôi bàn giao năm tính năng thiết yếu đúng hạn với độ phủ test đầy đủ. Buổi demo diễn ra suôn sẻ và khách hàng tiềm năng đã chốt hợp đồng. Bảy mục bị hoãn được bàn giao trong sprint kế tiếp mà không xảy ra sự cố nào.

**Bài học:** Tôi học được rằng các vấn đề về tiến độ hầu như luôn có lời giải nằm ở phạm vi, chứ không chỉ ở công sức. Giờ tôi lên tiếng về sự lệch pha giữa phạm vi và thời gian ngay khi thấy — lý tưởng nhất là ngay trong khâu lập kế hoạch — thay vì chờ đến sát deadline. Tôi cũng học được cách ghi lại các quyết định đánh đổi thành văn bản để về sau không ai còn mơ hồ việc gì đã được cố ý hoãn lại.
:::
