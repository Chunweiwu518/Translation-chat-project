import os
from pathlib import Path
import traceback
from config import Config
from langchain.document_loaders import PyPDFLoader
from langchain.text_splitter import CharacterTextSplitter
import unittest
import pdfplumber
# 這裡應該導入您的自定義模型和翻譯函數
from mylibspublic.ffm_completion import get_ffm_completion
from mylibspublic.FormosaEmbedding2 import CustomEmbeddingModel
from langchain.schema import Document
def one_chunk_initial_translation(
    source_text, model, source_lang, target_lang, country
):
    """執行初次翻譯。"""
    system_message = (
        f"你是一位專業語言學家，專門從事 {source_lang} 到 {target_lang} 的翻譯。"
    )
    translation_prompt = f"""這是一個從 {source_lang} 到 {target_lang} 的翻譯任務，請提供此文本的 {target_lang} 翻譯。
翻譯應符合 {country} 的語言習慣。除了翻譯之外，不要提供任何解釋或其他文字。
{source_lang}: {source_text}
{target_lang}:"""
    translation = get_ffm_completion(
        translation_prompt, system_message=system_message, model=model
    )
    return translation


def one_chunk_reflect_on_translation(
    source_text, translation_1, model, source_lang, target_lang, country
):
    """反思並分析初次翻譯的結果。"""
    system_message = f"你是一位專業語言學家，專門從事 {source_lang} 到 {target_lang} 的翻譯。你將獲得一段源文本及其翻譯，你的目標是改進這個翻譯。"
    prompt = f"""你的任務是仔細閱讀一段從 {source_lang} 到 {target_lang} 的源文本和翻譯，然後給出建設性的批評和有用的建議來改進翻譯。
最終翻譯的風格和語氣應該符合 {country} 口語化的 {target_lang} 風格。

源文本和初次翻譯用 XML 標籤 <SOURCE_TEXT></SOURCE_TEXT> 和 <TRANSLATION></TRANSLATION> 分隔如下：

<SOURCE_TEXT>
{source_text}
</SOURCE_TEXT>

<TRANSLATION>
{translation_1}
</TRANSLATION>

在寫建議時，請注意是否有方法可以改進翻譯的
(i) 準確性（通過糾正添加、誤譯、遺漏或未翻譯的文本錯誤），
(ii) 流暢度（通過應用 {target_lang} 的語法、拼寫和標點規則，確保沒有不必要的重複），
(iii) 風格（通過確保翻譯反映源文本的風格並考慮任何文化背景），
(iv) 術語（通過確保術語使用一致且反映源文本領域；並確保只使用 {target_lang} 中等效的成語）。

寫出一份具體、有幫助和建設性的建議清單，以改進翻譯。每個建議應針對翻譯的一個具體部分。只輸出建議，不要輸出其他內容。"""
    reflection = get_ffm_completion(prompt, system_message=system_message, model=model)
    return reflection


def one_chunk_improve_translation(
    source_text, translation_1, reflection, model, source_lang, target_lang, country
):
    """根據反思結果改進翻譯。"""
    system_message = (
        f"你是一位專業語言學家，專門從事 {source_lang} 到 {target_lang} 的翻譯編輯。"
    )
    prompt = f"""你的任務是仔細閱讀，然後編輯一份從 {source_lang} 到 {target_lang} 的翻譯，同時考慮專家建議和建設性批評的清單。

源文本、初次翻譯和專家語言學家建議用 XML 標籤 <SOURCE_TEXT></SOURCE_TEXT>、<TRANSLATION></TRANSLATION> 和 <EXPERT_SUGGESTIONS></EXPERT_SUGGESTIONS> 分隔如下：

<SOURCE_TEXT>
{source_text}
</SOURCE_TEXT>

<TRANSLATION>
{translation_1}
</TRANSLATION>

<EXPERT_SUGGESTIONS>
{reflection}
</EXPERT_SUGGESTIONS>

請在編輯翻譯時考慮專家建議。通過確保以下幾點來編輯翻譯：
(i) 準確性（通過糾正添加、誤譯、遺漏或未翻譯的文本錯誤），
(ii) 流暢度（通過應用 {target_lang} 的語法、拼寫和標點規則，確保沒有不必要的重複），
(iii) 風格（通過確保翻譯反映源文本的風格並符合 {country} 的語言習慣）
(iv) 術語（上下文不當、使用不一致），或
(v) 其他錯誤。

只輸出新的翻譯，不要輸出其他內容。"""
    translation_2 = get_ffm_completion(prompt, system_message, model=model)
    return translation_2


def one_chunk_translate_text(source_text, model, source_lang, target_lang, country):
    """對單個文本塊執行完整的翻譯過程，包括初次翻譯、反思和改進。"""
    translation_1 = one_chunk_initial_translation(
        source_text, model, source_lang, target_lang, country
    )
    reflection = one_chunk_reflect_on_translation(
        source_text, translation_1, model, source_lang, target_lang, country
    )
    translation_2 = one_chunk_improve_translation(
        source_text, translation_1, reflection, model, source_lang, target_lang, country
    )
    return translation_2

def load_pdf(file_path):
    try:
        # 首先嘗試使用 PyPDFLoader
        loader = PyPDFLoader(file_path)
        pages = loader.load()
    except Exception as e:
        print(f"PyPDFLoader failed: {str(e)}")
        # 如果 PyPDFLoader 失敗，嘗試使用 pdfplumber
        try:
            pages = []
            with pdfplumber.open(file_path) as pdf:
                for page in pdf.pages:
                    text = page.extract_text()
                    if text:
                        pages.append(Document(page_content=text, metadata={"source": file_path}))
        except Exception as e:
            print(f"pdfplumber failed: {str(e)}")
            # 如果兩種方法都失敗，拋出異常
            raise ValueError(f"無法讀取 PDF 文件: {file_path}")
    
    return pages


def split_documents(documents):
    text_splitter = CharacterTextSplitter(chunk_size=1000, chunk_overlap=0)
    return text_splitter.split_documents(documents)




def translate_and_store_to_knowledge_base(file_path, model, source_lang, target_lang, country, progress_callback=None):
    print(f"Starting translation for file: {file_path}")
    try:
        # 加載 PDF
        pages = load_pdf(file_path)
        print(f"Loaded {len(pages)} pages from PDF")

        # 分割文檔
        chunks = split_documents(pages)
        print(f"Split document into {len(chunks)} chunks")

        # 翻譯
        translated_chunks = []
        for i, chunk in enumerate(chunks):
            try:
                translated_text = one_chunk_translate_text(chunk.page_content, model, source_lang, target_lang, country)
                translated_chunks.append(translated_text)
                print(f"Translated chunk {i+1}/{len(chunks)}")
                if progress_callback:
                    progress_callback(i + 1)
            except Exception as e:
                print(f"Error translating chunk {i+1}: {str(e)}")
                raise
        
        full_translation = "\n\n".join(translated_chunks)
        
        # 存儲到向量數據庫
        # 這裡應該實現您的向量存儲邏輯
        
        # 保存翻譯結果
        filename = Path(file_path).stem
        save_path = Path('translations') / f"{filename}_translated.txt"
        with open(save_path, 'w', encoding='utf-8') as f:
            f.write(full_translation)
        
        print(f"Translation completed and saved to {save_path}")
        return save_path
    except Exception as e:
        print(f"Error in translate_and_store_to_knowledge_base: {str(e)}")
        print(traceback.format_exc())
        raise

#####################################################################


class TestTranslationUtils(unittest.TestCase):
    def test_one_chunk_translate_text(self):
        test_text = "Hello, world! This is a test sentence."
        translated_text = one_chunk_translate_text(
            test_text,
            Config.MODEL_NAME,
            Config.SOURCE_LANG,
            Config.TARGET_LANG,
            Config.COUNTRY
        )
        print(f"原文：{test_text}")
        print(f"翻譯：{translated_text}")
        self.assertIsNotNone(translated_text)
        self.assertNotEqual(translated_text, test_text)

if __name__ == '__main__':
    unittest.main()