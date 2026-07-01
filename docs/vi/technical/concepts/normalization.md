---
title: Normalization
description: Các normal form giúp loại bỏ dư thừa và update anomaly, và khi nào nên cố tình phá luật.
tags: [concept, database, schema]
category: tech-concepts
status: draft
---

# Normalization

::: details Q: Normalization giải quyết vấn đề gì?
Dữ liệu dư thừa sinh ra **update anomaly** — những tình huống mà một thay đổi logic đơn lẻ lại đòi hỏi phải cập nhật ở nhiều nơi, và một lần cập nhật dở dang sẽ để lại database ở trạng thái không nhất quán:

- **Insertion anomaly** — bạn không thể ghi lại một sự kiện mà không phải chèn kèm dữ liệu không liên quan.
- **Update anomaly** — thay đổi một sự kiện (ví dụ tên thành phố gắn với một zip code) buộc bạn phải tìm và cập nhật mọi row có lưu nó; bỏ sót một row là dữ liệu tự mâu thuẫn với chính nó.
- **Deletion anomaly** — xóa một row lại vô tình hủy luôn những sự kiện khác được lưu chung với nó.

Normalization tái cấu trúc các bảng sao cho mỗi sự kiện chỉ được lưu đúng một lần. Cái giá là các join lúc đọc — bạn trả giá ở thời điểm query để tránh sự không nhất quán ở thời điểm ghi. Đánh đổi đó có đúng hay không còn tùy vào workload của bạn.
:::

::: details Q: 1NF, 2NF và 3NF là gì?
| Normal Form | Quy tắc |
|---|---|
| **1NF** | Mỗi cột giữ một giá trị nguyên tử duy nhất; không có nhóm lặp lại hay mảng. Row phải nhận diện được duy nhất (có primary key). |
| **2NF** | Đã ở 1NF, **và** mọi cột non-key phụ thuộc vào **toàn bộ** primary key — chứ không chỉ một phần. (Chỉ liên quan khi primary key là composite.) |
| **3NF** | Đã ở 2NF, **và** không có cột non-key nào phụ thuộc vào một cột non-key khác. Mọi thuộc tính non-key chỉ phụ thuộc vào key. |

**Bài kiểm tra nhanh cho 3NF**: "Mọi thuộc tính non-key phải phụ thuộc vào key, toàn bộ key, và chỉ mỗi key mà thôi."

```sql
-- Violates 3NF: zip_code → city (transitive dependency; city doesn't depend on order_id)
CREATE TABLE orders (
  order_id   INT PRIMARY KEY,
  zip_code   CHAR(5),
  city       VARCHAR(100)
);

-- Fixed: extract the dependency to its own table
CREATE TABLE zip_codes (zip_code CHAR(5) PRIMARY KEY, city VARCHAR(100));
CREATE TABLE orders    (order_id INT PRIMARY KEY, zip_code CHAR(5) REFERENCES zip_codes);
```
:::

::: details Q: Denormalization là gì, và ai gánh trách nhiệm về tính nhất quán?
Denormalization cố tình đưa dư thừa quay trở lại — nhân đôi cột hoặc join sẵn các bảng — để loại bỏ chi phí join ở thời điểm đọc. Việc đọc trở nên rẻ hơn; việc ghi trở nên phức tạp hơn.

Điểm mấu chốt mà người phỏng vấn hay kiểm tra: **database không còn tự bắt buộc tính nhất quán giữa các bản sao dư thừa nữa — mà chính code ứng dụng của bạn phải làm.** Một lỗi cập nhật bản sao này mà quên bản sao kia sẽ tạo ra hiện tượng dữ liệu trôi lệch âm thầm, khó phát hiện và đau đớn để sửa. Denormalization là một lựa chọn có chủ đích: chấp nhận gánh nặng vận hành đó để đổi lấy hiệu năng đọc.

Cách tiếp cận: cứ normalize đến 3NF trước, profile dưới tải thực tế, rồi mới denormalize những đường nóng cụ thể nơi chi phí join đã được đo lường và thực sự đáng kể — chứ không phải phỏng đoán.
:::

::: details Q: Khi nào nên ưu tiên normalization thay vì denormalization?
| Workload | Cách tiếp cận nên chọn | Lý do |
|---|---|---|
| **OLTP** (ngân hàng, thương mại điện tử, SaaS) | Normalized (3NF) | Ghi thường xuyên; tính nhất quán và toàn vẹn là tối quan trọng; join rẻ trên các tập kết quả nhỏ. |
| **OLAP / analytics / data warehouse** | Denormalized (star/snowflake schema) | Các phép tổng hợp nặng về đọc trên hàng tỷ row; join ở quy mô đó rất đắt; các pipeline ETL lo phần nhất quán. |
| **Microservice nặng về đọc** | Denormalize có chọn lọc | Tính sẵn dữ liệu đã join trong materialized view hoặc read model (CQRS); đồng bộ qua event, không phải qua foreign key. |

Star schema trong data warehouse cố ý vi phạm 3NF: các bảng dimension được làm rộng và lặp lại có chủ đích, bởi vì các engine query phân tích (columnar store, vectorized execution) có thể quét chúng nhanh hơn nhiều so với việc phải lần theo foreign key qua các bảng đã normalize. Chọn 3NF cho một warehouse phân tích là sai — nó làm việc tổng hợp chậm đi mà chẳng đem lại lợi ích nhất quán đáng kể nào, vì dù sao dữ liệu cũng được nạp vào bằng batch ETL rồi.
:::

::: details Q: BCNF có khác 3NF không và trên thực tế có quan trọng không?
BCNF siết chặt 3NF: với mọi functional dependency `X → Y`, `X` phải là một superkey. Nó bắt được một lớp anomaly hẹp khi tồn tại các candidate key chồng lấn. Trên thực tế, những bảng đã thỏa 3NF thì gần như luôn ở BCNF. Phần lớn công việc thiết kế schema trong production dừng lại ở 3NF; BCNF chỉ liên quan khi cần sự chặt chẽ học thuật và những trường hợp thiết kế schema hiếm gặp.
:::

## Câu hỏi đào sâu thường gặp

- Star schema và snowflake schema khác nhau ở điểm nào? (star = dimension denormalize hoàn toàn, nhanh hơn; snowflake = dimension đã normalize, nhỏ hơn nhưng nhiều join hơn)
- Materialized view bắc cầu giữa lưu trữ đã normalize và hiệu năng đọc denormalize như thế nào?
- 4NF là gì? (multi-valued dependency; hiếm khi liên quan ngoài môi trường học thuật)
- Normalization liên hệ ra sao với ràng buộc foreign key và việc bắt buộc referential integrity?
