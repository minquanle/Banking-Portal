# Frontend OTP Registration Implementation

## ✅ Các thay đổi đã thực hiện

### 1. **AuthService** (`auth.service.ts`)
Đã thêm 2 methods mới:

```typescript
// Send OTP for registration
sendRegistrationOtp(data: any): Observable<any> {
  return this.http.post<any>(`${this.baseUrl}/users/register/send-otp`, data);
}

// Confirm OTP and complete registration
confirmRegistrationOtp(data: any, otp: string): Observable<any> {
  return this.http.post<any>(`${this.baseUrl}/users/register/confirm-otp`, {
    user: data,
    otp: otp
  });
}
```

### 2. **RegisterComponent** (`register.component.ts`)
Đã cập nhật logic:

#### Properties mới:
```typescript
showOtpInput = false;      // Hiển thị OTP input khi gửi OTP thành công
otpCode = '';               // Lưu mã OTP người dùng nhập
pendingUserData: any = null; // Lưu thông tin user tạm thời
```

#### Methods mới:
- `onSubmit()`: Gửi OTP thay vì đăng ký trực tiếp
- `onVerifyOtp()`: Xác thực OTP và hoàn tất đăng ký
- `onResendOtp()`: Gửi lại OTP nếu hết hạn

### 3. **RegisterComponent HTML** (`register.component.html`)
Đã thêm:
- OTP input section (hiện khi `showOtpInput = true`)
- Input 6 chữ số cho OTP
- Button "Xác nhận" và "Gửi lại OTP"
- Update button Register để disable khi đang nhập OTP

### 4. **Environment Config**
Đã sửa port từ 8180 → 8080:
- ✅ `environment.ts`
- ✅ `environment.prod.ts`

## 🔄 Flow mới

### Trước đây:
```
User điền form → Click Register → Tạo account ngay
```

### Bây giờ:
```
1. User điền form → Click Register
2. Backend gửi OTP qua email
3. Hiện OTP input box
4. User nhập OTP → Click Xác nhận
5. Backend verify OTP → Tạo account
6. Hiển thị thông tin tài khoản đã tạo
```

## 🎯 Tính năng

### ✅ Đã implement:
1. Gửi OTP qua email khi đăng ký
2. Input field cho mã OTP 6 chữ số
3. Xác thực OTP trước khi tạo tài khoản
4. Gửi lại OTP (resend)
5. Hiển thị toast notification cho từng bước
6. Disable form khi đang nhập OTP

### 🎨 UI/UX:
- OTP input box màu xanh nhạt
- Input 6 chữ số với tracking-widest (dễ nhìn)
- 2 buttons: "Xác nhận" (xanh lá) và "Gửi lại OTP" (xám)
- Button Register đổi text thành "OTP Sent" khi đang chờ OTP

## 📝 Cách sử dụng

### 1. Start Backend (đã chạy)
```bash
cd BankingPortal-API
mvn spring-boot:run
```

### 2. Restart Frontend
```bash
cd BankingPortal-UI
# Stop current server (Ctrl+C)
npm start
# hoặc
ng serve
```

### 3. Test flow:
1. Truy cập: `http://localhost:4200/register`
2. Điền đầy đủ thông tin đăng ký
3. Click **Register**
4. Chờ toast "OTP đã được gửi đến email của bạn"
5. OTP input box sẽ xuất hiện
6. Check email và nhập mã OTP 6 chữ số
7. Click **Xác nhận**
8. Nếu đúng → Hiển thị thông tin tài khoản
9. Nếu sai → Toast error "OTP không đúng hoặc đã hết hạn"
10. Có thể click **Gửi lại OTP** nếu cần

## 🐛 Troubleshooting

### Lỗi: "Failed to load resource: net::ERR_CONNECTION_REFUSED"
**Nguyên nhân:** Backend không chạy hoặc sai port

**Giải pháp:**
1. Kiểm tra backend: `http://localhost:8080/api`
2. Restart backend nếu cần
3. Hard refresh browser: `Ctrl + Shift + R`

### Lỗi: OTP không nhận được
**Kiểm tra:**
1. Email configuration trong `application.properties`
2. Spam folder
3. Backend logs để xem lỗi gửi email

### Lỗi: Angular NG01203 RuntimeError
**Nguyên nhân:** Form control issues

**Giải pháp:**
1. Restart Angular dev server
2. Clear browser cache
3. Đảm bảo FormsModule đã import trong app.module.ts

### OTP không hợp lệ dù đúng
**Nguyên nhân:** OTP đã hết hạn (5 phút)

**Giải pháp:**
- Click "Gửi lại OTP" để nhận mã mới

## 📊 Validation

### OTP Input:
- Chỉ chấp nhận số
- Đúng 6 chữ số
- Không được để trống
- Button "Xác nhận" disable nếu không đủ 6 ký tự

### Security:
- OTP hết hạn sau 5 phút
- OTP chỉ dùng 1 lần
- OTP được lưu trong memory (không persist)
- Password vẫn được validate theo rule cũ

## 🚀 Next Steps

Sau khi restart Angular server, bạn có thể:
1. Test đăng ký với OTP flow
2. Kiểm tra email nhận OTP
3. Verify OTP và hoàn tất đăng ký
4. Test resend OTP

## 📞 API Endpoints được sử dụng

```
POST /api/users/register/send-otp
Body: { name, email, password, countryCode, phoneNumber, address }
Response: "OTP đã được gửi tới email của bạn"

POST /api/users/register/confirm-otp
Body: { user: {...}, otp: "123456" }
Response: { name, email, accountNumber, branch, ... }
```

---

**Status:** ✅ Implementation Complete
**Last Updated:** December 5, 2025

