"""
Batch Processor
Tao embeddings cho nhieu incidents cung luc
"""
import time
from typing import Optional
from tqdm import tqdm

from database import db
from embedding_service import embedding_service


class BatchProcessor:
    """Xu ly batch tao embeddings"""

    def process_all(self, batch_size: int = 50, max_records: Optional[int] = None) -> dict:
        """Tao embeddings cho tat ca incidents chua co"""
        stats = db.count_embeddings()
        to_process = stats['without_embedding']

        if max_records:
            to_process = min(to_process, max_records)

        if to_process == 0:
            return {
                'success': True,
                'processed': 0,
                'message': 'Tat ca incidents da co embedding'
            }

        print(f"Processing {to_process} incidents (batch_size={batch_size})...")

        start = time.time()
        processed = 0
        failed = 0

        # Tinh so batches
        num_batches = (to_process + batch_size - 1) // batch_size

        for _ in tqdm(range(num_batches), desc="Processing"):
            # Lay batch incidents
            incidents = db.get_incidents_without_embedding(limit=batch_size)
            if not incidents:
                break

            # Tao embeddings
            texts = [inc['description'] for inc in incidents]
            embeddings = embedding_service.encode(texts)

            # Luu vao database
            data = [
                {'id': inc['id'], 'embedding': emb}
                for inc, emb in zip(incidents, embeddings)
            ]
            saved = db.save_embeddings_batch(data)

            processed += saved
            failed += len(incidents) - saved

        elapsed = time.time() - start

        return {
            'success': True,
            'processed': processed,
            'failed': failed,
            'time_seconds': elapsed,
            'speed': processed / elapsed if elapsed > 0 else 0
        }

    def process_single(self, incident_id: str, description: str) -> bool:
        """Tao embedding cho 1 incident"""
        embedding = embedding_service.encode(description)
        return db.save_embedding(incident_id, embedding)


# Singleton instance
processor = BatchProcessor()


if __name__ == "__main__":
    print("\n" + "="*50)
    print("BATCH PROCESSOR - TAO EMBEDDINGS")
    print("="*50 + "\n")
    
    # Hien thi thong ke hien tai
    stats = db.count_embeddings()
    print(f"Thong ke hien tai:")
    print(f"  - Tong incidents: {stats['total']}")
    print(f"  - Da co embedding: {stats['with_embedding']}")
    print(f"  - Chua co embedding: {stats['without_embedding']}")
    print(f"  - Tien do: {stats['percentage']:.1f}%\n")
    
    if stats['without_embedding'] > 0:
        print("Bat dau xu ly...\n")
        result = processor.process_all(batch_size=50)
        print(f"\nKet qua:")
        print(f"  - Da xu ly: {result['processed']} incidents")
        print(f"  - That bai: {result.get('failed', 0)}")
        print(f"  - Thoi gian: {result.get('time_seconds', 0):.2f}s")
        print(f"  - Toc do: {result.get('speed', 0):.1f} records/s")
        
        # Hien thi thong ke sau khi xu ly
        stats_after = db.count_embeddings()
        print(f"\nThong ke sau xu ly:")
        print(f"  - Da co embedding: {stats_after['with_embedding']}")
        print(f"  - Tien do: {stats_after['percentage']:.1f}%")
    else:
        print("Khong co incidents nao can xu ly.")
