---
title: OAuth 2.0
description: Framework ủy quyền truy cập (delegated authorization) — các grant flow, PKCE, các vai trò, và những cạm bẫy dẫn tới đánh cắp token.
tags: [concept, auth, oauth]
category: tech-concepts
status: draft
---

# OAuth 2.0

::: details Q: OAuth 2.0 giải quyết vấn đề gì, và không giải quyết vấn đề gì?
OAuth 2.0 giải quyết bài toán **delegated authorization** (ủy quyền truy cập): nó cho phép một client bên thứ ba truy cập tài nguyên của người dùng trên một resource server *mà người dùng không phải trao mật khẩu cho client*.

Ví dụ kinh điển: một ứng dụng CI/CD muốn quyền đọc các repo GitHub của bạn. Không có OAuth, bạn sẽ phải đưa cho nó mật khẩu GitHub — trao toàn quyền truy cập tài khoản vĩnh viễn. Với OAuth, GitHub phát một access token có phạm vi giới hạn (scoped) và giới hạn thời gian; bạn có thể thu hồi nó mà không cần đổi mật khẩu.

**OAuth 2.0 KHÔNG phải là gì**: nó là một framework ủy quyền, không phải giao thức xác thực (authentication). Một access token cho bạn biết rằng client đã được *ủy quyền* truy cập một tài nguyên; nó không nói gì về *người dùng là ai*. Dùng access token như bằng chứng đăng nhập là một lỗ hổng confused-deputy đã được biết đến. Để xác thực (định danh), hãy xếp thêm **OpenID Connect** lên trên OAuth 2.0.

Xem thêm: [OpenID Connect](./openid-connect)
:::

::: details Q: Bốn vai trò trong OAuth 2.0 là gì?
| Vai trò | Trách nhiệm |
|---|---|
| **Resource Owner** | Người dùng sở hữu dữ liệu và cấp quyền truy cập |
| **Client** | Ứng dụng yêu cầu truy cập thay mặt cho resource owner |
| **Authorization Server (AS)** | Phát token sau khi xác thực resource owner và lấy được sự đồng ý (consent) |
| **Resource Server (RS)** | Lưu trữ tài nguyên được bảo vệ; validate access token ở mỗi request |

AS và RS có thể là cùng một service (thường gặp trong các thiết lập first-party) hoặc tách riêng (thường gặp trong các hệ thống federated lớn nơi một AS phục vụ nhiều API). Hiểu rõ các vai trò này làm rõ vì sao việc validate token diễn ra ở RS, chứ không phải ở client.
:::

::: details Q: Có những grant flow nào trong OAuth 2.0 và nên dùng cái nào khi nào?
**Authorization Code + PKCE** — lựa chọn mặc định hiện đại cho mọi client hướng người dùng (web app, SPA, mobile). Người dùng được redirect tới AS, xác thực, và AS trả về một *authorization code*. Client đổi code lấy token tại một token endpoint qua back-channel. PKCE (xem bên dưới) giờ đây là bắt buộc, kể cả với confidential client.

**Client Credentials** — dành cho các luồng máy-với-máy (service-to-service), không có người dùng tham gia. Client tự xác thực bằng credential của chính nó (`client_id` + `client_secret`) trực tiếp tại token endpoint. Không có resource owner — client hành động thay mặt cho chính nó.

**Refresh Token** — không phải một grant flow độc lập; được dùng kèm với Authorization Code để lặng lẽ lấy access token mới mà không phải hỏi lại người dùng.

**Đã deprecated — đừng dùng**:
- **Implicit flow**: trả access token trực tiếp trong URL fragment (lộ trong lịch sử trình duyệt, header referrer, log server). Đã deprecated trong OAuth 2.1.
- **Resource Owner Password Credentials (ROPC)**: client thu thập mật khẩu của người dùng rồi gửi cho AS. Cách này phá vỡ mục đích của OAuth (client *chính là* bên nắm mật khẩu), cản trở MFA, và đã bị deprecated. Chỉ chấp nhận được khi migrate các hệ thống legacy không có khả năng redirect.
:::

::: details Q: PKCE là gì và tại sao nó lại bắt buộc?
**PKCE** (Proof Key for Code Exchange, RFC 7636) vô hiệu hóa kiểu tấn công *chặn authorization code (authorization code interception)*:

1. Client sinh một `code_verifier` ngẫu nhiên (≥43 ký tự, entropy cao).
2. Nó tính `code_challenge = BASE64URL(SHA256(code_verifier))`.
3. Nó đính kèm `code_challenge` và `code_challenge_method=S256` trong authorization request.
4. AS lưu challenge đó gắn với authorization code mà nó phát ra.
5. Khi đổi lấy token, client gửi `code_verifier`; AS băm nó rồi so sánh — nếu không khớp, code bị từ chối.

Không có PKCE, một app độc hại trên cùng thiết bị (dùng chung một custom URL scheme) có thể chặn cú redirect chứa authorization code và đổi nó lấy token. Với PKCE, kẻ chặn không có `code_verifier` nên không thể hoàn tất việc đổi token.

**Vì sao bắt buộc cả với confidential client?** Đặc tả gốc chỉ giới hạn PKCE cho public client (SPA, mobile). OAuth 2.1 yêu cầu nó phổ quát — một confidential client dùng PKCE là phòng thủ theo chiều sâu: kể cả khi `client_secret` bị lộ, code bị chặn cũng vô dụng nếu thiếu verifier.

```http
GET /authorize?
  response_type=code
  &client_id=abc
  &redirect_uri=https://app.example.com/callback
  &code_challenge=E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM
  &code_challenge_method=S256
  &state=xyzABC123
```
:::

::: details Q: Những cạm bẫy nguy hiểm nhất của OAuth 2.0 là gì?
**Open redirect qua `redirect_uri`**: Nếu AS cho phép đăng ký `redirect_uri` theo kiểu khớp tiền tố (prefix-matching) hoặc wildcard, kẻ tấn công có thể tạo một authorization URL redirect code về server của chúng. Cách khắc phục: bắt buộc validate `redirect_uri` theo kiểu *khớp chính xác (exact-match)* tại AS; đừng chấp nhận các biến thể ở query-parameter hay ở path.

**Thiếu tham số `state` (CSRF)**: Không có `state`, kẻ tấn công có thể lừa trình duyệt của nạn nhân khởi động một luồng authorization do chúng kiểm soát — gắn session của nạn nhân với tài khoản của kẻ tấn công (login CSRF). Cách khắc phục: sinh một `state` ngẫu nhiên, lưu vào session, và verify nó ở callback trước khi đổi code.

**Rò rỉ token qua header Referer hoặc log**: Nếu access token xuất hiện trong URL (implicit flow) hoặc trong một redirect lỗi, nó sẽ lộ trong log truy cập server và lịch sử trình duyệt. Hãy dùng cơ chế đổi token qua back-channel; giữ token ra khỏi URL.

**Cấp thừa scope (scope over-provisioning)**: Yêu cầu tối đa scope "cho tiện" làm tăng phạm vi thiệt hại khi token bị đánh cắp. Chỉ yêu cầu tối thiểu số scope cần cho tác vụ hiện tại. Hãy hỏi người dùng cấp thêm scope một cách tăng dần khi cần.

**Dùng OAuth để xác thực mà không có OIDC**: Access token chứng minh việc ủy quyền, không chứng minh danh tính. Kẻ tấn công có thể lấy một access token hợp lệ cho service của bạn rồi dùng nó để mạo danh bất kỳ người dùng nào nếu bạn bỏ qua bước xác minh danh tính. Hãy thêm `id_token` của OpenID Connect cho các luồng đăng nhập.
:::

## Câu hỏi đào sâu thường gặp

- Token introspection (RFC 7662) hoạt động ra sao và khi nào bạn dùng nó thay vì tự validate JWT?
- Khác biệt giữa OAuth 2.0 và OAuth 2.1 là gì, và 2.1 đã loại bỏ những gì?
- Làm sao xử lý việc refresh token trong một SPA mà không để lộ refresh token cho JavaScript?
- Pushed authorization request (PAR) là gì và nó tăng cường bảo mật cho authorization endpoint như thế nào?
