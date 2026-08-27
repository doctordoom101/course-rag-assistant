import uuid
from typing import List
from fastapi import APIRouter, HTTPException

from app.db.storage import store
from app.rag.engine import get_rag_engine
from app.schemas.schemas import ChatRequest, ChatResponse

router = APIRouter()

@router.post("", response_model=ChatResponse)
def chat_with_assistant(req: ChatRequest):
    conv_id = req.conversation_id or str(uuid.uuid4())
    
    rag = get_rag_engine()
    result = rag.query(
        query_text=req.message,
        meeting_filters=req.meeting_filters,
        explanation_level=req.explanation_level or "normal",
        mode=req.mode or "chat"
    )

    # Save to history store
    existing_conv = store.get_conversation(conv_id)
    messages = existing_conv.get("messages", []) if existing_conv else []
    
    messages.append({
        "role": "user",
        "content": req.message,
        "meeting_filters": req.meeting_filters,
        "explanation_level": req.explanation_level
    })
    messages.append({
        "role": "assistant",
        "content": result["answer"],
        "sources": result["sources"]
    })

    title = messages[0]["content"][:30] + "..." if len(messages) > 0 else "Conversation"
    store.save_conversation(conv_id, title, messages)

    return ChatResponse(
        conversation_id=conv_id,
        answer=result["answer"],
        sources=result["sources"]
    )

@router.get("/conversations")
def get_conversations():
    return store.get_conversations()

@router.get("/conversations/{conv_id}")
def get_conversation_detail(conv_id: str):
    conv = store.get_conversation(conv_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Percakapan tidak ditemukan.")
    return conv
