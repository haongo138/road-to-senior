---
title: OpenID Connect (OIDC)
description: Lớp xác thực đặt trên OAuth 2.0 — id_token so với access_token, validation qua JWKS, và kiểu tấn công confused-deputy.
tags: [concept, auth, oidc]
category: tech-concepts
status: draft
---

# OpenID Connect (OIDC)

::: details Q: OIDC là gì và nó mở rộng OAuth 2.0 như thế nào?
**OIDC = OAuth 2.0 + một lớp xác thực**. OAuth 2.0 trả lời câu hỏi "client này có được ủy quyền truy cập tài nguyên Y không?" OIDC trả lời thêm câu hỏi "người dùng là ai?" bằng cách phát ra một **id_token** đi kèm (hoặc thay cho) access token.

Cụ thể, OIDC bổ sung:
- Scope `openid`, thứ kích hoạt việc phát id_token.
- **id_token** — một JWT mô tả người dùng đã được xác thực, dành cho *client*.
- Endpoint `/userinfo` — trả về các claim hồ sơ người dùng; client gọi nó bằng access token.
- Discovery document `/.well-known/openid-configuration` — IdP công bố các endpoint, scope hỗ trợ, thuật toán và JWKS URI của mình tại đây để client tự cấu hình một cách tự động.

Chỉ riêng OAuth 2.0 không thể chứng minh danh tính một cách an toàn — nó vốn không được thiết kế cho việc đó. OIDC bổ sung những nguyên thủy còn thiếu (id_token, nonce, các claim chuẩn hóa) giúp việc federated login trở nên an toàn và tương thích với nhau.

Xem thêm: [OAuth 2.0](./oauth2), [JWT](./jwt)
:::

::: details Q: Khác biệt giữa id_token và access_token là gì?
Đây là một trong những điểm dễ nhầm lẫn nhất trong kỹ thuật auth:

| | id_token | access_token |
|---|---|---|
| **Dành cho** | *Client* — chứng minh ai đã đăng nhập | *Resource server* — chứng minh việc ủy quyền |
| **Định dạng** | Luôn là JWT (theo đặc tả) | JWT hoặc opaque (tùy lựa chọn triển khai) |
| **Chứa** | Các claim định danh người dùng (`sub`, `email`, `name`, `nonce`) | Scope, quyền, đôi khi có user ID |
| **Được validate bởi** | Client đã khởi động luồng đăng nhập | Resource server ở mỗi lần gọi API |
| **Audience (`aud`)** | `client_id` của client | Định danh của API/resource server |

**Tấn công confused-deputy / thay thế token (token substitution)**: nếu API của bạn chấp nhận một id_token như bằng chứng ủy quyền, kẻ tấn công lấy được bất kỳ id_token hợp lệ nào cho IdP của bạn (ví dụ bằng cách xây một app của riêng chúng dùng cùng IdP) có thể gọi API của bạn. Claim `aud` chính là hàng phòng thủ: `aud` của một id_token là `client_id` của client phát ra nó, không phải API của bạn. Luôn validate `aud` một cách nghiêm ngặt.

Tương tự, đừng bao giờ dùng access_token như bằng chứng đăng nhập ở phía client — nó cho bạn biết bên cầm token được truy cập cái gì, chứ không phải họ là ai.
:::

::: details Q: Luồng Authorization Code hoạt động ra sao trong OIDC?
```
1. Client redirects user to AS with scope=openid (+ profile, email, etc.)
   Include `nonce` parameter (random value tied to session)

2. User authenticates; AS redirects back with authorization code

3. Client exchanges code at token endpoint:
   POST /token
   grant_type=authorization_code&code=...&redirect_uri=...
   → Response: { id_token, access_token, [refresh_token] }

4. Client validates id_token (see next Q)

5. Optionally: client calls GET /userinfo with access_token
   → Returns user profile claims (name, email, picture, etc.)
```

Endpoint `/.well-known/openid-configuration` trả về metadata của AS — URL của token endpoint, JWKS URI, các scope hỗ trợ, kiểu claim — cho phép client tự cấu hình mà không cần hardcode URL. Luôn bắt đầu từ đó.

**JWKS URI**: AS công bố các public signing key của mình dưới dạng một JSON Web Key Set. Client fetch tập này để verify signature của id_token. Khóa có thể xoay vòng (rotate); client nên cache JWKS với TTL ngắn và fetch lại khi gặp `kid` không khớp.
:::

::: details Q: Làm sao validate một id_token cho đúng?
Mọi bước đều quan trọng — bỏ sót một bước là bạn hở sườn cho mạo danh hoặc replay:

1. **Fetch JWKS** từ `jwks_uri` trong discovery document. Chọn khóa theo `kid` trong header của token.
2. **Verify signature** bằng thuật toán từ header của token (pin danh sách thuật toán được phép; từ chối `alg: none`). Xem [JWT](./jwt) về các kiểu tấn công nhầm lẫn thuật toán.
3. **Kiểm tra `iss`**: phải khớp chính xác với issuer URL của IdP lấy từ discovery document.
4. **Kiểm tra `aud`**: phải bao gồm `client_id` của ứng dụng bạn. Từ chối token phát cho client khác.
5. **Kiểm tra `exp`**: từ chối token đã hết hạn (cho phép clock skew ≤60 s).
6. **Kiểm tra `nonce`**: phải khớp với nonce mà client của bạn đã gửi trong authorization request. Điều này ngăn **tấn công replay** — kẻ tấn công gửi lại một id_token đã bắt được vào ứng dụng của bạn. Nonce phải được lưu trong session và tiêu thụ (xóa đi) sau một lần validate thành công.
7. **Kiểm tra `at_hash`** (nếu có): một hash của access_token, gắn id_token với một access_token cụ thể. Ngăn việc thay thế token trong các luồng hybrid.

Hãy dùng một thư viện OIDC client đã được chứng nhận (ví dụ `openid-client` cho Node, `authlib` cho Python). Các thư viện được chứng nhận triển khai đầy đủ những bước kiểm tra này; các bộ decode JWT tự viết tay thường xuyên bỏ sót `nonce` và `aud`.
:::

::: details Q: Khi nào nên tự xây auth và khi nào nên ủy thác cho một IdP?
**Ủy thác cho một IdP** (Google, Okta, Auth0, Keycloak, Cognito) gần như luôn là lựa chọn mặc định đúng đắn:

| Mối quan tâm | Tự xây | Ủy thác cho IdP |
|---|---|---|
| MFA | Bạn tự làm | Có sẵn |
| Lưu mật khẩu (bcrypt, phát hiện breach) | Bạn tự triển khai | Được lo |
| Khôi phục tài khoản | Bạn tự làm | Được lo |
| Tuân thủ (SOC 2, HIPAA) | Phức tạp | Phần lớn đã được đáp ứng |
| Tích hợp OIDC/SAML | Bạn tự triển khai | Native |
| Gánh nặng bảo trì | Cao (vá bảo mật, CVE) | Trách nhiệm của nhà cung cấp |

**Khi nào nên tự xây**: môi trường bị quản lý chặt với yêu cầu cụ thể về nơi lưu trữ dữ liệu (data residency); sản phẩm mà auth là yếu tố khác biệt cốt lõi; hệ thống air-gapped. Kể cả trong những trường hợp đó, hãy khởi đầu từ một IdP mã nguồn mở đã được audit kỹ (Keycloak, Ory Hydra) thay vì xây từ con số không.

Rủi ro chính của việc ủy thác là bị khóa vào nhà cung cấp (vendor lock-in) và phụ thuộc vào độ sẵn sàng của IdP. Hãy giảm thiểu bằng cách trừu tượng hóa các tương tác với IdP đằng sau một interface để có thể đổi nhà cung cấp; tránh để các claim đặc thù của IdP len lỏi sâu vào business logic.
:::

## Câu hỏi đào sâu thường gặp

- Khác biệt giữa OIDC và SAML là gì, và khi nào SAML vẫn được ưu tiên?
- OIDC xử lý single sign-on (SSO) ra sao và session cookie ở cấp IdP là gì?
- Các scope chuẩn `profile`, `email` và `address` là gì và chúng trả về những claim nào?
- Back-Channel Logout hoạt động như thế nào, và tại sao Front-Channel Logout lại không đáng tin cậy?
