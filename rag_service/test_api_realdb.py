"""
Test RAG API với Database thực tế
=================================
Kiểm tra toàn diện API suggestion với dữ liệu thực từ PostgreSQL

Yêu cầu:
- API đang chạy tại http://localhost:8001
- PostgreSQL có dữ liệu incidents

Chạy:
    python test_api_realdb.py
"""

import requests
import psycopg2
from psycopg2.extras import RealDictCursor
import time
import random
from collections import defaultdict
from datetime import datetime

# === CONFIG ===
API_URL = "http://localhost:8001"
DB_CONFIG = {
    "host": "localhost",
    "port": 5432,
    "dbname": "smartfactory_db",
    "user": "tuan",
    "password": "12345678"
}

# === DATABASE CONNECTION ===
def get_db_connection():
    """Kết nối PostgreSQL"""
    return psycopg2.connect(**DB_CONFIG, cursor_factory=RealDictCursor)


def get_db_stats():
    """Lấy thống kê từ DB"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Đếm incidents theo department (dùng assigned_department_id)
    cursor.execute("""
        SELECT d.name, COUNT(i.id) as count
        FROM incidents i
        JOIN departments d ON i.assigned_department_id = d.id
        GROUP BY d.name
        ORDER BY count DESC
    """)
    dept_counts = {row['name']: row['count'] for row in cursor.fetchall()}
    
    # Đếm embeddings
    cursor.execute("SELECT COUNT(*) as total FROM incidents")
    total = cursor.fetchone()['total']
    
    cursor.execute("SELECT COUNT(*) as with_emb FROM incidents WHERE embedding IS NOT NULL")
    with_emb = cursor.fetchone()['with_emb']
    
    cursor.close()
    conn.close()
    
    return {
        'total': total,
        'with_embedding': with_emb,
        'without_embedding': total - with_emb,
        'by_department': dept_counts
    }


def get_sample_incidents(n=50):
    """Lấy ngẫu nhiên n incidents từ DB để test"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT i.id, i.description, d.name as department_name
        FROM incidents i
        JOIN departments d ON i.assigned_department_id = d.id
        WHERE i.embedding IS NOT NULL
        ORDER BY RANDOM()
        LIMIT %s
    """, (n,))
    
    samples = cursor.fetchall()
    cursor.close()
    conn.close()
    return samples


# === API TESTING ===
def check_api_health():
    """Kiểm tra API health"""
    try:
        r = requests.get(f"{API_URL}/health", timeout=5)
        return r.json()
    except Exception as e:
        print(f"❌ API không khả dụng: {e}")
        return None


def test_suggestion(description, expected_dept=None):
    """Test một suggestion từ API"""
    try:
        start = time.time()
        r = requests.post(f"{API_URL}/suggest", json={"description": description}, timeout=10)
        elapsed = (time.time() - start) * 1000  # ms
        
        data = r.json()
        
        result = {
            'description': description,
            'expected': expected_dept,
            'elapsed_ms': elapsed
        }
        
        if data.get('suggestion'):
            result.update({
                'predicted': data['suggestion']['department_name'],
                'confidence': data['suggestion']['confidence'],
                'auto_assign': data['suggestion']['auto_assign'],
                'correct': expected_dept and expected_dept == data['suggestion']['department_name']
            })
        else:
            result.update({
                'predicted': None,
                'confidence': 0,
                'auto_assign': False,
                'correct': expected_dept is None
            })
        
        return result
        
    except Exception as e:
        return {
            'description': description,
            'error': str(e)
        }


def run_accuracy_test(samples):
    """Test độ chính xác với samples từ DB"""
    print("\n" + "="*70)
    print("   🎯 TEST ĐỘ CHÍNH XÁC VỚI DỮ LIỆU THỰC")
    print("="*70)
    
    results = []
    dept_results = defaultdict(lambda: {'correct': 0, 'total': 0})
    
    for i, sample in enumerate(samples, 1):
        result = test_suggestion(sample['description'], sample['department_name'])
        results.append(result)
        
        dept = sample['department_name']
        dept_results[dept]['total'] += 1
        if result.get('correct'):
            dept_results[dept]['correct'] += 1
        
        # Progress
        if i % 10 == 0:
            print(f"   Đã test {i}/{len(samples)} samples...")
    
    # Thống kê
    correct = sum(1 for r in results if r.get('correct'))
    total = len(results)
    accuracy = correct / total * 100 if total > 0 else 0
    
    avg_time = sum(r.get('elapsed_ms', 0) for r in results) / len(results)
    avg_confidence = sum(r.get('confidence', 0) for r in results) / len(results)
    
    print("\n" + "-"*70)
    print(f"\n📊 KẾT QUẢ TỔNG HỢP:")
    print(f"   • Tổng test: {total}")
    print(f"   • Đúng: {correct}")
    print(f"   • Sai: {total - correct}")
    print(f"   • Accuracy: {accuracy:.1f}%")
    print(f"   • Avg Response: {avg_time:.1f}ms")
    print(f"   • Avg Confidence: {avg_confidence:.2f}")
    
    print(f"\n📋 CHI TIẾT THEO DEPARTMENT:")
    for dept, stats in sorted(dept_results.items(), key=lambda x: x[1]['total'], reverse=True):
        acc = stats['correct'] / stats['total'] * 100 if stats['total'] > 0 else 0
        status = "✅" if acc >= 80 else "⚠️" if acc >= 50 else "❌"
        print(f"   {status} {dept}: {stats['correct']}/{stats['total']} ({acc:.0f}%)")
    
    return {
        'accuracy': accuracy,
        'avg_time': avg_time,
        'avg_confidence': avg_confidence,
        'by_department': dict(dept_results)
    }



def run_edge_case_test():
    """Test các trường hợp đặc biệt"""
    print("\n" + "="*70)
    print("   🔍 TEST EDGE CASES")
    print("="*70)
    
    edge_cases = [
        ("", "Empty string"),
        ("abc", "Quá ngắn"),
        ("Hôm nay trời đẹp quá", "Không liên quan"),
        ("!!!???@@@###", "Ký tự đặc biệt"),
        ("a " * 200, "Rất dài vô nghĩa"),
    ]
    
    print()
    for query, case_name in edge_cases:
        result = test_suggestion(query)
        predicted = result.get('predicted', 'None')
        conf = result.get('confidence', 0)
        auto = "AUTO" if result.get('auto_assign') else "MANUAL"
        time_ms = result.get('elapsed_ms', 0)
        
        # Edge cases should have low confidence or None prediction
        status = "✅" if predicted == 'None' or conf < 0.4 else "⚠️"
        
        print(f"   {status} [{case_name}]")
        print(f"      Query: {query[:40]}...")
        print(f"      → {predicted} ({conf:.2f}) {auto} [{time_ms:.0f}ms]")
        print()


def run_department_test():
    """Test từng department với các câu hỏi tương tự dữ liệu thực trong DB"""
    print("\n" + "="*70)
    print("   🏢 TEST THEO DEPARTMENT (TÌNH HUỐNG THỰC TẾ)")
    print("="*70)
    
    # Test cases dựa trên dữ liệu thực trong DB
    test_cases = {
        "Phòng thiết bị": [
            "Phát hiện rò rỉ dầu thủy lực tại xilanh máy ép, dầu chảy ra sàn",
            "Biến tần điều khiển motor robot báo lỗi quá dòng OC",
            "Máy dập kim loại bị lệch tâm, sản phẩm ra bị méo",
            "Cảm biến nhiệt độ lò nung hiển thị giá trị sai lệch",
            "Toilet tầng 3 bị tắc nghẽn, nước không thoát được",
            "Đèn chiếu sáng khu vực hành lang bị hỏng, tối om",
            "Máy nén khí bị quá nhiệt, áp suất không ổn định",
        ],
        "Quản lý sản xuất": [
            "Khu vực thiết bị nguy hiểm thiếu biển cảnh báo an toàn",
            "Phát hiện rò rỉ hóa chất dầu công nghiệp tại bồn chứa",
            "Công nhân bị thương do không đeo bảo hộ lao động",
            "Khí gas rò rỉ tại khu vực hàn, có mùi hắc",
            "Phát hiện cháy nhỏ tại kho vật liệu dễ cháy",
            "Khu vực có dấu hiệu ngập nước do mưa lớn",
        ],
        "Phòng đánh giá chất lượng": [
            "Kiểm tra độ cứng sản phẩm sau nhiệt luyện không đạt tiêu chuẩn",
            "Màu sơn trên sản phẩm bị phai nhạt sau test UV",
            "Kích thước sản phẩm vượt dung sai cho phép 0.05mm",
            "Chi tiết lắp ráp sai vị trí, không khớp với bản vẽ",
            "Phát hiện vết xước trên bề mặt sản phẩm hoàn thiện",
            "Tỷ lệ lỗi NG cao ở công đoạn kiểm tra cuối",
        ],
        "Sản xuất": [
            "Máy in tại xưởng 2 liên tục bị kẹt giấy khi in hai mặt",
            "Cần bổ sung văn phòng phẩm: giấy A4, bút bi, ghim dập",
            "Các bộ lọc điều hòa cần được thay mới sau 3 tháng",
            "Wifi trong phòng họp không ổn định, hay bị ngắt",
            "Máy chiếu phòng họp bị mờ, cần thay bóng đèn",
            "Ghế văn phòng bị gãy, cần thay mới",
        ],
    }
    
    results = {}
    total_correct = 0
    total_tests = 0
    
    for dept, queries in test_cases.items():
        print(f"\n📋 {dept}:")
        dept_correct = 0
        dept_total = len(queries)
        
        for query in queries:
            result = test_suggestion(query, dept)
            predicted = result.get('predicted', 'None')
            conf = result.get('confidence', 0)
            is_correct = result.get('correct', False)
            
            if is_correct:
                dept_correct += 1
                status = "✅"
            else:
                status = "❌"
            
            print(f"   {status} [{conf:.2f}] {query[:55]}...")
            if not is_correct and predicted:
                print(f"         → Predicted: {predicted}")
        
        acc = dept_correct / dept_total * 100
        results[dept] = {'correct': dept_correct, 'total': dept_total, 'accuracy': acc}
        total_correct += dept_correct
        total_tests += dept_total
        print(f"   📊 {dept}: {dept_correct}/{dept_total} ({acc:.0f}%)")
    
    # Summary
    overall_acc = total_correct / total_tests * 100 if total_tests > 0 else 0
    print(f"\n{'='*70}")
    print(f"   📊 TỔNG KẾT TEST DEPARTMENT: {total_correct}/{total_tests} ({overall_acc:.0f}%)")
    print(f"{'='*70}")
    
    return results


def run_batch_embedding_test():
    """Test batch embedding API"""
    print("\n" + "="*70)
    print("   📦 TEST BATCH EMBEDDING")
    print("="*70)
    
    try:
        # Check stats
        r = requests.get(f"{API_URL}/embeddings/stats", timeout=5)
        stats = r.json()
        
        print(f"\n📊 EMBEDDING STATS:")
        print(f"   • Total: {stats['total']}")
        print(f"   • With embedding: {stats['with_embedding']}")
        print(f"   • Without embedding: {stats['without_embedding']}")
        
        if stats['without_embedding'] > 0:
            print(f"\n⚠️ Có {stats['without_embedding']} incidents chưa có embedding")
            print("   Chạy POST /embeddings/batch để tạo embeddings")
        else:
            print("\n✅ Tất cả incidents đã có embedding")
            
    except Exception as e:
        print(f"❌ Lỗi: {e}")


def main():
    """Main test runner"""
    print("\n" + "="*70)
    print("   🧪 RAG API TEST - PHASED TESTING WITH REAL DB")
    print(f"   📅 {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("="*70)
    
    # 1. Check API health
    print("\n📡 Kiểm tra API...")
    health = check_api_health()
    if not health:
        print("❌ Không thể kết nối API. Hãy chạy API trước.")
        print("   Lệnh: cd BGE-M3/rag_service && python main.py")
        return
    
    print(f"   ✅ API OK")
    print(f"   • Model: {health.get('model', 'N/A')}")
    print(f"   • Embeddings: {health.get('embeddings', {}).get('with_embedding', 0)}")
    
    # 2. Get DB stats
    print("\n📊 Lấy thống kê từ Database...")
    try:
        db_stats = get_db_stats()
        print(f"   ✅ Kết nối DB OK")
        print(f"   • Total incidents: {db_stats['total']}")
        print(f"   • With embedding: {db_stats['with_embedding']}")
        print(f"   • Departments: {len(db_stats['by_department'])}")
    except Exception as e:
        print(f"   ❌ Lỗi DB: {e}")
        return
    
    # 3. Run tests
    run_batch_embedding_test()
    run_edge_case_test()
    dept_results = run_department_test()  # Test theo từng department với tình huống thực
    
    # 4. Accuracy test with samples
    print("\n📥 Lấy samples từ DB để test accuracy...")
    samples = get_sample_incidents(100)
    print(f"   ✅ Lấy được {len(samples)} samples")
    
    if samples:
        accuracy_result = run_accuracy_test(samples)
        
        # Summary
        print("\n" + "="*70)
        print("   📊 TỔNG KẾT")
        print("="*70)
        print(f"\n   🎯 Accuracy: {accuracy_result['accuracy']:.1f}%")
        print(f"   ⏱️ Avg Response: {accuracy_result['avg_time']:.1f}ms")
        print(f"   📈 Avg Confidence: {accuracy_result['avg_confidence']:.2f}")
        
        if accuracy_result['accuracy'] >= 80:
            print("\n   ✅ Model hoạt động tốt!")
        elif accuracy_result['accuracy'] >= 60:
            print("\n   ⚠️ Model cần cải thiện")
        else:
            print("\n   ❌ Model cần được huấn luyện lại")
    
    print("\n" + "="*70)
    print("   TEST HOÀN TẤT")
    print("="*70 + "\n")


if __name__ == "__main__":
    main()
