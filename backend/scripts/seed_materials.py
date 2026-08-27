import os
import shutil
import uuid
from pathlib import Path

# Set PYTHONPATH to backend directory
import sys
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.core.config import settings, ELEARNING_DIR
from app.db.storage import store
from app.rag.engine import get_rag_engine

FILE_MEETING_MAP = [
    {"filename": "1 Pengantar Big Data.pdf", "meeting": 1, "topic": "Pengantar Big Data"},
    {"filename": "2 Analisis Big Data Bagian I.pdf", "meeting": 2, "topic": "Analisis Big Data Bagian I"},
    {"filename": "Bab 3 Adopsi Big Data.pdf", "meeting": 3, "topic": "Adopsi Big Data"},
    {"filename": "Bab 4 Penyimpanan dalam Big Data.pdf", "meeting": 4, "topic": "Penyimpanan dalam Big Data"},
    {"filename": "Bab 5 Exploratory Data Analysis.pdf", "meeting": 5, "topic": "Exploratory Data Analysis"},
    {"filename": "Bab 6 Processing Concept di Big Data.pdf", "meeting": 6, "topic": "Processing Concept di Big Data"},
    {"filename": "Bab 7 Big Data Technologies.pdf", "meeting": 7, "topic": "Big Data Technologies"},
    {"filename": "08 AD Statistik untuk Analitik Data.pdf", "meeting": 8, "topic": "Statistik untuk Analitik Data"},
    {"filename": "Bab 10 Teknik Analitik Data.pdf", "meeting": 10, "topic": "Teknik Analitik Data"},
    {"filename": "Bab 11 Analitik Deskriptif.pdf", "meeting": 11, "topic": "Analitik Deskriptif"},
    {"filename": "Bab 12 Analitik Prediktif n Preskriptif.pdf", "meeting": 12, "topic": "Analitik Prediktif & Preskriptif"},
    {"filename": "Studi Kasus Analitik Data dengan Python.pdf", "meeting": 13, "topic": "Studi Kasus Analitik Data dengan Python"},
]

def seed():
    print(f"Starting seeding from directory: {ELEARNING_DIR}")
    if not ELEARNING_DIR.exists():
        print(f"Directory {ELEARNING_DIR} not found!")
        return

    rag = get_rag_engine()
    existing_docs = {d["filename"]: d for d in store.get_documents()}

    for item in FILE_MEETING_MAP:
        fname = item["filename"]
        m_num = item["meeting"]
        topic = item["topic"]
        source_path = ELEARNING_DIR / fname

        if not source_path.exists():
            print(f"File {fname} not found in {ELEARNING_DIR}, skipping.")
            continue

        if fname in existing_docs:
            print(f"Document {fname} already seeded in metadata store.")
            continue

        doc_id = str(uuid.uuid4())
        dest_filename = f"{doc_id}_{fname}"
        dest_path = settings.UPLOAD_DIR / dest_filename

        shutil.copy(source_path, dest_path)
        print(f"Ingesting PDF: {fname} (Pertemuan {m_num})...")

        try:
            chunks_count = rag.ingest_pdf(
                file_path=dest_path,
                doc_id=doc_id,
                filename=fname,
                meeting_number=m_num,
                topic=topic
            )

            store.add_document({
                "id": doc_id,
                "filename": fname,
                "meeting_number": m_num,
                "topic": topic,
                "saved_path": str(dest_path),
                "chunks_indexed": chunks_count
            })
            store.upsert_meeting(m_num, topic)
            print(f"Successfully seeded {fname}: {chunks_count} chunks.")
        except Exception as e:
            print(f"Error seeding {fname}: {e}")

    print("Seeding completed successfully!")

if __name__ == "__main__":
    seed()
