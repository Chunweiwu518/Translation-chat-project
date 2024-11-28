// src/hooks/useFileProcessing.ts
import { useState, useEffect } from 'react';
import { TranslatedFile, FileProcessingHook, FileWithMetadata } from '../types';

const API_URL = process.env.REACT_APP_API_URL;

export function useFileProcessing(): FileProcessingHook {
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [translatedFiles, setTranslatedFiles] = useState<TranslatedFile[]>(() => {
    const savedFiles = localStorage.getItem('translatedFiles');
    return savedFiles ? JSON.parse(savedFiles) : [];
  });

  useEffect(() => {
    localStorage.setItem('translatedFiles', JSON.stringify(translatedFiles));
  }, [translatedFiles]);

  useEffect(() => {
    const fetchTranslations = async () => {
      try {
        console.log('開始獲取翻譯結果');
        const response = await fetch(`${API_URL}/api/translations`);
        console.log('API 響應狀態:', response.status);
        
        if (response.ok) {
          const data = await response.json() as TranslatedFile[];
          console.log('成功獲取翻譯數據:', data);
          setTranslatedFiles(prev => {
            const mergedFiles = [...prev];
            data.forEach((newFile: TranslatedFile) => {
              const existingIndex = mergedFiles.findIndex(f => f.id === newFile.id);
              if (existingIndex === -1) {
                mergedFiles.push(newFile);
              } else {
                mergedFiles[existingIndex] = newFile;
              }
            });
            return mergedFiles;
          });
        } else {
          console.error('獲取翻譯失敗:', response.status, response.statusText);
        }
      } catch (error) {
        console.error('獲取翻譯結果失敗:', error);
      }
    };

    fetchTranslations();
  }, []);

  const handleFileUpload = async (files: FileWithMetadata[]) => {
    for (const file of files) {
      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(
          file.needTranslation
            ? `${API_URL}/api/upload_and_translate`
            : `${API_URL}/api/upload`,
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

        const response = await fetch(`${API_URL}/api/embed`, {
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
      await fetch(`${API_URL}/api/translations/${fileId}`, {
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
