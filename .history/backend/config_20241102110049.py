import os

from dotenv import load_dotenv

load_dotenv()


class Config:
    UPLOAD_FOLDER = "uploads"
    ALLOWED_EXTENSIONS = {"pdf", "txt", "docx"}
    MODEL_NAME = os.getenv("MODEL_NAME")
    SOURCE_LANG = os.getenv("SOURCE_LANG", "English")
    TARGET_LANG = os.getenv("TARGET_LANG", "Chinese")
    COUNTRY = os.getenv("COUNTRY", "Taiwan")
    API_KEY = os.getenv("API_KEY")
    API_URL = os.getenv("API_URL")
    API_HOST = os.getenv("API_HOST")
    CHROMA_PATH = os.getenv("CHROMA_PATH", "./chroma_db")
    current_kb_id = "default"
