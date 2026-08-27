import shutil
import uuid
from pathlib import Path
from typing import List
from fastapi import APIRouter, UploadFile, File, Form, HTTPException

from app.core.config import settings
from app.db.storage import store
from app.rag.engine import get_rag_engine
from app.schemas.schemas import DocumentResponse, MeetingResponse

router = APIRouter()

@router.get("/meetings", response_model=List[MeetingResponse])
def get_meetings():
    return store.get_meetings()

@router.get("", response_model=List[DocumentResponse])
def list_documents():
    return store.get_documents()

@router.post("/upload", response_model=DocumentResponse)
async def upload_document(
    file: UploadFile = File(...),
    meeting_number: int = Form(...),
    topic: str = Form(...)
):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Hanya file PDF yang didukung saat ini.")

    doc_id = str(uuid.uuid4())
    save_filename = f"{doc_id}_{file.filename}"
    save_path = settings.UPLOAD_DIR / save_filename

    with open(save_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    rag = get_rag_engine()
    try:
        chunks_count = rag.ingest_pdf(
            file_path=save_path,
            doc_id=doc_id,
            filename=file.filename,
            meeting_number=meeting_number,
            topic=topic
        )
    except Exception as e:
        if save_path.exists():
            save_path.unlink()
        raise HTTPException(status_code=500, detail=f"Gagal memproses & mengindeks PDF: {str(e)}")

    doc_record = store.add_document({
        "id": doc_id,
        "filename": file.filename,
        "meeting_number": meeting_number,
        "topic": topic,
        "saved_path": str(save_path),
        "chunks_indexed": chunks_count
    })

    # Update meeting topic in metadata store if provided
    store.upsert_meeting(meeting_number, topic)

    return doc_record

@router.delete("/{doc_id}")
def delete_document(doc_id: str):
    deleted_doc = store.delete_document(doc_id)
    if not deleted_doc:
        raise HTTPException(status_code=404, detail="Dokumen tidak ditemukan.")

    # Remove vector chunks from Qdrant
    rag = get_rag_engine()
    rag.delete_document_chunks(doc_id)

    # Delete raw file if exists
    path_str = deleted_doc.get("saved_path")
    if path_str:
        p = Path(path_str)
        if p.exists():
            p.unlink()

    return {"message": "Dokumen berhasil dihapus", "deleted_id": doc_id}
