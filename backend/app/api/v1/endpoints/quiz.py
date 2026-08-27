from fastapi import APIRouter, HTTPException
from app.db.storage import store
from app.rag.engine import get_rag_engine
from app.schemas.schemas import QuizRequest, QuizResponse

router = APIRouter()

@router.post("/generate", response_model=QuizResponse)
def generate_quiz(req: QuizRequest):
    meetings = store.get_meetings()
    m_info = next((m for m in meetings if m["number"] == req.meeting_number), None)
    topic = m_info["topic"] if m_info else f"Pertemuan {req.meeting_number}"

    query_text = (
        f"Buatkan {req.question_count or 5} soal pilihan ganda (opsi A, B, C, D) "
        f"beserta Kunci Jawaban dan Penjelasannya tentang materi {topic} (Pertemuan {req.meeting_number})."
    )

    rag = get_rag_engine()
    result = rag.query(
        query_text=query_text,
        meeting_filters=[req.meeting_number],
        mode="quiz"
    )

    return QuizResponse(
        meeting_number=req.meeting_number,
        topic=topic,
        quiz_content=result["answer"],
        sources=result["sources"]
    )
