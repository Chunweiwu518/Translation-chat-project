// src/hooks/useFileProcessing.ts
import { useState, useEffect } from 'react';
import { FileWithOptions, TranslatedFile, FileProcessingHook } from '../types';

export function useFileProcessing(): FileProcessingHook {
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [translatedFiles, setTranslatedFiles] = useState<TranslatedFile[]>(() => {
    // 從 localStorage 讀取已保存的翻譯文件
    const savedFiles = localStorage.getItem('translatedFiles');
    return savedFiles ? JSON.parse(savedFiles) : [];
  });

  // 當 translatedFiles 改變時，保存到 localStorage
  useEffect(() => {
    localStorage.setItem('translatedFiles', JSON.stringify(translatedFiles));
  }, [translatedFiles]);

  useEffect(() => {
    const fetchTranslations = async () => {
      try {
        console.log('開始獲取翻譯結果');
        const response = await fetch('http://localhost:5000/api/translations');
        console.log('API 響應狀態:', response.status);
        
        if (response.ok) {
          const data = await response.json() as TranslatedFile[];
          console.log('成功獲取翻譯數據:', data);
          setTranslatedFiles(prev => {
            // 合併後端數據和本地數據，以 id 為鍵去重
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
          
          // 確保使用後端返回的ID
          const newFile: TranslatedFile = {
            id: data.id, // 使用後端生成的ID
            name: data.name,
            translatedContent: data.translatedContent,
            originalContent: data.originalContent,
            status: 'completed',
            isEmbedded: false,
            embeddingProgress: 0
          };

          setTranslatedFiles(prev => {
            // 檢查是否已存在相同ID的文件
            const existingIndex = prev.findIndex(f => f.id === newFile.id);
            if (existingIndex >= 0) {
              // 如果存在，更新它
              const updated = [...prev];
              updated[existingIndex] = newFile;
              return updated;
            }
            // 如果不存在，添加新文件
            return [...prev, newFile];
          });
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

  // 添加定期檢查翻譯狀態的邏輯
  useEffect(() => {
    const fetchTranslations = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/translations');
        if (response.ok) {
          const data = await response.json();
          setTranslatedFiles(prev => {
            // 合併現有文件和新獲取的文件
            const merged = [...prev];
            data.forEach((newFile: TranslatedFile) => {
              const existingIndex = merged.findIndex(f => f.id === newFile.id);
              if (existingIndex >= 0) {
                merged[existingIndex] = newFile;
              } else {
                merged.push(newFile);
              }
            });
            return merged;
          });
        }
      } catch (error) {
        console.error('獲取翻譯列表失敗:', error);
      }
    };

    // 每30秒檢查一次翻譯狀態
    const interval = setInterval(fetchTranslations, 30000);
    return () => clearInterval(interval);
  }, []);

  return {
    uploadProgress,
    translatedFiles,
    handleFileUpload,
    handleBatchEmbed,
    setTranslatedFiles,
    handleDelete
  };
}
