export type UserRole = 'student' | 'lecturer';

export interface Meeting {
  number: number;
  topic: string;
  description?: string;
}

export interface DocumentItem {
  id: string;
  filename: string;
  meeting_number: number;
  topic: string;
  uploaded_at: string;
  chunks_indexed: number;
}

export interface SourceItem {
  filename: string;
  meeting_number: number | string;
  topic?: string;
  page_label: number | string;
  snippet: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  meeting_filters?: number[];
  explanation_level?: string;
  sources?: SourceItem[];
  timestamp: string;
}

export interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  messages: ChatMessage[];
}
