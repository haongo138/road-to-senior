---
title: Làm chủ một vấn đề mơ hồ
description: Thể hiện sự chủ động, khả năng định hình một vấn đề mơ hồ, và tinh thần làm chủ vượt ra ngoài phạm vi được giao.
tags: [behavioral, ownership]
category: behavioral
status: draft
---

# Làm chủ một vấn đề mơ hồ

**Câu hỏi** — "Hãy kể về một lần bạn đứng ra làm chủ một vấn đề không được giao rõ ràng cho bạn."
Biến thể: "Mô tả một tình huống mà bạn phải tự xác định đâu mới thực sự là vấn đề cần giải quyết trước khi bắt tay vào xử lý.", "Hãy kể về một lần bạn đứng ra gánh vác khi không ai khác chịu làm."

**Điều họ đang đánh giá** — Sự chủ động thay vì chờ được chỉ đạo; khả năng gỡ rối sự mơ hồ bằng cách định hình vấn đề trước khi lao vào giải pháp; sự sẵn sàng làm chủ vượt ra ngoài phạm vi được giao; sự thoải mái khi làm việc mà không có định hướng rõ ràng.

## Khung STAR-L

Điền câu chuyện của riêng bạn:

- **Tình huống —** Vấn đề vô chủ hoặc mơ hồ đó là gì? Bạn phát hiện ra nó như thế nào? Tại sao nó bị bỏ ngỏ (không rõ ai làm chủ, không phải ưu tiên của ai, hay quá mơ hồ để biết bắt đầu từ đâu)?
- **Nhiệm vụ —** Tại sao bạn quyết định nhảy vào? Điều gì khiến nó trở thành trách nhiệm của bạn — hoặc tại sao bạn chọn biến nó thành trách nhiệm của mình dù vốn dĩ nó không phải vậy?
- **Hành động —** Bạn đã *định hình* vấn đề như thế nào trước khi bắt tay xử lý? Bạn trao đổi với những ai? Bạn xác định thế nào là "xong" ra sao? Sau đó: bạn đã làm những bước cụ thể nào để đẩy nó tiến lên? Dùng "tôi" và nêu rõ những hành động cụ thể.
- **Kết quả —** Bạn tạo ra kết quả gì? Quyền sở hữu có được làm rõ không? Vấn đề có được giải quyết không? Định lượng nếu có thể (cải thiện độ tin cậy, số giờ tiết kiệm, số sự cố ngăn chặn được, đội nhóm được gỡ vướng).
- **Bài học —** Chuyện này thay đổi cách bạn làm việc như thế nào? Giờ đây bạn để ý hoặc chủ động làm gì?

## Cạm bẫy / dấu hiệu cảnh báo

- Chờ được chỉ đạo: kể câu chuyện theo kiểu "tôi hỏi quản lý và họ bảo tôi làm chủ nó" — đó là việc được giao, không phải tự chủ động.
- Tê liệt vì phân tích: dành toàn bộ thời gian để mổ xẻ vấn đề mà không đẩy được tới một quyết định hay hành động nào.
- Nhầm lẫn phạm vi: không nói rõ được bạn đã quyết định đâu là việc trong phạm vi và đâu là ngoài phạm vi như thế nào.
- Tư duy "không phải việc của tôi": ngay cả khi cuối cùng bạn có hành động, việc tỏ ra khó chịu khi phải bước ra ngoài phạm vi của mình cũng là một dấu hiệu cảnh báo.

::: details Ví dụ — Những sai lệch reconciliation không ai làm chủ (điều chỉnh theo trải nghiệm của bạn)
**Tình huống:** Trong game blockchain của chúng tôi, claim log trên Postgres và vault on-chain thỉnh thoảng lại lệch nhau — một claim được đánh dấu đã thanh toán nhưng không có khoản chi trả on-chain tương ứng, hoặc ngược lại. Đây là vấn đề ai cũng biết đã nhiều tuần. Nó nằm giữa hai đội: đội backend game làm chủ Postgres, đội contracts/indexer làm chủ phần on-chain, và không ai chính thức làm chủ phần nối giữa hai bên.

**Nhiệm vụ:** Những sai lệch này làm xói mòn niềm tin vào các con số của chúng tôi và buộc phải kiểm tra thủ công sau mỗi phiên lớn. Không ai được giao việc này, nhưng cái giá phải trả thì cao, mà tôi lại nắm được cả hai phía, nên tôi đứng ra nhận.

**Hành động:** Tôi dành hai ngày để mô tả rõ vấn đề trước khi đụng vào code: kéo về claim log và các sự kiện on-chain trong nhiều tuần, gắn nhãn từng sai lệch theo loại, và phát hiện ~80% bắt nguồn từ những claim mà chúng tôi đánh dấu đã thanh toán ngay lúc gửi thay vì lúc được xác nhận. Tôi giữ phạm vi bản sửa thật hẹp — chỉ đánh dấu đã thanh toán khi indexer xác nhận, thêm một reconciliation job và một cảnh báo cho sai lệch. Tôi chia sẻ phần chẩn đoán trong một thread, được cả hai đội gật đầu nhanh chóng, và mở PR trong vòng một tuần.

**Kết quả:** Sai lệch giảm xuống gần như bằng không, reconciliation job tự động dọn những trường hợp còn sót, và cảnh báo biến sự trôi dạt âm thầm thành một tín hiệu rõ ràng. Cả hai đội không còn phải kiểm tra thủ công sau mỗi phiên nữa.

**Bài học:** Những vấn đề vô chủ cứ mãi vô chủ vì không rõ nên bắt đầu từ đâu, chứ không phải vì không ai quan tâm. Chẩn đoán và khoanh vùng phạm vi *trước khi* viết code chính là thứ khiến nó trở nên khả thi. Giờ đây tôi có thói quen để mắt đến những vấn đề vô chủ nhưng tốn kém nằm ở phần nối giữa các đội.
:::
