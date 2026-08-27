import os
from pathlib import Path
from pydantic_settings import BaseSettings

BASE_DIR = Path(__file__).resolve().parent.parent.parent
WORKSPACE_DIR = BASE_DIR.parent.parent
ELEARNING_DIR = WORKSPACE_DIR / "modul-elearning"

class Settings(BaseSettings):
    PROJECT_NAME: str = "Big Data AI Teaching Assistant"
    API_V1_STR: str = "/api/v1"
    
    # Paths
    BASE_DIR: Path = BASE_DIR
    UPLOAD_DIR: Path = BASE_DIR / "data" / "uploads"
    QDRANT_PATH: Path = BASE_DIR / "data" / "qdrant_db"
    METADATA_FILE: Path = BASE_DIR / "data" / "metadata.json"
    
    # LLM & Embedding Settings
    LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "ollama")  # "ollama" or "gemini" or "openai"
    OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    OLLAMA_MODEL: str = os.getenv("OLLAMA_MODEL", "llama3.2:latest")
    
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    
    EMBEDDING_MODEL_NAME: str = os.getenv("EMBEDDING_MODEL_NAME", "BAAI/bge-m3")
    CHUNK_SIZE: int = 512
    CHUNK_OVERLAP: int = 64
    
    class Config:
        case_sensitive = True

settings = Settings()

# Ensure directories exist
settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
settings.QDRANT_PATH.mkdir(parents=True, exist_ok=True)
