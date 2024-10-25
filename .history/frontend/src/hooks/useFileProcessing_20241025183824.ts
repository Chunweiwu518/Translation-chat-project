// hooks/useFileProcessing.ts
import { useState } from 'react';
import { FileWithOptions, TranslatedFile } from '../types';

export function useFileProcessing() {
  const [uploadProgress, setUploadProgress] = useState<{[key: string]: number}>({});
  const [translatedFiles, setTranslatedFiles] = useState<TranslatedFile[]>([]);

  const handleFileUpload = async (files: FileWithOptions[]) => {
    for (const file of files) {
      setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));

      try {
        const formData = new FormData();
        formData.append("file", file.file);

        const endpoint = file.needTranslation
          ? "http://localhost:5000/api/upload_and_translate"
          : "http://localhost:5000/api/upload";

        const response = await fetch(endpoint, {
          method: "POST",
          body: formData,
        });

        if (response.ok) {
          const data = await response.json();
          const newFile: TranslatedFile = {
            id: file.id,
            name: file.name,
            translatedContent: file.needTranslation
              ? data.translated_content
              : data.content,
            originalContent: !file.needTranslation ? data.content : undefined,
            isEmbedded: false,
          };

          setTranslatedFiles(prev => [...prev, newFile]);
          setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));
        }
      } catch (error) {
        console.error(`處理文件錯誤 (${file.name}):`, error);
      } finally {
        setTimeout(() => {
          setUploadProgress(prev => {
            const newProgress = { ...prev };
            delete newProgress[file.name];
            return newProgress;
          });
        }, 1000);
      }
    }
  };

  const handleBatchEmbed = async (fileIds: string[], targetKnowledgeBaseId: string) => {
    for (const fileId of fileIds) {
      const file = translatedFiles.find(f => f.id === fileId);
      if (!file) continue;

      try {
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
                ? { ...f, isEmbedded: true, knowledgeBaseId: targetKnowledgeBaseId }
                : f
            )
          );
        }
      } catch (error) {
        console.error("Embedding 錯誤:", error);
      }
    }
  };

  return {
    uploadProgress,
    translatedFiles,
    handleFileUpload,
    handleBatchEmbed,
  };
}