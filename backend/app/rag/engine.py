import os
import uuid
from pathlib import Path
from typing import List, Dict, Any, Optional

from qdrant_client import QdrantClient
from qdrant_client.http import models as qmodels

from llama_index.core import VectorStoreIndex, StorageContext, Document, Settings
from llama_index.core.node_parser import SentenceSplitter
from llama_index.core.vector_stores import VectorStoreQuery
from llama_index.vector_stores.qdrant import QdrantVectorStore
from llama_index.embeddings.huggingface import HuggingFaceEmbedding
from llama_index.llms.ollama import Ollama
from llama_index.readers.file import PDFReader

from app.core.config import settings

COLLECTION_NAME = "bigdata_materials"

class RAGEngine:
    def __init__(self):
        self._init_models()
        self._init_vector_store()

    def _init_models(self):
        # Inisialisasi Embedding model BAAI/bge-m3 atau fallback ringan jika download lama
        try:
            print(f"Loading embedding model: {settings.EMBEDDING_MODEL_NAME}...")
            self.embed_model = HuggingFaceEmbedding(model_name=settings.EMBEDDING_MODEL_NAME)
        except Exception as e:
            print(f"Warning loading bge-m3: {e}. Falling back to BAAI/bge-small-en-v1.5")
            self.embed_model = HuggingFaceEmbedding(model_name="BAAI/bge-small-en-v1.5")
        
        Settings.embed_model = self.embed_model
        
        # Inisialisasi LLM (Google GenAI Gemini / Ollama)
        gemini_key = settings.GEMINI_API_KEY.strip() if settings.GEMINI_API_KEY else ""
        if gemini_key:
            try:
                # pyrefly: ignore [missing-import]
                from llama_index.llms.google_genai import GoogleGenAI
                print("Using Gemini API Cloud (gemini-3.6-flash) for LLM.")
                self.llm = GoogleGenAI(model="gemini-3.6-flash", api_key=gemini_key)
            except Exception as e:
                print(f"Failed to load Gemini LLM ({e}), fallback to Ollama.")
                self.llm = Ollama(model=settings.OLLAMA_MODEL, base_url=settings.OLLAMA_BASE_URL, request_timeout=120.0)
        else:
            print(f"Using Ollama Local ({settings.OLLAMA_MODEL}) at {settings.OLLAMA_BASE_URL}")
            self.llm = Ollama(model=settings.OLLAMA_MODEL, base_url=settings.OLLAMA_BASE_URL, request_timeout=120.0)
            
        Settings.llm = self.llm

    def _init_vector_store(self):
        # Qdrant client local persistence
        self.qdrant_client = QdrantClient(path=str(settings.QDRANT_PATH))
        self.vector_store = QdrantVectorStore(
            client=self.qdrant_client,
            collection_name=COLLECTION_NAME
        )
        self.storage_context = StorageContext.from_defaults(vector_store=self.vector_store)
        self.index = VectorStoreIndex.from_vector_store(
            vector_store=self.vector_store,
            embed_model=self.embed_model
        )
        self.node_parser = SentenceSplitter(chunk_size=settings.CHUNK_SIZE, chunk_overlap=settings.CHUNK_OVERLAP)

    def ingest_pdf(self, file_path: Path, doc_id: str, filename: str, meeting_number: int, topic: str) -> int:
        """Parses PDF, chunks it, attaches metadata per meeting, and indexes into Qdrant."""
        reader = PDFReader()
        docs = reader.load_data(file_path)
        
        nodes_to_insert = []
        for doc_idx, doc in enumerate(docs):
            page_label = doc.metadata.get("page_label", str(doc_idx + 1))
            
            # Split doc into chunks
            chunks = self.node_parser.get_nodes_from_documents([doc])
            for chunk_idx, chunk in enumerate(chunks):
                chunk.metadata = {
                    "doc_id": doc_id,
                    "filename": filename,
                    "meeting_number": meeting_number,
                    "topic": topic,
                    "page_label": page_label,
                    "chunk_id": f"{doc_id}_p{page_label}_c{chunk_idx}"
                }
                nodes_to_insert.append(chunk)
                
        if nodes_to_insert:
            self.index.insert_nodes(nodes_to_insert)
            print(f"Indexed {len(nodes_to_insert)} chunks for {filename} (Pertemuan {meeting_number})")
            
        return len(nodes_to_insert)

    def delete_document_chunks(self, doc_id: str):
        """Deletes vector points for doc_id from Qdrant collection."""
        try:
            self.qdrant_client.delete(
                collection_name=COLLECTION_NAME,
                points_selector=qmodels.FilterSelector(
                    filter=qmodels.Filter(
                        must=[
                            qmodels.FieldCondition(
                                key="doc_id",
                                match=qmodels.MatchValue(value=doc_id)
                            )
                        ]
                    )
                )
            )
        except Exception as e:
            print(f"Error deleting chunks for doc_id {doc_id}: {e}")

    def query(
        self,
        query_text: str,
        meeting_filters: Optional[List[int]] = None,
        explanation_level: str = "normal",
        mode: str = "chat"
    ) -> Dict[str, Any]:
        """
        Executes grounded search over indexed material with optional meeting filters.
        Supports modes: 'chat', 'quiz', 'study'.
        Explanation levels: 'normal', 'beginner', 'intermediate', 'advanced'.
        """
        # Build Qdrant metadata filters
        filters = None
        if meeting_filters and len(meeting_filters) > 0:
            if len(meeting_filters) == 1:
                filters = qmodels.Filter(
                    must=[
                        qmodels.FieldCondition(
                            key="meeting_number",
                            match=qmodels.MatchValue(value=int(meeting_filters[0]))
                        )
                    ]
                )
            else:
                filters = qmodels.Filter(
                    should=[
                        qmodels.FieldCondition(
                            key="meeting_number",
                            match=qmodels.MatchValue(value=int(m))
                        ) for m in meeting_filters
                    ]
                )

        # Vector search retriever
        retriever = self.index.as_retriever(
            similarity_top_k=5,
            vector_store_query_mode="default",
            qdrant_filters=filters
        )

        nodes = retriever.retrieve(query_text)
        
        if not nodes:
            return {
                "answer": "Maaf, tidak ditemukan materi perkuliahan yang sesuai dengan filter/pertanyaan tersebut dalam database.",
                "sources": []
            }

        # Format retrieved context
        context_str = ""
        sources = []
        seen_sources = set()

        for idx, node in enumerate(nodes):
            meta = node.metadata
            m_num = meta.get("meeting_number", "?")
            fname = meta.get("filename", "Unknown Document")
            page = meta.get("page_label", "?")
            topic = meta.get("topic", "")
            snippet = node.node.get_content()

            context_str += f"\n--- [Konteks {idx+1}: Pertemuan {m_num} ({topic}), File: {fname}, Halaman {page}] ---\n{snippet}\n"

            source_key = f"{fname}_p{page}"
            if source_key not in seen_sources:
                seen_sources.add(source_key)
                sources.append({
                    "filename": fname,
                    "meeting_number": m_num,
                    "topic": topic,
                    "page_label": page,
                    "snippet": snippet[:200] + "..."
                })

        # Build prompt based on mode & explanation level
        system_instructions = (
            "Anda adalah AI Teaching Assistant untuk mata kuliah Big Data.\n"
            "Tugas utama Anda adalah menjawab pertanyaan mahasiswa **HANYA DAN SELALU BERDASARKAN KONTEKS MATERI PERKULIAHAN YANG DISEDIAKAN**.\n"
            "Aturan Penting:\n"
            "1. Jika jawaban TIDAK ADA atau TIDAK DAPAT DISIMPULKAN dari konteks yang diberikan, katakan dengan tegas: "
            "'Informasi tersebut tidak ditemukan dalam materi perkuliahan yang tersedia.' Jangan mengarang fakta.\n"
            "2. Gunakan Bahasa Indonesia yang ramah, jelas, dan akademik.\n"
            "3. Sebutkan secara spesifik nomor Pertemuan dan Halaman dokumen materi yang digunakan sebagai rujukan di akhir jawaban Anda.\n"
        )

        if explanation_level == "beginner":
            system_instructions += "\nSajikan penjelasan dengan bahasa yang sangat sederhana (Explain Like I'm Beginner), gunakan analogi intuitif sehari-hari."
        elif explanation_level == "advanced":
            system_instructions += "\nSajikan penjelasan secara teknis dan mendalam (Advanced), sertakan arsitektur, mekanisme internal, dan terminologi ilmiah."

        if mode == "study":
            prompt = (
                f"{system_instructions}\n\n"
                f"MODE TUTOR SOKRATIK:\n"
                f"Mahasiswa sedang belajar topik ini. Jangan langsung berikan jawaban panjang.\n"
                f"Berikan rangkuman ringkas (2 kalimat), lalu berikan 1 pertanyaan pemantik interaktif (dengan 4 opsi pilihan A, B, C, D) untuk menguji pemahaman mahasiswa.\n\n"
                f"KONTEKS MATERI:\n{context_str}\n\n"
                f"PERTANYAAN MAHASISWA: {query_text}\n\nJAWABAN TUTOR:"
            )
        elif mode == "quiz":
            prompt = (
                f"Anda adalah Pembuat Soal Ujian Big Data.\n"
                f"Buatkan 5 soal latihan pilihan ganda (A, B, C, D) beserta Kunci Jawaban dan Penjelasannya berdasarkan KONTEKS MATERI berikut saja.\n\n"
                f"KONTEKS MATERI:\n{context_str}\n\n"
                f"PERMINTAAN SOAL: {query_text}\n\nFORMAT OUTPUT JSON/TEKS BERSIH:"
            )
        else:
            prompt = (
                f"{system_instructions}\n\n"
                f"KONTEKS MATERI PERKULIAHAN:\n{context_str}\n\n"
                f"PERTANYAAN MAHASISWA: {query_text}\n\nJAWABAN AI TEACHING ASSISTANT:"
            )

        try:
            llm_response = self.llm.complete(prompt)
            answer_text = str(llm_response)
        except Exception as e:
            print(f"LLM generation error: {e}")
            answer_text = f"Gagal menghasilkan jawaban dari LLM: {str(e)}"

        return {
            "answer": answer_text,
            "sources": sources
        }

rag_engine = None

def get_rag_engine() -> RAGEngine:
    global rag_engine
    if rag_engine is None:
        rag_engine = RAGEngine()
    return rag_engine
