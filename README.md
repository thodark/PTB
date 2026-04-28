# Author

Nhật Thọ (aka YoeiLOL).

---

# 📸 PhotoBooth Web App ✨

Một ứng dụng chụp và ghép ảnh lấy liền ngay trên nền tảng Web. Được thiết kế với giao diện **Galaxy Glassmorphism** (Kính mờ vũ trụ) cực kỳ bắt mắt, mang lại trải nghiệm mượt mà từ lúc chụp ảnh, thêm bộ lọc, cho đến việc tự tay trang trí sticker và xuất file chất lượng cao.

---

## 🌟 Tính năng nổi bật

- 🎥 **Camera độ phân giải cao**: Hỗ trợ chụp ảnh bằng Webcam với tỉ lệ 4:3 chuẩn xác, tự động đếm ngược thông minh.
- 🎨 **Bộ lọc màu (Filters) Live**: Trải nghiệm các bộ lọc ngay trong lúc chụp (Trắng đen, Hoài cổ, Sắc nét, Hạt Film, Hồng đào, Nắng ấm). Có thanh trượt tùy chỉnh cường độ filter.
- 🖼️ **Khung ảnh (Frames)**: Hỗ trợ 3 Concept khung viền khác nhau (`Cute`, `Film`, `Fresh`). Thuật toán tự động crop ảnh, căn giữa và bo góc mà không làm lẹm chủ thể.
- ✨ **Hệ thống Sticker tương tác**: 
  - Click để thêm sticker theo chủ đề.
  - Kéo thả để di chuyển tự do.
  - Nắm góc để thu phóng.
  - Dùng con lăn chuột (`Wheel`) để xoay hoặc `Shift + Wheel` để tăng/giảm kích thước.
  - Bấm `Delete` hoặc `Backspace` để xóa.
- 🌌 **Giao diện Galaxy & Intro ẩn**: Hiệu ứng nền vũ trụ đầy sao (CSS thuần), giao diện kính mờ (Glassmorphism) kết hợp các chi tiết bóng đổ Neon. Đặc biệt có màn hình hộp quà Intro cực lãng mạn.
- 💾 **Xuất ảnh High-DPI**: Render bằng Canvas và cho phép tải về ảnh thành phẩm định dạng `PNG` siêu nét.

---

## 🛠️ Công nghệ sử dụng

Project được viết hoàn toàn bằng các công nghệ cơ bản nhất của Web, không phụ thuộc vào bất kỳ thư viện hay framework bên thứ 3 nào:
- **HTML5**
- **CSS3** (Bao gồm Flexbox, Grid, CSS Variables, Keyframes Animation)
- **Vanilla JavaScript** (ES6+)

---

## 🚀 Hướng dẫn cài đặt và sử dụng

Vì lý do bảo mật của trình duyệt, API Camera (`navigator.mediaDevices.getUserMedia`) **bắt buộc phải chạy trên máy chủ (Server)** hoặc kết nối HTTPS.

**Cách chạy trên máy tính cá nhân:**
1. Clone hoặc tải mã nguồn về máy.
2. Mở thư mục project bằng **Visual Studio Code**.
3. Cài đặt Extension **[Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer)**.
4. Click chuột phải vào file `index.html` và chọn **"Open with Live Server"**.
5. Trình duyệt sẽ mở ra ở địa chỉ `http://127.0.0.1:5500`.
6. Cấp quyền truy cập Camera trên trình duyệt và bắt đầu trải nghiệm!

---

## 📂 Cấu trúc thư mục

```text
📦 PhotoBooth
 ┣ 📂 assets/
 ┃ ┣ 📂 Frame/        # Hình ảnh khung nền (Cute, Film, Fresh)
 ┃ ┗ 📂 Sticker/      # Hình ảnh sticker theo từng chủ đề
 ┣ 📜 index.html      # Giao diện chính của ứng dụng
 ┣ 📜 style.css       # Toàn bộ CSS (Galaxy Theme & Glassmorphism)
 ┣ 📜 script.js       # Logic xử lý Camera, Canvas, Sticker & UI
 ┣ 📜 sticker_data.js # (Tùy chọn) Data sticker nếu có
 ┗ 📜 README.md       # File tài liệu này
