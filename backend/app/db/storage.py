import json
import uuid
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Any, Optional
from app.core.config import settings

class MetadataStore:
    def __init__(self, file_path: Path = settings.METADATA_FILE):
        self.file_path = file_path
        self._ensure_file_exists()

    def _ensure_file_exists(self):
        if not self.file_path.exists():
            default_data = {
                "documents": [],
                "meetings": [
                    {"number": 1, "topic": "Pengantar Big Data", "description": "Konsep dasar, karakteristik 5V, dan gambaran umum Big Data."},
                    {"number": 2, "topic": "Analisis Big Data Bagian I", "description": "Dasar-dasar analitik dan pengolahan dataset skala besar."},
                    {"number": 3, "topic": "Adopsi Big Data", "description": "Strategi adopsi, arsitektur, dan tantangan implementasi di industri."},
                    {"number": 4, "topic": "Penyimpanan dalam Big Data", "description": "HDFS, NoSQL, Distributed Storage, dan data replication."},
                    {"number": 5, "topic": "Exploratory Data Analysis (EDA)", "description": "Teknik eksplorasi data, pembersihan, dan visualisasi dasar."},
                    {"number": 6, "topic": "Processing Concept di Big Data", "description": "MapReduce, Batch Processing, Stream Processing, dan Execution Models."},
                    {"number": 7, "topic": "Big Data Technologies", "description": "Ekosistem Hadoop, Apache Spark, Kafka, Hive, dan Pig."},
                    {"number": 8, "topic": "Statistik untuk Analitik Data", "description": "Metode statistik deskriptif, inferensial, dan probabilitas."},
                    {"number": 10, "topic": "Teknik Analitik Data", "description": "Metodologi Data Mining, Classification, Clustering, dan Regression."},
                    {"number": 11, "topic": "Analitik Deskriptif", "description": "Pelaporan bisnis, dashboarding, KPI aggregation, dan OLAP."},
                    {"number": 12, "topic": "Analitik Prediktif & Preskriptif", "description": "Modelling, forecasting, optimization, dan decision analytics."},
                    {"number": 13, "topic": "Studi Kasus Analitik Data dengan Python", "description": "Implementasi hands-on menggunakan Pandas, PySpark, dan Machine Learning."}
                ],
                "conversations": []
            }
            self.file_path.parent.mkdir(parents=True, exist_ok=True)
            with open(self.file_path, "w", encoding="utf-8") as f:
                json.dump(default_data, f, indent=2, ensure_ascii=False)

    def _read_data(self) -> Dict[str, Any]:
        with open(self.file_path, "r", encoding="utf-8") as f:
            return json.load(f)

    def _write_data(self, data: Dict[str, Any]):
        with open(self.file_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)

    # Document operations
    def add_document(self, doc_data: Dict[str, Any]) -> Dict[str, Any]:
        data = self._read_data()
        doc_data["id"] = doc_data.get("id", str(uuid.uuid4()))
        doc_data["uploaded_at"] = doc_data.get("uploaded_at", datetime.now().isoformat())
        data["documents"].append(doc_data)
        self._write_data(data)
        return doc_data

    def get_documents(self) -> List[Dict[str, Any]]:
        return self._read_data().get("documents", [])

    def delete_document(self, doc_id: str) -> Optional[Dict[str, Any]]:
        data = self._read_data()
        docs = data.get("documents", [])
        deleted_doc = None
        new_docs = []
        for d in docs:
            if d["id"] == doc_id:
                deleted_doc = d
            else:
                new_docs.append(d)
        data["documents"] = new_docs
        self._write_data(data)
        return deleted_doc

    # Meeting operations
    def get_meetings(self) -> List[Dict[str, Any]]:
        return self._read_data().get("meetings", [])

    def upsert_meeting(self, meeting_number: int, topic: str, description: str = "") -> Dict[str, Any]:
        data = self._read_data()
        meetings = data.get("meetings", [])
        updated = False
        for m in meetings:
            if m["number"] == meeting_number:
                m["topic"] = topic
                if description:
                    m["description"] = description
                updated = True
                break
        if not updated:
            meetings.append({"number": meeting_number, "topic": topic, "description": description})
            meetings.sort(key=lambda x: x["number"])
        data["meetings"] = meetings
        self._write_data(data)
        return {"number": meeting_number, "topic": topic, "description": description}

    # Conversation operations
    def save_conversation(self, conv_id: str, title: str, messages: List[Dict[str, Any]]) -> Dict[str, Any]:
        data = self._read_data()
        convs = data.get("conversations", [])
        existing = next((c for c in convs if c["id"] == conv_id), None)
        if existing:
            existing["title"] = title
            existing["messages"] = messages
            existing["updated_at"] = datetime.now().isoformat()
        else:
            convs.append({
                "id": conv_id,
                "title": title,
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat(),
                "messages": messages
            })
        data["conversations"] = convs
        self._write_data(data)
        return {"id": conv_id, "title": title, "messages": messages}

    def get_conversations(self) -> List[Dict[str, Any]]:
        return self._read_data().get("conversations", [])

    def get_conversation(self, conv_id: str) -> Optional[Dict[str, Any]]:
        convs = self.get_conversations()
        return next((c for c in convs if c["id"] == conv_id), None)

store = MetadataStore()
