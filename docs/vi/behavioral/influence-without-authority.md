---
title: Gây ảnh hưởng khi không có quyền hạn
description: Cho thấy khả năng tạo đồng thuận và thúc đẩy sự áp dụng từ những người và những đội mà bạn không quản lý — bằng dữ liệu, quan hệ và mục tiêu chung.
tags: [behavioral, leadership]
category: behavioral
status: draft
---

# Gây ảnh hưởng khi không có quyền hạn

**Câu hỏi** — "Hãy kể về một lần bạn tác động đến một quyết định hoặc thúc đẩy việc áp dụng điều gì đó mà không có quyền hạn trực tiếp."
Các biến thể: "Mô tả một lần bạn phải giành được sự ủng hộ từ những người bạn không quản lý.", "Hãy kể về một lần bạn lãnh đạo bằng ảnh hưởng thay vì bằng chức vị."

**Điều họ đang đánh giá** — Thuyết phục bằng dữ liệu, bản mẫu và mục tiêu chung thay vì bằng cấp bậc; tạo đồng thuận giữa những đội bạn không kiểm soát; sự kiên nhẫn và bền bỉ khi thuyết phục người hoài nghi; biết tìm ra những người ủng hộ và đồng minh; và mức độ áp dụng hoặc kết quả đo lường được như bằng chứng cho thấy cách làm thực sự hiệu quả.

## Khung STAR-L

Điền câu chuyện của riêng bạn:

- **Tình huống —** Mô tả bối cảnh liên đội hoặc liên bộ phận. Tiêu chuẩn, công cụ hay cách làm mà bạn muốn mọi người áp dụng là gì, và vì sao bạn không có quyền để bắt buộc?
- **Nhiệm vụ —** Bạn cần đạt kết quả gì, và trở ngại là gì — sự hoài nghi, các ưu tiên đang giành chỗ, thói quen cũ, hay việc không ai nhìn thấy vấn đề?
- **Hành động —** Bạn xây dựng lập luận của mình ra sao? Bạn có dựng bản mẫu (prototype) hay chạy thử nghiệm trước không? Bạn gây dựng được những người ủng hộ nào? Bạn đưa dữ liệu hay những thắng lợi ban đầu ra sao để lay chuyển mọi người — dùng "tôi" và chỉ rõ từng việc cụ thể (ví dụ: tổ chức một workshop, chia sẻ số liệu benchmark, ghép cặp với một người hoài nghi để trực tiếp gỡ bỏ lo ngại của họ)?
- **Kết quả —** Kết quả áp dụng hoặc kết quả kinh doanh cụ thể là gì? Định lượng ở những chỗ có thể (ví dụ: 4 trong 5 đội áp dụng tiêu chuẩn trong vòng 6 tuần, thời gian build giảm 30%).
- **Bài học —** Trải nghiệm đó thay đổi cách bạn gây ảnh hưởng như thế nào? Giờ đây bạn làm khác đi ở điểm nào (ví dụ: kéo người hoài nghi vào cuộc từ sớm, bắt đầu từ vấn đề chứ không phải từ giải pháp)?

## Cạm bẫy / dấu hiệu cảnh báo

- Vội đẩy lên cấp trên hoặc dùng quyền hạn như nước đi đầu tiên thay vì phương án cuối cùng — cho thấy sự tín nhiệm thấp trong quan hệ với đồng nghiệp.
- Mô tả một chiến lược mơ hồ kiểu "nói chuyện với mọi người" mà không có cơ chế cụ thể để giành sự ủng hộ hay một mạng lưới người ủng hộ nào.
- Không có mức độ áp dụng hay kết quả đo lường được — nói rằng bạn đã thúc đẩy điều gì đó nhưng không chứng minh được nó thực sự thành công.
- Gạt phăng ý kiến phản đối thay vì giải quyết chúng — người phỏng vấn muốn thấy sự đồng thuận thực sự, không phải sự tuân theo vì bị ép.

::: details Ví dụ — Thuyết phục các đội áp dụng một tiêu chuẩn về khả năng chịu lỗi (điều chỉnh theo trải nghiệm của bạn)
**Tình huống:** Sau khi một dependency phản hồi chậm làm treo dịch vụ bảo trì của chúng tôi, tôi nhận ra một số dịch vụ đang gọi liên dịch vụ mà không hề có timeout hay circuit breaker — chỉ một dependency chậm cũng đủ lan truyền dây chuyền và kéo sập luôn cả những dịch vụ đang khỏe mạnh. Tôi chỉ là một kỹ sư (IC) trong một đội, không có quyền hạn gì với các đội khác.

**Nhiệm vụ:** Tôi muốn các đội backend cùng thống nhất về một tiêu chuẩn chịu lỗi chung — timeout kèm circuit breaker cho những lời gọi liên dịch vụ quan trọng — trước khi chúng tôi mở rộng lên các phiên lớn hơn.

**Hành động:** Đầu tiên tôi dựng bản mẫu cho mẫu thiết kế này ngay trong dịch vụ của mình và ghi lại các con số trước/sau cụ thể: một dependency chậm được mô phỏng vốn từng làm treo dịch vụ, giờ thất bại nhanh (fail fast) và nằm trong tầm kiểm soát. Ở mỗi đội còn lại, tôi tìm một kỹ sư từng "nếm trải" các sự cố lan truyền dây chuyền và kéo họ vào làm đồng tác giả, mời họ phản biện và cải thiện cách làm. Tôi tổ chức một buổi demo ngắn cho các đội kèm dữ liệu, và khi một đội ngại công sức migration, tôi đề nghị ghép cặp làm chung một ngày để tích hợp cho họ.

**Kết quả:** Các đội áp dụng tiêu chuẩn chỉ trong vài tuần, và về sau nó được chính thức hóa thành một hướng dẫn kỹ thuật. Một dependency chậm không còn kéo sập được cả dịch vụ nữa.

**Bài học:** Kéo những người hoài nghi lớn tiếng nhất vào làm đồng tác giả từ sớm sẽ biến sự phản đối thành tinh thần làm chủ. Giờ đây, mỗi lần thúc đẩy một tiêu chuẩn chung cho nhiều đội, tôi biến hai, ba người khổ sở vì vấn đề đó nhất thành cộng sự trước khi viết dòng đầu tiên của bản đề xuất.
:::
