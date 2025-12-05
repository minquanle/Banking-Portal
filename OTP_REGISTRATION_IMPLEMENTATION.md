# Tài liệu Triển khai OTP cho Đăng ký

## Tổng quan
Đã triển khai tính năng xác thực OTP cho quá trình đăng ký người dùng mới. Người dùng phải xác nhận OTP qua email trước khi hoàn tất đăng ký.

## Các thay đổi đã thực hiện

### 1. Backend API (BankingPortal-API)

#### 1.1. Tạo DTO mới
- **File**: `RegisterOtpRequest.java`
- **Mục đích**: Chứa thông tin User và OTP để xác thực đăng ký
- **Thuộc tính**:
  - `User user`: Thông tin người dùng đăng ký
  - `String otp`: Mã OTP nhận được

#### 1.2. Cập nhật OtpService
- **File**: `OtpService.java` và `OtpServiceImpl.java`
- **Methods mới**:
  - `generateOtpForRegistration(String email, User pendingUser)`: Tạo OTP cho đăng ký
  - `verifyRegistrationOtp(String email, String otp)`: Xác thực OTP đăng ký
  
- **Cơ chế lưu trữ**: Sử dụng ConcurrentHashMap để lưu tạm thời OTP và thông tin user
- **Thời gian hết hạn**: 5 phút (sử dụng OTP_EXPIRY_MINUTES hiện có)

#### 1.3. Cập nhật UserController
- **File**: `UserController.java`
- **Endpoints mới**:

##### POST `/api/users/register/send-otp`
- **Mô tả**: Gửi OTP đến email người dùng để xác thực đăng ký
- **Request Body**: User object (chứa thông tin đăng ký)
- **Response**: "OTP đã được gửi tới email của bạn"
- **Flow**:
  1. Nhận thông tin user từ request
  2. Tạo OTP ngẫu nhiên 6 chữ số
  3. Lưu OTP và thông tin user vào cache tạm thời
  4. Gửi OTP qua email
  5. Trả về thông báo thành công

##### POST `/api/users/register/confirm-otp`
- **Mô tả**: Xác thực OTP và hoàn tất đăng ký
- **Request Body**: RegisterOtpRequest (chứa User và OTP)
- **Response**: 
  - Success: Thông tin user đã đăng ký
  - Error: "OTP không đúng hoặc đã hết hạn"
- **Flow**:
  1. Nhận OTP và thông tin user
  2. Kiểm tra OTP có hợp lệ không
  3. Nếu hợp lệ: Gọi `userService.registerUser()` để tạo tài khoản
  4. Gửi email chào mừng
  5. Trả về thông báo thành công

### 2. Sửa lỗi compilation
- Loại bỏ các import `lombok.val` không hoạt động đúng
- Thay thế bằng `var` hoặc khai báo kiểu tường minh
- Sửa các file:
  - `CacheConfig.java`
  - `SwaggerConfig.java` 
  - `DashboardController.java`
  - `TransactionDTO.java`
  - `JwtAuthenticationFilter.java`

## Quy trình sử dụng

### Flow đăng ký mới với OTP:

```
1. User điền form đăng ký
   ↓
2. Frontend gọi POST /api/users/register/send-otp
   (gửi thông tin user)
   ↓
3. Backend tạo OTP và gửi email
   ↓
4. User nhập OTP từ email
   ↓
5. Frontend gọi POST /api/users/register/confirm-otp
   (gửi user info + OTP)
   ↓
6. Backend xác thực OTP
   ↓
7. Nếu hợp lệ: Tạo tài khoản user
   ↓
8. Gửi email chào mừng
```

## Cấu hình OTP

- **Độ dài OTP**: 6 chữ số
- **Thời gian hết hạn**: 5 phút
- **Lưu trữ tạm thời**: ConcurrentHashMap (trong memory)

## Lưu ý bảo mật

1. **Expiration**: OTP tự động hết hạn sau 5 phút
2. **One-time use**: OTP bị xóa sau khi xác thực thành công
3. **In-memory storage**: Dữ liệu OTP không persist vào database
4. **Thread-safe**: Sử dụng ConcurrentHashMap để đảm bảo thread-safety

## Testing

### Test manual với Postman:

#### 1. Gửi OTP
```http
POST http://localhost:8080/api/users/register/send-otp
Content-Type: application/json

{
    "name": "Test User",
    "email": "test@example.com",
    "password": "Password123!",
    "countryCode": "+84",
    "phoneNumber": "0123456789",
    "address": "123 Test Street"
}
```

#### 2. Xác thực OTP
```http
POST http://localhost:8080/api/users/register/confirm-otp
Content-Type: application/json

{
    "user": {
        "name": "Test User",
        "email": "test@example.com",
        "password": "Password123!",
        "countryCode": "+84",
        "phoneNumber": "0123456789",
        "address": "123 Test Street"
    },
    "otp": "123456"
}
```

## Frontend Changes Needed

### 1. Tạo component OTP input
- Tạo form nhập OTP 6 chữ số
- Hiển thị countdown timer (5 phút)

### 2. Cập nhật Registration Flow
```typescript
// Bước 1: Gửi OTP
async sendRegistrationOtp(userData: User) {
    return this.http.post('/api/users/register/send-otp', userData);
}

// Bước 2: Xác thực OTP và đăng ký
async confirmRegistrationOtp(userData: User, otp: string) {
    return this.http.post('/api/users/register/confirm-otp', {
        user: userData,
        otp: otp
    });
}
```

### 3. UI Flow
1. User điền form đăng ký → Click "Gửi OTP"
2. Hiện dialog nhập OTP
3. User nhập OTP từ email
4. Click "Xác nhận" → Hoàn tất đăng ký

## Các cải tiến tương lai

1. **Rate Limiting**: Giới hạn số lần gửi OTP (hiện tại chưa có)
2. **Persistent Storage**: Lưu OTP vào database thay vì memory
3. **SMS OTP**: Hỗ trợ gửi OTP qua SMS
4. **Resend OTP**: Tính năng gửi lại OTP
5. **Multi-language**: Hỗ trợ email template đa ngôn ngữ

## Troubleshooting

### Lỗi "OTP không đúng hoặc đã hết hạn"
- Kiểm tra OTP đã nhập có chính xác không
- Kiểm tra OTP có hết hạn chưa (5 phút)
- Thử gửi OTP mới

### Email không nhận được OTP
- Kiểm tra cấu hình SMTP trong `application.properties`
- Kiểm tra spam folder
- Kiểm tra logs để xem lỗi gửi email

## Status

✅ Backend API hoàn tất
✅ Compilation errors đã được sửa
✅ Build thành công
⏳ Frontend implementation (cần thực hiện)
⏳ Testing (cần thực hiện)

