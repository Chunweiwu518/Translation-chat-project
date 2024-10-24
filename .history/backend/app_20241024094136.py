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


@app.delete("/api/knowledge_base/{kb_id}")
async def delete_knowledge_base(kb_id: str):
    try:
        if kb_id == "default":
            raise HTTPException(status_code=400, detail="無法刪除預設知識庫")

        knowledge_bases = load_knowledge_bases()
        if kb_id not in knowledge_bases:
            raise HTTPException(status_code=404, detail="知識庫不存在")

        kb_path = Path(knowledge_bases[kb_id]["path"])

        # 1. 首先關閉當前的向量存儲連接
        global vector_store
        if kb_id == Config.current_kb_id:
            try:
                vector_store._client.close()
                vector_store = None
            except:
                pass
            # 重新初始化默認知識庫
            vector_store = initialize_vector_store(
                str(Path(Config.CHROMA_PATH) / "default")
            )
            Config.current_kb_id = "default"

        # 2. 嘗試安全刪除目錄
        try:
            safely_delete_directory(kb_path)
        except Exception as e:
            print(f"刪除知識庫目錄失敗: {str(e)}")
            # 如果刪除失敗，我們至少更新配置
            pass

        # 3. 更新配置文件
        del knowledge_bases[kb_id]
        save_knowledge_bases(knowledge_bases)

        # 4. 清理可能的臨時文件
        import gc

        gc.collect()  # 強制垃圾回收

        return {"success": True}
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"刪除知識庫時出錯: {str(e)}")


@app.post("/api/knowledge_base/switch/{kb_id}")
async def switch_knowledge_base(kb_id: str):
    try:
        knowledge_bases = load_knowledge_bases()
        if kb_id not in knowledge_bases:
            raise HTTPException(status_code=404, detail="知識庫不存在")

        global vector_store
        # 先嘗試關閉現有連接
        try:
            if vector_store is not None:
                vector_store._client.close()
        except:
            pass

        vector_store = initialize_vector_store(knowledge_bases[kb_id]["path"])
        Config.current_kb_id = kb_id

        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/knowledge_base/reset/{kb_id}")
async def reset_knowledge_base(kb_id: str):
    try:
        knowledge_bases = load_knowledge_bases()
        if kb_id not in knowledge_bases:
            raise HTTPException(status_code=404, detail="知識庫不存在")

        if kb_id == Config.current_kb_id:
            reset_vector_store(vector_store)
        else:
            temp_store = initialize_vector_store(knowledge_bases[kb_id]["path"])
            reset_vector_store(temp_store)
            # 清理臨時存儲
            try:
                temp_store._client.close()
            except:
                pass

        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/translate")
async def translate(request: TranslateRequest):
    try:
        translated_text = one_chunk_translate_text(
            request.text,
            Config.MODEL_NAME,
            Config.SOURCE_LANG,
            Config.TARGET_LANG,
            Config.COUNTRY,
        )
        return {"translated_text": translated_text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    """直接上傳檔案，不進行翻譯"""
    if not file or not file.filename:
        raise HTTPException(status_code=400, detail="沒有提供文件")

    if not allowed_file(file.filename):
        raise HTTPException(status_code=400, detail="不允許的文件類型")

    try:
        filename = file.filename
        file_path = os.path.join(Config.UPLOAD_FOLDER, filename)

        # 保存上傳的文件
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # 讀取文件內容
        content = read_file_content(file_path)

        # 清理臨時文件
        os.remove(file_path)

        return {"content": content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"處理文件時出錯: {str(e)}")


@app.post("/api/upload_and_translate")
async def upload_and_translate(file: UploadFile = File(...)):
    """上傳並翻譯檔案"""
    if not file or not file.filename:
        raise HTTPException(status_code=400, detail="沒有提供文件")

    if not allowed_file(file.filename):
        raise HTTPException(status_code=400, detail="不允許的文件類型")

    try:
        filename = file.filename
        file_path = os.path.join(Config.UPLOAD_FOLDER, filename)

        # 保存上傳的文件
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        async def progress_callback(progress: int):
            await broadcast_progress(progress)

        translated_path = translate_and_store_to_knowledge_base(
            file_path,
            Config.MODEL_NAME,
            Config.SOURCE_LANG,
            Config.TARGET_LANG,
            Config.COUNTRY,
            progress_callback,
        )

        with open(translated_path, "r", encoding="utf-8") as f:
            translated_content = f.read()

        # 清理臨時文件
        os.remove(file_path)
        os.remove(translated_path)

        return {"translated_content": translated_content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"翻譯文件時出錯: {str(e)}")


@app.post("/api/embed")
async def embed_content(request: EmbedRequest):
    try:
        if not request.content:
            raise HTTPException(status_code=400, detail="沒有提供內容")

        kb_id = request.knowledge_base_id or Config.current_kb_id
        knowledge_bases = load_knowledge_bases()

        if kb_id not in knowledge_bases:
            raise HTTPException(status_code=404, detail="知識庫不存在")

        global vector_store
        if kb_id != Config.current_kb_id:
            temp_store = initialize_vector_store(knowledge_bases[kb_id]["path"])
            doc_id = add_translated_content_to_vector_store(
                temp_store,
                request.content,
                {
                    "source": request.filename,
                    "knowledge_base_id": kb_id,
                    "doc_id": str(uuid.uuid4()),
                },
            )
            # 清理臨時存儲
            try:
                temp_store._client.close()
            except:
                pass
        else:
            doc_id = add_translated_content_to_vector_store(
                vector_store,
                request.content,
                {
                    "source": request.filename,
                    "knowledge_base_id": kb_id,
                    "doc_id": str(uuid.uuid4()),
                },
            )

        return {"success": True, "doc_id": doc_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/knowledge_base/{kb_id}/file/{file_id}")
async def delete_file_from_knowledge_base(kb_id: str, file_id: str):
    try:
        knowledge_bases = load_knowledge_bases()
        if kb_id not in knowledge_bases:
            raise HTTPException(status_code=404, detail="知識庫不存在")

        global vector_store
        if kb_id != Config.current_kb_id:
            temp_store = initialize_vector_store(knowledge_bases[kb_id]["path"])
            success = delete_from_vector_store(temp_store, {"doc_id": file_id})
            # 清理臨時存儲
            try:
                temp_store._client.close()
            except:
                pass
        else:
            success = delete_from_vector_store(vector_store, {"doc_id": file_id})

        if success:
            return {"success": True}
        else:
            raise HTTPException(status_code=404, detail="文件不存在")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
