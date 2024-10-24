import shutil
import time
from pathlib import Path
from typing import Dict, List, Optional

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.websockets import WebSocket
from pydantic import BaseModel
from rag_utils import (
    initialize_rag,
)


# Pydantic models
class KnowledgeBase(BaseModel):
    name: str
    description: str = ""


class TranslateRequest(BaseModel):
    text: str


class EmbedRequest(BaseModel):
    content: str
    filename: str
    knowledge_base_id: Optional[str] = None


class QueryRequest(BaseModel):
    query: str
    knowledge_base_id: Optional[str] = None
    model_settings: Optional[Dict] = None


class ProgressMessage(BaseModel):
    progress: int


def safely_delete_directory(path: Path):
    """安全地刪除目錄，包括等待和重試機制"""
    max_attempts = 3
    for attempt in range(max_attempts):
        try:
            if path.exists():
                # 先嘗試刪除 sqlite 文件
                sqlite_file = path / "chroma.sqlite3"
                if sqlite_file.exists():
                    sqlite_file.unlink()

                # 等待一下
                time.sleep(1)

                # 刪除整個目錄
                shutil.rmtree(path)
            return True
        except Exception as e:
            print(f"刪除嘗試 {attempt + 1} 失敗: {str(e)}")
            if attempt < max_attempts - 1:
                time.sleep(2)  # 在重試之前等待
            else:
                raise


app = FastAPI()

# CORS 設置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 初始化默認知識庫
vector_store, ffm = initialize_rag()

# WebSocket 連接
active_connections: List[WebSocket] = []
