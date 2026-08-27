# 🎓 Big Data AI Teaching Assistant (BDTA)
### RAG-based Course Question Answering & AI Tutor System

**Lecturer Support & Student Learning Platform for Big Data Course**

A modern Full-Stack Retrieval-Augmented Generation (RAG) system engineered for university course materials. Lecturers can upload lecture slide PDFs, modules, and notes organized by meeting numbers (Pertemuan 1–14). Students can ask course-grounded questions with precise document and page number citations, filter answers by specific meetings, generate practice quizzes, and engage in interactive Socratic study tutoring.

---

## 🌟 Key Features

### 👨‍🏫 Lecturer Portal (Portal Dosen)
- **PDF Material Management**: Upload lecture slides, syllabus, and module PDFs.
- **Meeting Metadata Tagging**: Assign materials to specific meeting numbers (Pertemuan 1 to 14) and topics.
- **Automatic Vector Indexing**: Auto-parses, chunks, and indexes PDFs into Qdrant Vector Database.
- **Indexed Document Table**: View indexed chunks and delete outdated materials.

### 🎓 Student Portal (Portal Mahasiswa)
- **Grounded Q&A Chat**: Answers strictly 100% grounded in provided lecture materials (no hallucinations).
- **Meeting Filtering**: Filter answers by specific meeting(s) (e.g., *"Answer based on Meeting 4 only"*).
- **Direct Source Citations**: Shows clickable source badges referencing exact Document Name, Meeting Number, Page Number, and snippet context.
- **Explanation Levels**: Toggle between **Normal**, **Beginner (ELI5)**, and **Advanced** explanations.
- **Interactive Quiz Generator**: Automatically generates 5 multiple-choice questions grounded in selected meeting material with detailed answer keys.
- **Socratic Study Mode**: Acts as an interactive AI tutor providing step-by-step guidance and conceptual questions.

---

## 🏗️ Architecture & Technology Stack

```text
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Mahasiswa & Dosen)            │
│                 React + Vite + TypeScript + Tailwind        │
└──────────────────────────────┬──────────────────────────────┘
                               │ REST API Proxy
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                       Backend Service                       │
│                        Python + FastAPI                     │
├──────────────────────────────┬──────────────────────────────┤
│  LlamaIndex RAG Orchestrator │ Metadata Storage (JSON / DB) │
│  - Semantic Sentence Splitter│ - Meetings (1..14)           │
│  - Filtered Retriever        │ - Documents & Conversations  │
│  - Prompt Router & Templates │ - Quiz History               │
└──────────────┬───────────────┴──────────────────────────────┘
               │
       ┌───────┴────────────────────────┐
       ▼                                ▼
┌──────────────┐                 ┌──────────────┐
│  Vector DB   │                 │  LLM Engine  │
│    Qdrant    │                 │ Ollama (Qwen)│
│  (bge-m3)    │                 │ (Gemini/Cloud)│
└──────────────┘                 └──────────────┘
```

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Lucide Icons, React Markdown.
- **Backend**: Python 3.11, FastAPI, Pydantic v2, Uvicorn.
- **RAG & Indexing**: LlamaIndex Core, PyPDF Reader, `BAAI/bge-m3` Embeddings.
- **Vector Database**: Qdrant (Local Disk Storage).
- **LLM Engine**: Ollama (`llama3.2:latest` / `qwen2.5`) with fallback support for Gemini API Key.

---

## 🚀 Quick Start Guide

### Prerequisites
- **Python 3.10+**
- **Node.js v18+**
- **Ollama** (Running locally with `ollama pull llama3.2`)

---

### 1. Run Backend Service

```bash
cd backend

# Activate Virtual Environment (Windows)
.\venv\Scripts\activate

# Install Dependencies (if needed)
pip install -r requirements.txt

# Run Seed Script (Populate initial 12 PDFs from modul-elearning)
python scripts/seed_materials.py

# Start FastAPI Server
uvicorn app.main:app --reload --port 8000
```

The backend server will run at `http://localhost:8000`. Interactive API Docs are available at `http://localhost:8000/docs`.

---

### 2. Run Frontend Web Application

Open a new terminal:

```bash
cd frontend

# Install Dependencies
npm install

# Start Vite Development Server
npm run dev
```

Open your browser at `http://localhost:3000`.

---

## 📂 Repository Layout

```text
lecturer-chatbot/
├── backend/
│   ├── app/
│   │   ├── api/v1/endpoints/   # Upload, Chat, Quiz endpoints
│   │   ├── core/               # Configuration settings
│   │   ├── db/                 # Metadata persistence
│   │   ├── rag/                # LlamaIndex & Qdrant RAG engine
│   │   └── schemas/            # Pydantic data schemas
│   ├── data/                   # Qdrant DB & Raw Uploads
│   ├── scripts/                # Seeding scripts
│   ├── main.py                 # FastAPI application entry point
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/         # Header, StudentView, LecturerDashboard
│   │   ├── services/           # Fetch API service layer
│   │   └── types/              # TypeScript definitions
│   ├── package.json
│   └── vite.config.ts
├── .gitignore
└── README.md
```
