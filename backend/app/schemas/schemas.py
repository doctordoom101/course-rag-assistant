from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class DocumentResponse(BaseModel):
    id: str
    filename: str
    meeting_number: int
    topic: str
    uploaded_at: str
    chunks_indexed: int

class MeetingResponse(BaseModel):
    number: int
    topic: str
    description: Optional[str] = ""

class SourceItem(BaseModel):
    filename: str
    meeting_number: Any
    topic: Optional[str] = ""
    page_label: Any
    snippet: str

class ChatRequest(BaseModel):
    message: str
    meeting_filters: Optional[List[int]] = Field(default_factory=list)
    explanation_level: Optional[str] = "normal"  # "normal", "beginner", "intermediate", "advanced"
    mode: Optional[str] = "chat"  # "chat", "study", "quiz"
    conversation_id: Optional[str] = None

class ChatResponse(BaseModel):
    conversation_id: str
    answer: str
    sources: List[SourceItem]

class QuizRequest(BaseModel):
    meeting_number: int
    question_count: Optional[int] = 5

class QuizResponse(BaseModel):
    meeting_number: int
    topic: str
    quiz_content: str
    sources: List[SourceItem]
