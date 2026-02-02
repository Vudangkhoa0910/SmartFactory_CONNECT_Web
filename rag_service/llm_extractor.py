"""
LLM Extractor - Sử dụng Mistral AI để trích xuất vấn đề chính từ nội dung
Loại bỏ các phần "mong xem xét", "kính đề nghị", "xin kiểm tra"...
"""
import os
import httpx
from typing import Optional

# Config
MISTRAL_API_KEY = os.getenv("MISTRAL_API_KEY", "")
MISTRAL_MODEL = os.getenv("MISTRAL_MODEL", "mistral-large-latest")
LLM_EXTRACT_ENABLED = os.getenv("LLM_EXTRACT_ENABLED", "true").lower() == "true"

# Prompt để extract vấn đề chính
EXTRACT_PROMPT = """Bạn là AI chuyên trích xuất vấn đề/ý tưởng chính từ văn bản tiếng Việt.

Quy tắc:
1. CHỈ trả về phần mô tả vấn đề/ý tưởng CHÍNH
2. LOẠI BỎ hoàn toàn các phần:
   - Lời đề nghị: "mong xem xét", "kính đề nghị", "xin ban lãnh đạo", "đề xuất xử lý"
   - Lời mở đầu: "kính gửi", "thưa", "gửi đến"
   - Lời cảm ơn: "xin cảm ơn", "trân trọng"
3. Giữ nguyên nội dung quan trọng, không thêm bớt ý
4. Trả về ngắn gọn, súc tích
5. Nếu không có phần đề nghị, trả về nguyên văn

Ví dụ:
Input: "Cơm thường xuyên bị khô, canh thì mặn. Mong công đoàn kiểm tra lại nhà thầu bếp ăn."
Output: "Cơm thường xuyên bị khô, canh thì mặn"

Input: "Kính gửi ban lãnh đạo, máy CNC số 5 hay bị lỗi treo. Xin xem xét sửa chữa."
Output: "Máy CNC số 5 hay bị lỗi treo"

Input: "Đề xuất thêm quạt mát cho xưởng sản xuất vì trời nóng"
Output: "Thêm quạt mát cho xưởng sản xuất vì trời nóng"

Bây giờ xử lý văn bản sau:
"""


async def extract_core_issue(text: str) -> str:
    """
    Trích xuất vấn đề/ý tưởng chính từ nội dung, loại bỏ phần đề nghị.
    
    Args:
        text: Nội dung gốc (description + expected_benefit)
        
    Returns:
        Nội dung đã được làm sạch, chỉ giữ vấn đề chính
    """
    # Skip nếu disabled hoặc không có API key
    if not LLM_EXTRACT_ENABLED or not MISTRAL_API_KEY:
        print("[LLM] Disabled or no API key, returning original text")
        return text
    
    # Skip nếu text quá ngắn
    if len(text.strip()) < 20:
        return text
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                "https://api.mistral.ai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {MISTRAL_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": MISTRAL_MODEL,
                    "messages": [
                        {"role": "user", "content": EXTRACT_PROMPT + text}
                    ],
                    "temperature": 0.1,  # Low temperature for consistency
                    "max_tokens": 500
                }
            )
            
            if response.status_code == 200:
                result = response.json()
                extracted = result["choices"][0]["message"]["content"].strip()
                
                # Validate: không trả về kết quả quá khác biệt
                if len(extracted) > 0 and len(extracted) < len(text) * 2:
                    print(f"[LLM] Extracted: '{text[:50]}...' -> '{extracted[:50]}...'")
                    return extracted
                else:
                    print(f"[LLM] Invalid response, using original")
                    return text
            else:
                print(f"[LLM] API error {response.status_code}: {response.text[:200]}")
                return text
                
    except Exception as e:
        print(f"[LLM] Exception: {e}")
        return text


def extract_core_issue_sync(text: str) -> str:
    """
    Synchronous version - sử dụng cho batch processing.
    """
    import asyncio
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            # Đang trong async context, tạo task mới
            import concurrent.futures
            with concurrent.futures.ThreadPoolExecutor() as executor:
                future = executor.submit(asyncio.run, extract_core_issue(text))
                return future.result(timeout=35)
        else:
            return loop.run_until_complete(extract_core_issue(text))
    except Exception as e:
        print(f"[LLM] Sync extraction failed: {e}")
        return text
