---
title: JSON Web Tokens (JWT)
description: Cấu trúc, ký (signing) so với mã hóa (encryption), các bước validation, bài toán thu hồi token, và những kiểu tấn công phá vỡ triển khai JWT.
tags: [concept, auth, jwt]
category: tech-concepts
status: draft
---

# JSON Web Tokens (JWT)

::: details Q: Cấu trúc của một JWT gồm những gì?
Một JWT là ba đoạn được mã hóa base64url và nối với nhau bằng dấu chấm: `header.payload.signature`.

```text
eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9   ← header
.eyJzdWIiOiJ1MTIzIiwiZXhwIjoxNzAwMDAwMH0  ← payload (claims)
.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQ  ← signature
```

**Header**: `alg` (thuật toán ký), `typ: "JWT"`, và tùy chọn `kid` (key ID để tra cứu qua JWKS).

**Payload**: các claims dạng JSON — registered claims (`iss`, `sub`, `aud`, `exp`, `nbf`, `iat`, `jti`) cùng với các claims do ứng dụng tự định nghĩa.

**Bảng tra nhanh registered claims**:
| Claim | Ý nghĩa |
|---|---|
| `iss` | Issuer — ai đã tạo ra token |
| `sub` | Subject — token nói về ai (user ID) |
| `aud` | Audience — ai được phép tiêu thụ token |
| `exp` | Thời điểm hết hạn (Unix seconds) |
| `nbf` | Not-before — token không hợp lệ trước thời điểm này |
| `jti` | JWT ID — ID duy nhất để chống replay |

Base64url là *mã hóa dạng encoding*, không phải mã hóa bảo mật — bất kỳ ai có token đều đọc được payload. Đây là JWS (JSON Web Signature): signature chứng minh tính toàn vẹn và xác thực nguồn gốc, chứ không đảm bảo tính bí mật.
:::

::: details Q: Signed ≠ encrypted. Điều đó quan trọng khi nào?
**JWS** ("JWT" mặc định): payload ai cũng đọc được; chỉ có signature là phụ thuộc vào secret. Đừng bao giờ đặt mật khẩu, PII hay secret vào payload của một JWT tiêu chuẩn — chúng lộ ra với bất kỳ ai cầm token và với mọi proxy có ghi log token.

**JWE** (JSON Web Encryption): toàn bộ payload được mã hóa; bên nhận phải có khóa giải mã mới đọc được. Dùng JWE khi payload buộc phải giữ bí mật, ví dụ khi token đi qua các trung gian không đáng tin cậy, hoặc được lưu trong bối cảnh mà người dùng không được phép đọc (ví dụ dữ liệu opaque phía server).

Trên thực tế, hầu hết các team dùng JWS và giữ dữ liệu nhạy cảm ra ngoài token: chỉ lưu `userId` hoặc `sessionId` rồi tra cứu mọi thứ nhạy cảm ở phía server. Cách này cũng giới hạn phạm vi thiệt hại nếu token bị lộ — cái lộ ra chỉ là một định danh, không phải bản thân dữ liệu nhạy cảm.
:::

::: details Q: Các bước validation JWT đúng chuẩn là gì?
Bỏ qua bước nào là mở ra một bề mặt tấn công tương ứng:

1. **Parse** token và kiểm tra nó đúng định dạng (ba đoạn).
2. **Chọn khóa để verify**: dùng claim `kid` trong header để tra đúng khóa từ một JWKS endpoint, hoặc dùng một static secret. Đừng bao giờ chọn khóa dựa trên chính claim `alg` của token — hãy cố định (pin) thuật toán kỳ vọng trong bộ verifier của bạn.
3. **Verify signature** bằng thuật toán đã pin. Từ chối nếu không hợp lệ.
4. **Kiểm tra `exp`**: từ chối nếu `now >= exp`. Cho phép một chút clock skew (≤60 s).
5. **Kiểm tra `nbf`** nếu có: từ chối nếu `now < nbf`.
6. **Kiểm tra `iss`**: từ chối nếu không khớp với issuer kỳ vọng.
7. **Kiểm tra `aud`**: từ chối nếu định danh của service bạn không nằm trong audience. Nhờ đó, một token phát cho service A không thể bị replay sang service B.

Hãy dùng một thư viện được bảo trì tốt (ví dụ `jose`, `jsonwebtoken` cho Node; `PyJWT` cho Python). Đừng tự tay triển khai việc parse JWT — các edge case chính là nơi lỗ hổng ẩn nấp.
:::

::: details Q: Những kiểu tấn công JWT nguy hiểm nhất là gì?
**Tấn công `alg: none`**: Một số thư viện thời kỳ đầu chấp nhận `alg: "none"` và bỏ qua bước verify signature. Kẻ tấn công gỡ bỏ signature và đặt `alg: none` để giả mạo token tùy ý. Cách khắc phục: từ chối token có `alg: none`; pin danh sách thuật toán được phép trong verifier.

**Nhầm lẫn thuật toán RS256 → HS256**: Một token RS256 bất đối xứng có public key được phân phối công khai. Nếu server chấp nhận HS256, kẻ tấn công đổi `alg` thành `HS256` rồi ký bằng chính *public key* làm secret của HMAC — tạo ra một signature mà server sẽ verify thành công, vì server dùng public key làm khóa HMAC. Cách khắc phục: pin thuật toán; đừng bao giờ suy ra khóa verify từ header của token.

**HS256 secret yếu**: JWT dùng HMAC-SHA256 có thể bị brute-force offline nếu secret ngắn. Hãy dùng entropy ≥256 bit (32+ byte ngẫu nhiên). Với hệ thống public, nên ưu tiên RS256/ES256 — private key không bao giờ rời khỏi server.

**Thiếu kiểm tra `aud`/`iss`**: Một token phát cho `api.example.com` có thể bị replay sang `admin.example.com` nếu cả hai đều không validate `aud`. Luôn validate cả hai claim này.

**Token quá lớn**: JWT đi kèm trong header/cookie của mọi request. Một payload phình to (ví dụ toàn bộ danh sách role, các org membership) có thể chạm giới hạn kích thước header (8 KB ở nhiều proxy) và làm chậm mọi request. Hãy giữ payload tối thiểu; chuyển dữ liệu khối lượng lớn sang tra cứu phía server.
:::

::: details Q: Vì sao thu hồi token với JWT lại khó, và các đánh đổi là gì?
JWT vốn được thiết kế stateless — server validate signature và claims mà không cần hỏi database. Điều này scale rất tốt (không cần tra DB mỗi request) nhưng đồng nghĩa bạn *không thể* vô hiệu hóa một token trước khi tới `exp` nếu không thêm state ở phía server.

**Các lựa chọn, kèm chi phí**:

| Cách tiếp cận | Độ trễ thu hồi | State phía server cần có |
|---|---|---|
| Access token ngắn hạn (5–15 phút) + refresh token | Tối đa tới `exp` | Chỉ cần kho refresh token |
| Denylist token (`jti` → đã thu hồi) | Tức thì | Denylist trong Redis/DB |
| OAuth introspection endpoint | Tức thì | Kho token trên authorization server |
| Session phía server (opaque token) | Tức thì | Kho session đầy đủ |

Mẫu hình phổ biến trong production: **access token ngắn hạn** (5–15 phút) rút cửa sổ thu hồi xuống mức chấp nhận được; **refresh token** dài hạn nhưng được lưu phía server và có thể thu hồi ngay lập tức. Một denylist cho phép thu hồi tức thì nhưng đòi hỏi tra cứu ở mỗi request — bạn đã đưa state phía server trở lại, làm mất một phần lợi ích stateless.

Hãy chọn dựa trên threat model của bạn: một ứng dụng y tế có thể yêu cầu thu hồi tức thì (denylist/introspection); một public API độ nhạy cảm thấp có thể chấp nhận cửa sổ 15 phút với refresh token.

Xem thêm: [Access & Refresh Tokens](./access-refresh-tokens)
:::

## Câu hỏi đào sâu thường gặp

- Key rotation hoạt động ra sao với JWKS, và điều gì xảy ra với những token đã ký bằng khóa cũ?
- Claim `jti` dùng để làm gì, và nó cho phép thu hồi theo từng token như thế nào?
- Khi nào bạn chọn ES256 (ECDSA) thay vì RS256 (RSA), và tại sao?
- Làm sao lưu JWT an toàn trong trình duyệt — cookie, localStorage hay in-memory?
