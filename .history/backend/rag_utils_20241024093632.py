import uuid
from pathlib import Path
from typing import Dict, Optional

from config import Config
from langchain_community.vectorstores import Chroma
from mylibspublic.FormosaEmbedding2 import CustomEmbeddingModel
from mylibspublic.FormosaFoundationModel2 import FormosaFoundationModel


def initialize_vector_store(persist_directory: str) -> Chroma:
    """初始化向量存儲"""
    embedding_model = CustomEmbeddingModel(
        base_url=Config.API_URL, api_key=Config.API_KEY, model="ffm-embedding"
    )

    vector_store = Chroma(
        collection_name="translated_content_collection",
        embedding_function=embedding_model,
        persist_directory=persist_directory,
    )

    return vector_store


def initialize_rag():
    """初始化 RAG 系統"""
    default_vector_store = initialize_vector_store(
        str(Path(Config.CHROMA_PATH) / "default")
    )

    ffm = FormosaFoundationModel(
        base_url=Config.API_URL, ffm_api_key=Config.API_KEY, model=Config.MODEL_NAME
    )

    return default_vector_store, ffm


def add_translated_content_to_vector_store(
    vector_store: Chroma, translated_content: str, metadata: Dict = None
) -> str:
    """添加翻譯內容到向量存儲"""
    try:
        doc_id = (
            str(uuid.uuid4())
            if metadata is None or "doc_id" not in metadata
            else metadata["doc_id"]
        )

        vector_store.add_texts(
            texts=[translated_content], metadatas=[metadata], ids=[doc_id]
        )

        vector_store.persist()

        print(f"已添加文檔，ID: {doc_id}")
        return doc_id

    except Exception as e:
        print(f"添加文檔時出錯: {str(e)}")
        raise e


def delete_from_vector_store(vector_store: Chroma, metadata_filter: Dict) -> bool:
    """從向量存儲中刪除內容"""
    try:
        # 先獲取匹配的文檔
        matching_docs = vector_store.get(where=metadata_filter)
        
        if matching_docs and matching_docs["ids"]:
            # 刪除文檔
            vector_store.delete(ids=matching_docs["ids"])
            vector_store.persist()
            print(f"已刪除文檔，IDs: {matching_docs['ids']}")
            return True
        else:
            print("未找到匹配的文檔")
            return False

    except Exception as e:
        print(f"刪除文檔時出錯: {str(e)}")
        # 嘗試關閉和重新初始化 vector store
        try:
            vector_store._client.close()
        except:
            pass
        raise e



def reset_vector_store(vector_store: Chroma) -> bool:
    """重置向量存儲"""
    try:
        all_docs = vector_store.get()
        if all_docs and all_docs["ids"]:
            vector_store.delete(ids=all_docs["ids"])
            vector_store.persist()
            print("已清空向量數據庫")
        return True
    except Exception as e:
        print(f"重置數據庫時出錯: {str(e)}")
        raise e
def add_content_to_vector_store(
    vector_store: Chroma, content: str, metadata: Dict = None
) -> str:
    """直接添加內容到向量存儲，不進行翻譯"""
    try:
        doc_id = (
            str(uuid.uuid4())
            if metadata is None or "doc_id" not in metadata
            else metadata["doc_id"]
        )

        vector_store.add_texts(
            texts=[content], metadatas=[metadata], ids=[doc_id]
        )

        vector_store.persist()

        print(f"已添加文檔，ID: {doc_id}")
        return doc_id

    except Exception as e:
        print(f"添加文檔時出錯: {str(e)}")
        raise e

def query_knowledge_base(
    vector_store: Chroma,
    ffm: FormosaFoundationModel,
    query: str,
    model_settings: Optional[Dict] = None,
) -> str:
    """查詢知識庫"""
    # 獲取參數
    if model_settings:
        top_k = model_settings.get("parameters", {}).get("topK", 3)
        similarity_threshold = model_settings.get("parameters", {}).get(
            "similarityThreshold", 0.7
        )
    else:
        top_k = 3
        similarity_threshold = 0.7

    # 將 stream 參數設置為 true
    stream = True

    # 使用向量存儲來檢索相關文檔
    docs = vector_store.similarity_search_with_score(query, k=top_k)

    # 根據相似度過濾文檔
    relevant_docs = [doc for doc, score in docs if score >= similarity_threshold]

    # 將檢索到的文檔轉換為上下文
    context = "\n".join([doc.page_content for doc in relevant_docs])

    # 生成提示
    prompt = f"""根據以下參考資料回答問題。請使用流暢、結構化的方式回答。

參考資料:
{context}

問題:
{query}

回答:"""

    # 使用 FFM 生成回答
    if model_settings:
        model_name = model_settings.get("model_name")
        parameters = model_settings.get("parameters", {})

        # 更新模型設定
        if model_name:
            ffm.model = model_name

        # 將 stream 參數設置為 true，並轉換為 JSON 格式
        response = ffm(prompt, **parameters, stream=stream)
    else:
        response = ffm(prompt)

    return response


if __name__ == "__main__":
    import uuid
    from pathlib import Path

    print("開始測試 RAG 系統...")

    # 初始化 RAG
    vector_store, ffm = initialize_rag()
    print("RAG 系統初始化完成")

    # 測試代碼...
