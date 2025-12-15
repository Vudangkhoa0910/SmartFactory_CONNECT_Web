"""
Batch Processor
Tạo embeddings cho nhiều records cùng lúc
Hỗ trợ: incidents, ideas, news
"""
import time
from typing import Optional
from tqdm import tqdm

from database import db, ContentType
from embedding_service import embedding_service


class BatchProcessor:
    """Xử lý batch tạo embeddings cho nhiều loại content"""

    def process_all(
        self,
        batch_size: int = 50,
        max_records: Optional[int] = None,
        content_type: ContentType = ContentType.INCIDENT
    ) -> dict:
        """
        Tạo embeddings cho tất cả records chưa có.
        
        Args:
            batch_size: Số records xử lý mỗi batch
            max_records: Giới hạn số records tối đa
            content_type: Loại content (INCIDENT, IDEA, NEWS)
        """
        stats = db.count_embeddings(content_type)
        to_process = stats['without_embedding']

        if max_records:
            to_process = min(to_process, max_records)

        if to_process == 0:
            return {
                'success': True,
                'content_type': content_type.value,
                'processed': 0,
                'message': f'Tất cả {content_type.value}s đã có embedding'
            }

        print(f"Processing {to_process} {content_type.value}s (batch_size={batch_size})...")

        start = time.time()
        processed = 0
        failed = 0

        # Tính số batches
        num_batches = (to_process + batch_size - 1) // batch_size

        for _ in tqdm(range(num_batches), desc=f"Processing {content_type.value}s"):
            # Lấy batch records
            records = db.get_records_without_embedding(content_type, limit=batch_size)
            if not records:
                break

            # Tạo embeddings
            data = []
            for record in records:
                text = db.get_text_for_embedding(content_type, record)
                if text and len(text.strip()) >= 5:
                    embedding = embedding_service.encode(text)
                    data.append({'id': record['id'], 'embedding': embedding})

            # Lưu vào database
            if data:
                saved = db.save_embeddings_batch(content_type, data)
                processed += saved
                failed += len(records) - saved
            else:
                failed += len(records)

        elapsed = time.time() - start

        return {
            'success': True,
            'content_type': content_type.value,
            'processed': processed,
            'failed': failed,
            'time_seconds': round(elapsed, 2),
            'speed': round(processed / elapsed, 1) if elapsed > 0 else 0
        }

    def process_all_types(self, batch_size: int = 50) -> dict:
        """Xử lý tất cả các loại content"""
        results = {}
        for ct in ContentType:
            print(f"\n{'='*50}")
            print(f"Processing {ct.value}s...")
            print('='*50)
            results[ct.value] = self.process_all(batch_size=batch_size, content_type=ct)
        return results

    def process_single(
        self,
        content_type: ContentType,
        record_id: str,
        text: str
    ) -> bool:
        """Tạo embedding cho 1 record"""
        embedding = embedding_service.encode(text)
        return db.save_embedding(content_type, record_id, embedding)


# Singleton instance
processor = BatchProcessor()


if __name__ == "__main__":
    import sys

    print("\n" + "="*60)
    print("BATCH PROCESSOR - CREATE EMBEDDINGS FOR ALL CONTENT TYPES")
    print("="*60 + "\n")

    # Parse command line args
    if len(sys.argv) > 1:
        ct_arg = sys.argv[1].lower()
        ct_map = {"incident": ContentType.INCIDENT, "idea": ContentType.IDEA, "news": ContentType.NEWS}
        if ct_arg in ct_map:
            content_type = ct_map[ct_arg]
        elif ct_arg == "all":
            content_type = None  # Process all
        else:
            print(f"Usage: python batch_processor.py [incident|idea|news|all]")
            sys.exit(1)
    else:
        content_type = None  # Process all by default

    # Display current stats
    stats = db.count_embeddings()
    print("Current stats:")
    print(f"  - Total: {stats['total']} records")
    print(f"  - With embedding: {stats['with_embedding']}")
    print(f"  - Without embedding: {stats['total'] - stats['with_embedding']}")
    print(f"  - Progress: {stats['percentage']:.1f}%")
    print("\nBy type:")
    for ct_name, ct_stats in stats.get('by_type', {}).items():
        print(f"  - {ct_name}: {ct_stats['with_embedding']}/{ct_stats['total']} ({ct_stats['percentage']:.1f}%)")

    # Process
    if content_type:
        # Process specific type
        ct_stats = db.count_embeddings(content_type)
        if ct_stats['without_embedding'] > 0:
            print(f"\nProcessing {content_type.value}s...")
            result = processor.process_all(batch_size=50, content_type=content_type)
            print(f"\nResult:")
            print(f"  - Processed: {result['processed']} records")
            print(f"  - Failed: {result.get('failed', 0)}")
            print(f"  - Time: {result.get('time_seconds', 0):.2f}s")
            print(f"  - Speed: {result.get('speed', 0):.1f} records/s")
        else:
            print(f"\nAll {content_type.value}s already have embedding.")
    else:
        # Process all types
        total_without = stats['total'] - stats['with_embedding']
        if total_without > 0:
            print(f"\nProcessing all types...\n")
            results = processor.process_all_types(batch_size=50)

            print("\n" + "="*60)
            print("SUMMARY")
            print("="*60)
            total_processed = 0
            for ct_name, result in results.items():
                print(f"  - {ct_name}: {result['processed']} processed, {result.get('failed', 0)} failed")
                total_processed += result['processed']
            print(f"\nTotal: {total_processed} records processed")
        else:
            print("\nAll records already have embedding.")

    # Display stats after processing
    print("\n" + "="*60)
    stats_after = db.count_embeddings()
    print("Stats after processing:")
    print(f"  - With embedding: {stats_after['with_embedding']}/{stats_after['total']}")
    print(f"  - Progress: {stats_after['percentage']:.1f}%")
    print("="*60 + "\n")
