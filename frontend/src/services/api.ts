import { Meeting, DocumentItem, ChatMessage, SourceItem } from '../types';

const API_BASE = '/api/v1';

export async function fetchMeetings(): Promise<Meeting[]> {
  const res = await fetch(`${API_BASE}/documents/meetings`);
  if (!res.ok) throw new Error('Gagal mengambil daftar pertemuan');
  return res.json();
}

export async function fetchDocuments(): Promise<DocumentItem[]> {
  const res = await fetch(`${API_BASE}/documents`);
  if (!res.ok) throw new Error('Gagal mengambil daftar dokumen');
  return res.json();
}

export async function uploadDocument(
  file: File,
  meetingNumber: number,
  topic: string
): Promise<DocumentItem> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('meeting_number', meetingNumber.toString());
  formData.append('topic', topic);

  const res = await fetch(`${API_BASE}/documents/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Gagal mengunggah file PDF');
  }

  return res.json();
}

export async function deleteDocument(docId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/documents/${docId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Gagal menghapus dokumen');
}

export async function sendChatMessage(payload: {
  message: string;
  meeting_filters: number[];
  explanation_level: string;
  mode: 'chat' | 'study' | 'quiz';
  conversation_id?: string;
}): Promise<{ conversation_id: string; answer: string; sources: SourceItem[] }> {
  const res = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Terjadi kesalahan saat mengirim pesan');
  }

  return res.json();
}

export async function generateQuiz(meetingNumber: number, questionCount: number = 5): Promise<{
  meeting_number: number;
  topic: string;
  quiz_content: string;
  sources: SourceItem[];
}> {
  const res = await fetch(`${API_BASE}/quiz/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ meeting_number: meetingNumber, question_count: questionCount }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Gagal membuat kuis');
  }

  return res.json();
}
