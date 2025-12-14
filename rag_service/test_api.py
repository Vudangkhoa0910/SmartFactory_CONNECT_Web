"""
Test RAG API - Kiểm tra kết quả suggestion
"""
import requests

BASE_URL = "http://localhost:8001"


def test_suggest(description: str, expected_dept: str = None):
    """Test department suggestion"""
    response = requests.post(f"{BASE_URL}/suggest", json={"description": description})
    data = response.json()
    
    if data["suggestion"]:
        dept = data["suggestion"]["department_name"]
        conf = data["suggestion"]["confidence"] * 100
        auto = "✅ AUTO" if data["suggestion"]["auto_assign"] else "⚠️ MANUAL"
        match = "✅" if expected_dept and expected_dept in dept else "❌" if expected_dept else ""
        print(f"{match} [{conf:.0f}%] {dept} {auto}")
        print(f"   → {description[:60]}...")
    else:
        print(f"❌ [--] Không tìm thấy")
        print(f"   → {description[:60]}...")
    print()


def main():
    print("\n" + "="*60)
    print("   RAG DEPARTMENT SUGGESTION TEST")
    print("="*60 + "\n")
    
    # Health check
    r = requests.get(f"{BASE_URL}/health")
    info = r.json()
    print(f"📊 Model: {info['model']}")
    print(f"📊 Embeddings: {info['embeddings']['with_embedding']}")
    print()
    
    # Test cases
    print("🔧 THIẾT BỊ:")
    test_suggest("Máy CNC bị lỗi, không hoạt động được", "Phòng thiết bị")
    test_suggest("Motor máy ép bị quá nhiệt, cần kiểm tra", "Phòng thiết bị")
    test_suggest("PLC báo lỗi E045, dây chuyền dừng", "Phòng thiết bị")
    
    print("🔥 AN TOÀN:")
    test_suggest("Phát hiện hóa chất rò rỉ từ bồn chứa", "Quản lý sản xuất")
    test_suggest("Dây điện bị hở, nguy cơ điện giật", "Quản lý sản xuất")
    test_suggest("Khí gas rò rỉ tại kho lưu trữ", "Quản lý sản xuất")
    
    print("📋 CHẤT LƯỢNG:")
    test_suggest("Sản phẩm có vết xước trên bề mặt", "Phòng đánh giá chất lượng")
    test_suggest("Kích thước vượt dung sai cho phép", "Phòng đánh giá chất lượng")
    test_suggest("Màu sắc không đồng nhất với mẫu", "Phòng đánh giá chất lượng")
    
    print("🏢 CƠ SỞ VẬT CHẤT:")
    test_suggest("Máy điều hòa không mát, nhiệt độ cao", "Sản xuất")
    test_suggest("Wifi không ổn định, ảnh hưởng làm việc", "Sản xuất")
    test_suggest("Đèn bị cháy, không có ánh sáng", "Sản xuất")
    
    print("🚫 SPAM/KHÔNG LIÊN QUAN:")
    test_suggest("Hôm nay trời đẹp quá", None)
    test_suggest("Xin chào mọi người", None)


if __name__ == "__main__":
    main()
