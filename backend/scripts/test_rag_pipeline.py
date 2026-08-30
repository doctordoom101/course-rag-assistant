import sys
import os
from pathlib import Path

# Force UTF-8 output encoding for Windows console
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

# Add backend directory to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.core.config import settings
from app.rag.engine import get_rag_engine

def run_test():
    print("=" * 60)
    print("STARTING RAG AI ASSISTANT PIPELINE TEST")
    print("=" * 60)
    print(f"Embedding Model : {settings.EMBEDDING_MODEL_NAME}")
    print(f"Qdrant Path     : {settings.QDRANT_PATH}")
    print(f"LLM Provider    : {'Gemini API' if settings.GEMINI_API_KEY else 'Ollama Local (' + settings.OLLAMA_MODEL + ')'}")
    print("=" * 60)

    rag = get_rag_engine()

    # Test 1: Grounded Q&A Chat (Meeting 4 - Storage & HDFS)
    query_1 = "Apa perbedaan utama antara HDFS dan penyimpanan data tradisional?"
    print(f"\n[TEST 1] Query: '{query_1}' (Filtered to Meeting 4)...")
    res_1 = rag.query(query_text=query_1, meeting_filters=[4], mode="chat")
    
    print("\n--- AI Answer ---")
    print(res_1["answer"])
    print("\n--- Retrieved Sources ---")
    for s in res_1["sources"]:
        print(f"Document: [{s['filename']}] Pertemuan {s['meeting_number']} (Hal {s['page_label']})")
        print(f"   Snippet: {s['snippet'][:100]}...\n")

    # Test 2: Grounded Q&A Chat (Meeting 6 & 7 - MapReduce vs Spark)
    query_2 = "Jelaskan konsep MapReduce dan perbedaannya dengan Apache Spark."
    print(f"\n[TEST 2] Query: '{query_2}' (Filtered to Meetings 6 & 7)...")
    res_2 = rag.query(query_text=query_2, meeting_filters=[6, 7], mode="chat")

    print("\n--- AI Answer ---")
    print(res_2["answer"])
    print("\n--- Retrieved Sources ---")
    for s in res_2["sources"]:
        print(f"Document: [{s['filename']}] Pertemuan {s['meeting_number']} (Hal {s['page_label']})")
        print(f"   Snippet: {s['snippet'][:100]}...\n")

    # Test 3: Un-grounded / Off-topic query (Negative Test)
    query_3 = "Siapa pemenang piala dunia 2022?"
    print(f"\n[TEST 3] Negative Test Query: '{query_3}' (Expect strict rejection)...")
    res_3 = rag.query(query_text=query_3, mode="chat")
    print("\n--- AI Answer ---")
    print(res_3["answer"])

    print("\n" + "=" * 60)
    print("SUCCESS: RAG PIPELINE TEST COMPLETED!")
    print("=" * 60)

if __name__ == "__main__":
    run_test()
