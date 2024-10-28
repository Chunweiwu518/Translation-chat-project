// src/hooks/useFileProcessing.ts
import { useState } from 'react';
import { FileWithOptions, TranslatedFile, FileProcessingHook } from '../types';

export function useFileProcessing(): FileProcessingHook {
  const [uploadProgress, setUploadProgress] = useState<{[key: string]: number}>({});
  const [translatedFiles, setTranslatedFiles] = useState<TranslatedFile[]>([]);

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
            status: 'completed', // 添加 status 屬性
            isEmbedded: false,
            embeddingProgress: 0
          };

          setTranslatedFiles(prev => [...prev, newFile]);
        }
      } catch (error) {
        console.error('處理檔案失敗:', error);
        // 添加錯誤狀態的文件
        setTranslatedFiles(prev => [...prev, {
          id: file.id,
          name: file.name,
          originalContent: '',
          translatedContent: '',
          status: 'failed', // 失敗狀態
          isEmbedded: false,
          embeddingProgress: 0
        }]);
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

  return {
    uploadProgress,
    translatedFiles,
    handleFileUpload,
    handleBatchEmbed,
    setTranslatedFiles
  };
}
