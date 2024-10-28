// src/hooks/useFileProcessing.ts
import { useState, useEffect } from 'react';
import { FileWithOptions, TranslatedFile, FileProcessingHook } from '../types';

export function useFileProcessing(): FileProcessingHook {
  const [uploadProgress, setUploadProgress] = useState<{[key: string]: number}>({});
  const [translatedFiles, setTranslatedFiles] = useState<TranslatedFile[]>([]);

  // 添加初始化函數
  const fetchTranslatedFiles = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/translated_files');
      if (response.ok) {
        const data = await response.json();
        setTranslatedFiles(data);
      }
    } catch (error) {
      console.error('獲取翻譯文件失敗:', error);
    }
  };

  // 在組件掛載時獲取已有的翻譯文件
  useEffect(() => {
    fetchTranslatedFiles();
  }, []);

  const handleFileUpload = async (files: FileWithOptions[]) => {
    for (const file of files) {
      try {
        const formData = new FormData();
        formData.append('file', file.file);

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
            id: file.id,
            name: file.name,
            translatedContent: file.needTranslation 
              ? data.translated_content 
              : data.content,
            originalContent: data.content,
            status: 'completed',
            isEmbedded: false,
            embeddingProgress: 0
          };

          // 保存翻譯文件到後端
          await fetch('http://localhost:5000/api/translated_files', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newFile)
          });

          setTranslatedFiles(prev => [...prev, newFile]);
        }
      } catch (error) {
        console.error('處理檔案失敗:', error);
        const failedFile: TranslatedFile = {
          id: file.id,
          name: file.name,
          originalContent: '',
          translatedContent: '',
          status: 'failed',
          isEmbedded: false,
          embeddingProgress: 0
        };

        // 保存失敗記錄到後端
        await fetch('http://localhost:5000/api/translated_files', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(failedFile)
        });

        setTranslatedFiles(prev => [...prev, failedFile]);
      }
    }
  };

  const handleBatchEmbed = async (fileIds: string[], targetKnowledgeBaseId: string) => {
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

  // 修改刪除函數
  const handleDelete = async (fileId: string) => {
    try {
      // 從後端刪除文件
      await fetch(`http://localhost:5000/api/translated_files/${fileId}`, {
        method: 'DELETE'
      });
      
      // 更新前端狀態
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
    handleDelete  // 導出刪除函數
  };
}
