---
title: Access & Refresh Tokens
description: Vì sao dùng hai token, đánh đổi về thời gian sống, refresh rotation kèm reuse detection, và thế lưỡng nan XSS so với CSRF khi lưu token trong trình duyệt.
tags: [concept, auth, tokens]
category: tech-concepts
status: draft
---

# Access & Refresh Tokens

::: details Q: Vì sao dùng hai token thay vì một token dài hạn?
Một token dài hạn duy nhất là một điểm yếu: nếu bị đánh cắp, kẻ tấn công có quyền truy cập dài hạn và bạn không thể thu hồi nó nếu không có state phía server (điều này lại phá vỡ khả năng scale stateless của JWT).

Mẫu hình hai token tách bạch các mối quan tâm:

| Token | Thời gian sống | Gửi tới | Thu hồi được |
|---|---|---|---|
| **Access token** | Ngắn (5–15 phút) | Mọi API request | Thường là không (stateless) |
| **Refresh token** | Dài (ngày–tuần) | Chỉ token endpoint | Có (lưu phía server) |

**Access token** là bộ giới hạn phạm vi thiệt hại: kể cả khi bị chặn (ví dụ từ một request log), nó hết hạn nhanh. **Refresh token** là credential bền vững; nó không bao giờ đi tới resource server — chỉ tới endpoint `/token` của authorization server.

Thiết kế này mang lại cho bạn: validation API dạng stateless (không tra DB mỗi request) + khả năng thu hồi thực tế (vô hiệu hóa refresh token, và người dùng sẽ bị đăng xuất trong vòng một TTL của access token).

Xem thêm: [JWT](./jwt) để hiểu chi tiết về đánh đổi giữa stateless và thu hồi token.
:::

::: details Q: Đánh đổi về thời gian sống của mỗi token là gì?
**TTL của access token**:
- **Ngắn hơn (1–5 phút)**: cửa sổ bị đánh cắp nhỏ hơn; nhiều lượt round-trip mạng để refresh hơn; không đáng kể với dịch vụ chạy nền, nhưng thấy rõ với ứng dụng tương tác.
- **Dài hơn (1–24 giờ)**: ít lượt refresh hơn; một token bị đánh cắp còn hiệu lực lâu hơn. Chấp nhận được khi kết hợp với truyền tải chỉ qua HTTPS và tài nguyên độ nhạy cảm thấp.

**TTL của refresh token**:
- **Ngắn hơn (1–7 ngày)**: người dùng phải xác thực lại thường xuyên hơn; cửa sổ bị đánh cắp nhỏ hơn.
- **Dài hơn (30–90 ngày)**: trải nghiệm "remember me"; nếu bị đánh cắp, kẻ tấn công có quyền truy cập dài hạn cho tới khi rotation phát hiện việc dùng lại (reuse).
- **Sliding expiry**: gia hạn ở mỗi lần dùng, kéo dài cửa sổ. Tiện cho người dùng đang hoạt động; các session nhàn rỗi tự hết hạn.

Nguyên tắc kinh nghiệm: khớp TTL với độ nhạy cảm của tài nguyên. Một ứng dụng ngân hàng có thể dùng access 5 phút / refresh 1 ngày; một công cụ cho dev có thể dùng access 1 giờ / refresh 90 ngày. Không có giá trị đúng phổ quát — hãy ghi lại lý do trong threat model của bạn.
:::

::: details Q: Refresh token rotation là gì và vì sao reuse detection lại quan trọng?
**Rotation**: ở mỗi lần refresh token thành công, phát ra một refresh token *mới* và vô hiệu hóa token cũ. Client chỉ lưu token mới nhất.

**Reuse detection** (RFC 6819 §4.3): nếu một refresh token đã dùng trước đó (đã bị rotate đi rồi) được trình lên, đó là một tín hiệu mạnh cho thấy cả token family đã bị đánh cắp:
- Client hợp lệ dùng token → nhận RT2 → RT1 cũ bị vô hiệu hóa.
- Nếu sau đó kẻ tấn công trình lên RT1, server thấy một cú replay của một token đã bị vô hiệu hóa.

Phản ứng: **thu hồi toàn bộ token family** (mọi refresh token trong dòng dõi này) ngay lập tức. Việc này đăng xuất cả người dùng hợp lệ lẫn kẻ tấn công. Người dùng hợp lệ bị phiền một chút (phải xác thực lại); kẻ tấn công mất chỗ bám.

```
Issue RT1 → Client uses RT1 → Server issues RT2, invalidates RT1
Attacker replays RT1 → Server detects replay → Revoke RT2 also → Full family revoked
```

Không có reuse detection, chỉ mình rotation không đủ giúp gì: kẻ tấn công có thể liên tục refresh bằng token bị đánh cắp miễn là chúng ra tay trước client hợp lệ.
:::

::: details Q: Nên lưu token ở đâu trong trình duyệt, và các đánh đổi là gì?
Đây là một đánh đổi bảo mật không có câu trả lời đúng phổ quát — nó phụ thuộc vào threat model của bạn.

**`localStorage` / `sessionStorage`**:
- Truy cập được qua JavaScript → **đọc được bởi XSS**. Bất kỳ đoạn script nào bị chèn vào (code của bạn, một CDN, một npm package) đều có thể đánh cắp token một cách âm thầm.
- Không tự động gửi đi → **miễn nhiễm với CSRF**.
- Dễ triển khai; hoạt động tốt với SPA.

**Cookie `httpOnly` + `Secure` + `SameSite=Strict/Lax`**:
- Không truy cập được qua JavaScript → **kháng XSS** (cookie tồn tại nhưng script của kẻ tấn công không đọc được).
- Được trình duyệt tự động gửi đi → cần **phòng thủ CSRF** (thuộc tính SameSite của cookie xử lý được hầu hết trường hợp; thêm một CSRF token cho các luồng POST cross-site nếu `SameSite=Lax` chưa đủ).
- Được ưu tiên cho các ứng dụng độ nhạy cảm cao.

**In-memory (biến JS)**:
- Không được lưu bền → chỉ tồn tại trong vòng đời của trang; người dùng phải xác thực lại khi refresh trang, trừ khi có một cookie `httpOnly` giữ refresh token làm cơ chế xác thực lại âm thầm.
- XSS vẫn có thể đánh cắp nó từ bộ nhớ trong suốt session; nó không an toàn hơn trước một XSS đang hoạt động, chỉ an toàn hơn trước việc đánh cắp bền (persistent theft).

**Mẫu hình được khuyến nghị cho SPA**: lưu refresh token trong một cookie `httpOnly` + `Secure` + `SameSite=Strict`; giữ access token chỉ trong bộ nhớ. Cookie refresh không thể bị JS đọc; access token ngắn hạn nằm trong bộ nhớ hết hạn nhanh nếu bị đánh cắp.

Đừng bao giờ lưu token trong `localStorage` với các ứng dụng giá trị cao.
:::

::: details Q: Refresh token được thu hồi như thế nào, và khi nào việc thu hồi phải tức thì?
Refresh token là các bản ghi phía server: mỗi token ánh xạ tới một user, một client, một scope, một thời điểm hết hạn, và một cờ thu hồi. Thu hồi là một thao tác ghi database — bật cờ thu hồi (hoặc xóa bản ghi).

**Các tình huống đòi hỏi thu hồi tức thì**:
- Người dùng đăng xuất (mọi token của session/user đó).
- Đổi mật khẩu (mọi token của user — mật khẩu bị đổi ngụ ý credential có thể đã bị lộ).
- Đình chỉ / xóa tài khoản.
- Reuse detection kích hoạt (thu hồi cả token family).
- Hạ cấp scope (thu hồi rồi phát lại với scope giảm bớt).

**Access token không thể bị thu hồi tức thì** trong một hệ thống JWT stateless (không có tra cứu phía server). Các lựa chọn thực tế duy nhất là:
1. Chấp nhận TTL của access token làm độ trễ thu hồi (giữ nó ngắn).
2. Thêm một bước kiểm tra denylist ở mỗi request (tra `jti`) — đưa state phía server trở lại vào mọi request.
3. Dùng **OAuth introspection** (RFC 7662): resource server gọi AS để validate từng token — thu hồi được hoàn toàn nhưng thêm một lượt đi mạng ở mỗi request.

Hãy khớp cách tiếp cận với độ nhạy cảm: các API tài chính có thể dùng introspection; hầu hết web app chấp nhận cửa sổ TTL 5–15 phút.
:::

## Câu hỏi đào sâu thường gặp

- Mẫu hình "silent refresh" hoạt động ra sao trong SPA, và các kiểu hỏng hóc của nó là gì?
- Làm sao triển khai refresh token rotation trong một hệ thống phân tán nơi nhiều server cùng xử lý request?
- Điều gì xảy ra với các access token còn hiệu lực sau khi người dùng đổi mật khẩu?
- Cookie `httpOnly` tương tác với CORS như thế nào, và cần những header nào?
