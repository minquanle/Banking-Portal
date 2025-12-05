# Fix: OTP Gửi Thành Công Nhưng Frontend Báo Lỗi

## 🐛 Vấn đề

**Hiện tượng:**
- Click Register → OTP được gửi đến email ✅
- Nhưng frontend hiển thị lỗi: "Failed to send OTP" ❌
- Console log: `{status: 200, ok: false}`

**Nguyên nhân:**
Backend endpoint `/api/users/register/send-otp` trả về **plain text string**:
```java
return ResponseEntity.ok("OTP đã được gửi tới email của bạn");
```

Angular HttpClient mặc định expect **JSON response**, nên khi nhận plain text với `Content-Type: text/plain` → coi là lỗi dù status = 200.

---

## ✅ Giải pháp

### Đã sửa Backend (UserController.java):

**Trước:**
```java
@PostMapping("/register/send-otp")
public ResponseEntity<String> sendRegisterOtp(@Valid @RequestBody User user) {
    // ... code ...
    return ResponseEntity.ok("OTP đã được gửi tới email của bạn");
}
```

**Sau:**
```java
@PostMapping("/register/send-otp")
public ResponseEntity<Map<String, String>> sendRegisterOtp(@Valid @RequestBody User user) {
    // ... code ...
    return ResponseEntity.ok(Map.of("message", "OTP đã được gửi tới email của bạn"));
}
```

### Thay đổi:
1. ✅ Return type: `String` → `Map<String, String>`
2. ✅ Response body: Plain text → JSON object `{"message": "..."}`
3. ✅ Added import: `java.util.Map`
4. ✅ Content-Type: `text/plain` → `application/json`

---

## 🚀 Cách áp dụng

### 1. Restart Backend (BẮT BUỘC!)

Backend đã compile thành công, giờ cần restart:

```bash
# Trong terminal đang chạy backend:
# 1. Nhấn Ctrl+C để stop
# 2. Chạy lại:
cd "C:\Nam 3\PTUDDN\Banking-Portal\BankingPortal-API"
mvn spring-boot:run
```

### 2. Test lại

1. Refresh browser: `Ctrl + Shift + R`
2. Vào trang register: `http://localhost:4200/register`
3. Điền form và click **Register**
4. **Kết quả mong đợi:**
   - ✅ Toast success: "OTP đã được gửi đến email của bạn"
   - ✅ OTP input box xuất hiện
   - ✅ Không còn lỗi "Failed to send OTP" trong console
   - ✅ Email nhận được OTP

---

## 📊 So sánh Response

### Trước (Lỗi):
```http
HTTP/1.1 200 OK
Content-Type: text/plain;charset=UTF-8

OTP đã được gửi tới email của bạn
```
→ Angular: `ok: false` (vì không parse được JSON)

### Sau (Đúng):
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "message": "OTP đã được gửi tới email của bạn"
}
```
→ Angular: `ok: true` ✅

---

## 🎯 Flow hoàn chỉnh sau khi fix

```
1. User điền form → Click "Register"
   ↓
2. Frontend gọi POST /api/users/register/send-otp
   ↓
3. Backend:
   - Tạo OTP 6 chữ số
   - Lưu vào cache
   - Gửi email
   - Trả về: {"message": "OTP đã được gửi..."}
   ↓
4. Frontend nhận response thành công
   ↓
5. Toast hiển thị: "OTP đã được gửi đến email của bạn"
   ↓
6. OTP input box xuất hiện
   ↓
7. User check email → Nhập OTP → Click "Xác nhận"
   ↓
8. Hoàn tất đăng ký
```

---

## 🔍 Debug Info

Nếu vẫn còn lỗi sau khi restart backend:

### Check Backend Response:
```bash
# Test endpoint với curl:
curl -X POST http://localhost:8080/api/users/register/send-otp \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","password":"Test123!","countryCode":"+84","phoneNumber":"0123456789","address":"Test"}'
```

**Kết quả mong đợi:**
```json
{"message":"OTP đã được gửi tới email của bạn"}
```

### Check Browser Console:
Sau khi click Register, xem Network tab:
- Status: `200 OK` ✅
- Response Type: `application/json` ✅
- Response Body: `{"message": "..."}` ✅

---

## 📝 Files đã sửa

1. **UserController.java**
   - Line ~80: Changed return type and response format
   - Added `import java.util.Map`

2. **WebSecurityConfig.java** (đã sửa trước đó)
   - Added `/api/users/register/send-otp` to PUBLIC_URLS
   - Added `/api/users/register/confirm-otp` to PUBLIC_URLS

---

## ✅ Checklist

- [x] Backend compile thành công
- [ ] **Backend đã restart** ← BẠN CẦN LÀM BƯỚC NÀY!
- [x] Frontend code không đổi (vẫn expect JSON)
- [x] Security config cho phép public access

---

**Status:** ✅ Fixed - Chờ restart backend để test
**Next Step:** Restart backend và test lại registration flow

