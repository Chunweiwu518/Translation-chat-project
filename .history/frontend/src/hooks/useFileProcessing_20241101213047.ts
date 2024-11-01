// src/hooks/useFileProcessing.ts
import { useState, useEffect } from 'react';
import { FileWithOptions, TranslatedFile, FileProcessingHook } from '../types';

export function useFileProcessing(): FileProcessingHook {
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [translatedFiles, setTranslatedFiles] = useState<TranslatedFile[]>([]);

  useEffect(() => {
    const fetchTranslations = async () => {
      try {
        console.log('開始獲取翻譯結果');
        const response = await fetch('http://localhost:5000/api/translations');
        console.log('API 響應狀態:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('成功獲取翻譯數據:', data);
          setTranslatedFiles(data);
        } else {
          console.error('獲取翻譯失敗:', response.status, response.statusText);
        }
      } catch (error) {
        console.error('獲取翻譯結果失敗:', error);
      }
    };

    fetchTranslations();
  }, []);

  const handleFileUpload = async (files: FileWithOptions[]) => {
    for (const file of files) {
      try {
        const formData = new FormData();
        formData.append('file', file.file as unknown as File);

        const response = await fetch(
          file.needTranslation
            ? 'http://localhost:5000/api/upload_and_translate'
            : 'http://localhost:5000/api/upload',
          {
            method: 'POST',
            body: formData,
          }
        );

        if (response.ok) {
          const data = await response.json();
          const newFile: TranslatedFile = {
            id: file.id || crypto.randomUUID(),
            name: file.name,
            translatedContent: file.needTranslation 
              ? data.translated_content 
              : data.content,
            originalContent: data.content,
            status: 'completed',
            isEmbedded: false,
            embeddingProgress: 0
          };

          await fetch('http://localhost:5000/api/translations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newFile)
          });

          setTranslatedFiles(prev => [...prev, newFile]);
        }
      } catch (error) {
        console.error('處理檔案失敗:', error);
        const failedFile: TranslatedFile = {
          id: crypto.randomUUID(),
          name: file.name,
          originalContent: '',
          translatedContent: '',
          status: 'failed',
          isEmbedded: false,
          embeddingProgress: 0
        };

        setTranslatedFiles(prev => [...prev, failedFile]);
      }
    }
  };

  const handleBatchEmbed = async (
    fileIds: string[],
    targetKnowledgeBaseId: string,
    onProgress?: (progress: number) => void
  ) => {
    for (const fileId of fileIds) {
      const file = translatedFiles.find(f => f.id === fileId);
      if (!file) continue;

      try {
        setTranslatedFiles(prev =>
          prev.map(f =>
            f.id === fileId ? { ...f, embeddingProgress: 0 } : f
          )
        );

        const response = await fetch("http://localhost:5000/api/embed", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: file.translatedContent || file.originalContent,
            filename: file.name,
            knowledge_base_id: targetKnowledgeBaseId,
          }),
        });

        if (response.ok) {
          setTranslatedFiles(prev =>
            prev.map(f =>
              f.id === fileId
                ? { 
                    ...f, 
                    isEmbedded: true, 
                    knowledgeBaseId: targetKnowledgeBaseId,
                    embeddingProgress: 100 
                  }
                : f
            )
          );
          onProgress?.(100);
        }
      } catch (error) {
        console.error("Embedding 錯誤:", error);
        setTranslatedFiles(prev =>
          prev.map(f =>
            f.id === fileId
              ? { ...f, embeddingProgress: undefined }
              : f
          )
        );
      }
    }
  };

  const handleDelete = async (fileId: string) => {
    try {
      await fetch(`http://localhost:5000/api/translations/${fileId}`, {
        method: 'DELETE'
      });
      setTranslatedFiles(prev => prev.filter(file => file.id !== fileId));
    } catch (error) {
      console.error('刪除翻譯文件失敗:', error);
    }
  };

  return {
    uploadProgress,
    translatedFiles,
    handleFileUpload,
    handleBatchEmbed,
    setTranslatedFiles,
    handleDelete
  };
}
