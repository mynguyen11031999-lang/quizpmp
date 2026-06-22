# Hướng Dẫn Sử Dụng & Báo Cáo Hoàn Thành: QuizMaster

Chúng tôi đã xây dựng thành công ứng dụng **QuizMaster** giúp bạn ôn luyện 1500 câu hỏi trắc nghiệm trực tiếp trên trình duyệt. Ứng dụng chạy offline hoàn toàn, bảo mật dữ liệu và có giao diện tối ưu (Dark Mode, Responsive).

## Các Tệp Tin Đã Tạo

Ứng dụng được chứa hoàn toàn trong thư mục:
`[My Tools](file:///home/mynnt/My%20Tools/)`

- **[index.html](file:///home/mynnt/My%20Tools/index.html)**: Cấu trúc HTML5 ngữ nghĩa cho toàn bộ các màn hình của SPA.
- **[styles.css](file:///home/mynnt/My%20Tools/styles.css)**: Thiết kế giao diện hiện đại với chế độ Sáng/Tối tự động, bo góc mềm mại, hoạt ảnh mượt mà, đồng hồ đếm giờ cảnh báo nháy đỏ và giao diện co giãn trên điện thoại di động.
- **[app.js](file:///home/mynnt/My%20Tools/app.js)**: Lập trình logic nghiệp vụ bao gồm: đọc và phân tích file Excel offline (SheetJS), thuật toán ánh xạ cột động, đếm giờ, lưu tiến trình tự động vào `localStorage`, và tạo hiệu ứng bắn pháo hoa Confetti bằng Canvas khi thi đạt.
- **[xlsx.full.min.js](file:///home/mynnt/My%20Tools/lib/xlsx.full.min.js)**: Thư viện SheetJS tải về máy giúp phân tích file Excel mà không cần Internet.

---

## Cách Khởi Chạy Ứng Dụng

Ứng dụng hiện đang được phục vụ qua máy chủ cục bộ bằng lệnh Python (đã được bật sẵn):
```bash
python3 -m http.server -d "/home/mynnt/My Tools" 8000
```

> [!TIP]
> **Truy cập ứng dụng:** Mở trình duyệt web của bạn và truy cập địa chỉ:
> **[http://localhost:8000](http://localhost:8000)**

---

## Hướng Dẫn Sử Dụng Chi Tiết

### Bước 1: Nạp Câu Hỏi (File Excel của bạn hoặc Dữ liệu mẫu)
1. Khi truy cập vào link, bạn sẽ thấy màn hình **Kéo & Thả** file.
2. Hãy kéo file Excel trắc nghiệm của bạn thả vào vùng chỉ định hoặc bấm nút chọn file từ máy tính.
3. Nếu bạn muốn kiểm tra thử giao diện trước khi nạp file của mình, hãy bấm **"Tải 15 câu hỏi mẫu"** để chạy thử ngay lập tức.

### Bước 2: Hướng Dẫn Ánh Xạ Cột (Column Mapping)
*Khi bạn tải file Excel của mình lên:*
1. Ứng dụng sẽ hiển thị **Trình hướng dẫn ánh xạ cột**.
2. Ở cột bên trái, bạn hãy chọn các cột tương ứng trong file Excel của bạn:
   - *Cột chứa câu hỏi*
   - *Các cột chứa đáp án lựa chọn* (mặc định A, B, C, D; bạn có thể bấm "Thêm đáp án lựa chọn" nếu câu hỏi có nhiều phương án hơn).
   - *Cột chứa đáp án đúng* (Chấp nhận định dạng như chữ cái `A`, `B`, `C` hoặc nội dung chữ chính xác của đáp án).
   - *Cột chứa giải thích* (Tùy chọn).
3. Ở cột bên phải sẽ hiển thị bảng xem trước (Preview) 3 dòng đầu tiên của file Excel được áp dụng ánh xạ để bạn kiểm tra đã ánh xạ đúng cột chưa.
4. Bấm **"Nhập dữ liệu ngay"** để hoàn thành. Dữ liệu sẽ được lưu vào trình duyệt, lần sau bạn mở lên sẽ vào thẳng Dashboard mà không cần chọn lại file.

### Bước 3: Học Tập & Ôn Luyện (Study Mode)
- **Học tự do:** Cho phép xem ngay đáp án và giải thích chi tiết sau khi bấm chọn.
- **Đánh dấu sao (Star):** Bấm biểu tượng ngôi sao để lưu lại những câu hỏi khó nhằm ôn tập riêng.
- **Lọc thông minh:** Ôn tập theo các danh mục: "Tất cả", "Câu hỏi chưa làm", "Câu hỏi đã làm sai", "Câu hỏi đã lưu".
- **Phím tắt bàn phím tiện lợi:**
  - `A`, `B`, `C`, `D` hoặc `1`, `2`, `3`, `4` để chọn đáp án.
  - Phím `Space` (Khoảng trắng) để xem nhanh đáp án đúng/giải thích.
  - Phím `Mũi tên Trái / Phải` để chuyển câu tiếp theo hoặc quay lại câu trước.
  - Phím `S` để bật/tắt đánh dấu sao (Star) câu hỏi.
  - Tùy chọn **"Tự động chuyển câu khi trả lời ĐÚNG"** để tăng tốc độ làm bài.

### Bước 4: Thi Thử Tính Giờ (Exam Mode)
- Chọn số lượng câu hỏi (10, 20, 40, 50, 100 câu hoặc Tất cả) và thời gian thi tương ứng.
- Đề thi được trộn ngẫu nhiên từ kho câu hỏi.
- **Đồng hồ đếm ngược:** Hiển thị thời gian còn lại ở thanh bên phải, thanh tiến độ thời gian sẽ đổi sang màu đỏ và nhấp nháy liên tục khi thời gian làm bài còn dưới 5 phút.
- **Phiếu trả lời (Question Grid):** Xem tổng quan tất cả câu hỏi dưới dạng lưới. Ô nào đã chọn đáp án sẽ đổi màu để bạn không bỏ sót câu hỏi. Bấm vào số câu hỏi bất kỳ để chuyển nhanh tới câu đó.

### Bước 5: Xem Kết Quả & Xem Lại Bài Làm
- Khi bấm **"Nộp Bài Thi"** (hoặc hết giờ), hệ thống sẽ tính điểm tự động.
- Biểu đồ điểm số dạng vòng tròn đẹp mắt hiển thị kèm trạng thái **"ĐẠT"** (trên 70% số câu đúng) hoặc **"CHƯA ĐẠT"**. Hiệu ứng pháo hoa Confetti sẽ bắn tung tóe trên màn hình khi bạn thi đạt điểm đỗ!
- Thống kê chi tiết: số câu đúng, câu sai, câu bỏ qua, và tổng thời gian làm bài.
- Bấm **"Xem lại bài làm"** để xem chi tiết từng câu trong đề thi vừa làm, các câu bạn chọn sai sẽ được đánh dấu đỏ, đáp án chính xác được đánh dấu xanh lá cùng lời giải thích tương ứng.
- Xem lịch sử thi thử 5 lần gần nhất ngay tại màn hình Dashboard để theo dõi tiến độ cải thiện điểm số.

### Bước 6: Xem & Tìm kiếm Ngân hàng Câu hỏi đã nạp (Question Bank Viewer)
- Bấm vào thẻ thống kê **"Tổng số câu hỏi"** trên Dashboard để truy cập màn hình quản lý ngân hàng câu hỏi.
- **Dạng bảng chuẩn xác**: Hiển thị toàn bộ câu hỏi đã tải lên dưới dạng bảng theo đúng cấu trúc cột mà bạn đã import (bao gồm tên tiêu đề cột tương ứng từ Excel).
- **Highlight đáp án đúng**: Đáp án chính xác của mỗi câu hỏi được tự động tô nền xanh lá và viền xanh lá đậm giúp bạn dễ dàng đối chiếu.
- **Tìm kiếm thông minh**: Hỗ trợ tìm kiếm toàn văn theo thời gian thực (real-time filtering) trong câu hỏi, đáp án hoặc giải thích.
- **Phân trang hiệu năng cao**: Tự động phân trang (50 câu hỏi mỗi trang) kèm bộ chọn số trang dạng rút gọn (`1 ... 4 5 [6] 7 8 ... 30`), ngăn chặn việc đơ/lag trình duyệt kể cả khi tải file 1500 câu.

Giao diện thực tế hoạt động:

````carousel
![Bảng danh sách câu hỏi](/home/mynnt/.gemini/antigravity-ide/brain/cd3e3697-bc35-4129-8203-c81c367100dd/questions_list_view_1781842362457.png)
<!-- slide -->
![Tìm kiếm và lọc câu hỏi](/home/mynnt/.gemini/antigravity-ide/brain/cd3e3697-bc35-4129-8203-c81c367100dd/filtered_questions_view_1781842386768.png)
<!-- slide -->
![Video thực tế hoạt động](/home/mynnt/.gemini/antigravity-ide/brain/cd3e3697-bc35-4129-8203-c81c367100dd/verify_questions_bank_viewer_1781842282998.webp)
````

---

> [!IMPORTANT]
> **Khuyến nghị thiết lập workspace:**
> Dự án này hiện nằm trong thư mục làm việc chính thức:
> `/home/mynnt/My Tools`

