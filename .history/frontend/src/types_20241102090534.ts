export interface FileProcessingHook {
  uploadProgress: { [key: string]: number };
  translatedFiles: TranslatedFile[];
  setTranslatedFiles: React.Dispatch<React.SetStateAction<TranslatedFile[]>>;
  handleFileUpload: (files: FileWithOptions[]) => Promise<void>;
  handleBatchEmbed: (fileIds: string[], targetKnowledgeBaseId: string, onProgress?: (progress: number) => void) => Promise<void>;
  handleDelete: (fileId: string) => Promise<void>;
} 