import os

from dotenv import load_dotenv

load_dotenv()


class Config:
    UPLOAD_FOLDER = "uploads"
    CHROMA_PATH = "chroma_db"
    MODEL_NAME = "gpt-3.5-turbo"
    SOURCE_LANG = "English"
    TARGET_LANG = "Traditional Chinese"
    COUNTRY = "Taiwan"
    API_KEY = os.getenv("API_KEY")
    API_URL = os.getenv("API_URL")
    API_HOST = os.getenv("API_HOST")
    current_kb_id = "default"
