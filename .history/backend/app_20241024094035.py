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


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    active_connections.append(websocket)
    try:
        while True:
            await websocket.receive_text()
    except:
        active_connections.remove(websocket)


async def broadcast_progress(progress: int):
    for connection in active_connections:
        await connection.send_json({"progress": progress})


def load_knowledge_bases():
    kb_file = Path(Config.CHROMA_PATH) / "knowledge_bases.json"
    if kb_file.exists():
        with open(kb_file, "r", encoding="utf-8") as f:
            return json.load(f)
    return {
        "default": {
            "name": "預設知識庫",
            "description": "預設的知識庫",
            "path": str(Path(Config.CHROMA_PATH) / "default"),
        }
    }


def save_knowledge_bases(knowledge_bases: dict):
    kb_file = Path(Config.CHROMA_PATH) / "knowledge_bases.json"
    with open(kb_file, "w", encoding="utf-8") as f:
        json.dump(knowledge_bases, f, ensure_ascii=False, indent=2)


def read_file_content(file_path: str) -> str:
    """讀取不同類型文件的內容"""
    file_extension = file_path.lower().split(".")[-1]

    if file_extension == "pdf":
        with pdfplumber.open(file_path) as pdf:
            return "\n".join(page.extract_text() for page in pdf.pages)
    elif file_extension == "txt":
        with open(file_path, "r", encoding="utf-8") as f:
            return f.read()
    elif file_extension == "docx":
        doc = Document(file_path)
        return "\n".join(paragraph.text for paragraph in doc.paragraphs)
    else:
        raise ValueError(f"Unsupported file type: {file_extension}")


def allowed_file(filename: str) -> bool:
    return (
        "." in filename
        and filename.rsplit(".", 1)[1].lower() in Config.ALLOWED_EXTENSIONS
    )


# 知識庫相關的API路由
@app.get("/api/knowledge_bases")
async def get_knowledge_bases():
    knowledge_bases = load_knowledge_bases()
    return [
        {"id": k, "name": v["name"], "description": v["description"]}
        for k, v in knowledge_bases.items()
    ]


@app.post("/api/knowledge_base")
async def create_knowledge_base(kb: KnowledgeBase):
    try:
        kb_id = str(uuid.uuid4())
        kb_path = Path(Config.CHROMA_PATH) / kb_id
        kb_path.mkdir(parents=True, exist_ok=True)

        knowledge_bases = load_knowledge_bases()
        knowledge_bases[kb_id] = {
            "name": kb.name,
            "description": kb.description,
            "path": str(kb_path),
        }
        save_knowledge_bases(knowledge_bases)

        # 初始化新知識庫的向量存儲
        initialize_vector_store(str(kb_path))

        return {"id": kb_id, "name": kb.name, "description": kb.description}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
