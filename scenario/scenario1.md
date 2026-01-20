1. Luồng 1: Tra cứu & Sàng lọc (Duplicate Check & Self-Service)
Mục tiêu: Ngăn chặn việc gửi nhiều yêu cầu cho cùng một vấn đề đã được giải quyết hoặc đang được xử lý. Hệ thống đóng vai trò như một "Knowledge Base" (Cơ sở tri thức).
Bước 1: Nhập liệu (Input)
Worker truy cập chức năng "Gửi ý kiến/Góp ý".
Worker nhập từ khóa hoặc nội dung vào ô tiêu đề/mô tả (Ví dụ: "Đồ ăn ca 3 nguội").
Bước 2: Hệ thống gợi ý (System Suggestion)
Ngay khi nhập, hệ thống tự động quét cơ sở dữ liệu (lịch sử các vấn đề đã Closed/Resolved hoặc In Progress).
Hệ thống hiển thị danh sách "Các vấn đề tương tự đã ghi nhận".
Bước 3: Người dùng kiểm tra (User Verification)
Worker nhìn thấy một ticket cũ: "Phản ánh suất ăn ca 3 nguội (Ngày 15/01) - Trạng thái: Đã xử lý - Giải pháp: GA đã bố trí người trực."
Worker đọc nội dung và nhận thấy vấn đề đã có giải pháp hoặc đang được khắc phục.
Bước 4: Kết thúc luồng (End Flow)
Worker quyết định KHÔNG nhấn nút gửi.
Worker thoát màn hình.
Giá trị: Tiết kiệm thời gian nhập liệu cho Worker và thời gian rà soát cho Quản lý.


2.CHI TIẾT LUỒNG 2: GỬI MỚI & XỬ LÝ (QUY TRÌNH 6 BƯỚC)
Bước 1: Khởi tạo (Worker)
Hành động: Worker nhập nội dung "Đèn khu vực kiểm hàng bị tối", hệ thống kiểm tra không trùng lặp -> Worker ấn nút [Gửi].

Trạng thái hệ thống: Chờ tiếp nhận (Waiting for Reception).

Ý nghĩa: Ý kiến đã vào hệ thống, nhưng chưa có ai đụng vào.

Bước 2: Sàng lọc (Admin/Tiếp nhận viên)
Hành động: Bộ phận tiếp nhận (hoặc thư ký sản xuất) thấy thông báo, ấn nút [Tiếp nhận].

Trạng thái hệ thống: Đang xem xét (Under Review).

Ý nghĩa: Xác nhận đã có người đọc, đang đi kiểm tra thực tế hoặc chờ sếp quyết định.

Bước 3: Phê duyệt & Đánh giá mức độ (Quản lý)
Hành động: Quản lý xem xét xong, quyết định làm.

Ấn nút [Phê duyệt].

Chọn Độ khó (Difficulty Level): Ví dụ chọn mức Trung bình (do cần thay chóa đèn, không chỉ thay bóng).

Trạng thái hệ thống: Đã phê duyệt (Approved).

Ý nghĩa: Giải pháp đã được thông qua, đang nằm trong hàng đợi (Queue) chờ thợ bảo trì rảnh tay để làm.

Bước 4: Bắt đầu thực thi (Bộ phận thực hiện/Kỹ thuật)
Hành động: Khi thợ bảo trì mang đồ nghề đến hiện trường:

Viết Ghi chú (Note): "Đã chuẩn bị bóng LED 50W, bắt đầu ngắt điện để thay".

Ấn nút [Bắt đầu triển khai].

Trạng thái hệ thống: Đang triển khai (In Progress).

Ý nghĩa: Đồng hồ tính giờ bắt đầu chạy (để đo thời gian sửa chữa thực tế). Worker nhìn vào app sẽ biết là thợ đang làm rồi.

Bước 5: Kết thúc kỹ thuật (Bộ phận thực hiện)
Hành động: Sau khi thay đèn xong và bật thử sáng tốt -> Ấn nút [Hoàn thành].

Trạng thái hệ thống: Hoàn thành (Completed).

Ý nghĩa: Về mặt kỹ thuật, công việc đã xong.

Bước 6: Đánh giá & Đóng (Worker)
Hành động: Worker nhận thông báo "Đèn đã thay xong", kiểm tra thấy sáng tốt.

Chọn Mức độ hài lòng: 5 sao.

(Tùy chọn) Ghi comment: "Cảm ơn, đèn rất sáng".

Ấn [Gửi đánh giá].

Trạng thái hệ thống: Đã đóng (Closed/Rated).