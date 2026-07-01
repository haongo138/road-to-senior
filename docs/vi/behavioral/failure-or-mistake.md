---
title: Một thất bại hoặc sai lầm
description: Thể hiện tinh thần dám nhận trách nhiệm, khả năng tự nhìn lại mình, và kiểu học hỏi khiến sai lầm không lặp lại.
tags: [behavioral, ownership]
category: behavioral
status: draft
---

# Một thất bại hoặc sai lầm

**Câu hỏi** — "Hãy kể về một lần bạn thất bại hoặc mắc một sai lầm nghiêm trọng."
Các biến thể: "Sai lầm lớn nhất trong sự nghiệp của bạn là gì?", "Mô tả một lần có điều gì đó sai sót do lỗi của bạn."

**Điều họ đang đánh giá** — Bạn dám nhận trách nhiệm và đứng ra gánh vấn đề mà không đổ lỗi; nhìn nhận trung thực chuyện gì đã sai và vì sao; một bài học thật, cụ thể — không phải câu nói sáo rỗng; và bằng chứng cho thấy bài học đó đã đổi cách bạn làm để chuyện không lặp lại.

## Khung STAR-L

Điền câu chuyện của riêng bạn:

- **Tình huống —** Dự án, hệ thống hay bối cảnh là gì? Lúc đó có gì đáng để bận tâm?
- **Nhiệm vụ —** Bạn phụ trách phần nào, và quyết định hay hành động nào đã dẫn tới thất bại?
- **Hành động —** Sai lầm của bạn gây ra chuyện gì? Bạn đã làm gì ngay để hạn chế thiệt hại? Hãy thành thật — đây là chỗ nhà tuyển dụng soi xem bạn có bản năng dám nhận hay không.
- **Kết quả —** Tác động thực tế ra sao (downtime, mất dữ liệu, người dùng phàn nàn, chi phí)? Rồi bạn làm gì để khắc phục và tránh lặp lại?
- **Bài học —** Niềm tin hay thói quen cụ thể nào đã thay đổi? Sau chuyện này bạn lập ra quy trình, rào chắn hay thói quen nào? Hãy cụ thể — "giờ tôi luôn làm X trước khi Y".

## Cạm bẫy / dấu hiệu cảnh báo

- Thất bại giả tạo: "Tôi làm việc quá chăm" hay "Tôi quan tâm quá mức" — nhà tuyển dụng nhìn ra ngay.
- Đổ lỗi cho công cụ, cho yêu cầu mập mờ, hay cho người khác — dù có đúng đi nữa, hãy nhận phần của mình trước đã.
- Không có bài học thực sự: "Tôi học được cách cẩn thận hơn" thì chưa phải là bài học.
- Nói nhẹ tác động đi để mình trông đẹp hơn — thừa nhận thẳng thắn tác động thật mới ghi điểm.

::: details Ví dụ — Ship luồng claim mà không có idempotency (điều chỉnh theo trải nghiệm của bạn)
**Tình huống:** Tôi ship phiên bản đầu tiên của luồng claim phần thưởng cho game blockchain của bên tôi. Nó làm một thao tác read-check-write thuần trên phần phân bổ vault và đánh dấu claim là settled ngay lúc gửi. Tôi có test, nhưng chưa từng cho nó đối mặt với một cơn bão claim thật.

**Nhiệm vụ:** Tôi phụ trách luồng claim. Tôi mới chỉ thử nó với một nhúm người dùng test, chứ chưa phải với một đám khán giả cùng claim trong cùng một khoảnh khắc.

**Hành động:** Ngay phiên stream lớn đầu tiên, hàng trăm người xem claim trong vài giây. Các claim đồng thời đọc cùng một số dư, thế là vài người chơi claim trùng và rút vault xuống sai. Tôi phát hiện qua cảnh báo sai lệch, tạm dừng claim ngay, và đăng một thông báo sự cố trong vòng vài phút. Tôi reconcile đối chiếu với trạng thái on-chain để tìm chính xác ai bị ảnh hưởng rồi chỉnh lại sổ cái.

**Kết quả:** Một nhúm khoản chi trùng, được khoanh lại trong khoảng 15 phút và sửa xong bằng reconciliation. Trong buổi postmortem, tôi đẩy ba thay đổi: idempotency key theo `(session_id, wallet_address)`, một lệnh update có điều kiện atomic cho việc trừ vault, và một bài load test k6 cho cơn bão claim được canh gác trong CI.

**Bài học:** Test với vài người dùng không giống test một đàn ào ạt (thundering herd) — bản chất hai thứ khác hẳn nhau. Giờ trước khi ship bất cứ thứ gì dịch chuyển số dư, tôi đều diễn tập trước cú đồng thời tệ nhất mà thực tế có thể xảy ra, và tôi thôi chấp nhận cái lý "nó chạy ngon với người dùng test" cho một đường xử lý tiền.
:::
