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
2. Luồng 2: Gửi mới & Quy trình xử lý (New Issue Submission & Handling)
Mục tiêu: Ghi nhận vấn đề về cơ sở vật chất (ánh sáng) ảnh hưởng đến sản xuất/an toàn, đảm bảo được phê duyệt và xử lý dứt điểm.
Bước 1: Nhập liệu & Kiểm tra (Input & Check)
Worker nhập nội dung: "Đèn tại khu vực kiểm hàng dây chuyền 2 bị yếu/nhấp nháy, gây mỏi mắt và khó soi lỗi."
Hệ thống quét lịch sử và trả về kết quả rỗng (Chưa có ai báo cáo vấn đề này tại vị trí này gần đây).
Bước 2: Gửi yêu cầu (Submission)
Worker nhấn nút "Gửi ý kiến".
Hệ thống tạo một Ticket mới với trạng thái: Chờ phê duyệt (Pending Approval).
Bước 3: Quản lý tiếp nhận (Manager Review)
Quản lý (Leader sản xuất/Xưởng trưởng) nhận thông báo trên hệ thống.
Quản lý xác thực nhanh: Đi qua khu vực dây chuyền 2 để kiểm tra độ sáng thực tế.
Bước 4: Phê duyệt & Đưa ra hướng xử lý (Approve & Direct)
Sau khi xác nhận đúng là đèn tối, Quản lý nhấn "Phê duyệt" (Approve).
Quản lý nhập hướng xử lý vào hệ thống:
Hướng xử lý: "Thay bóng đèn LED mới công suất cao hơn."
Gán cho (Assign to): Bộ phận Cơ điện/Bảo trì (Maintenance).
Deadline: "Trước ca làm việc ngày mai."
Bước 5: Cập nhật trạng thái (System Update)
Ticket chuyển sang trạng thái: Đang xử lý (In Progress).
Worker nhận được thông báo phản hồi: "Yêu cầu đã được duyệt. Bộ phận Bảo trì sẽ thay bóng đèn trước ca làm việc ngày mai."

