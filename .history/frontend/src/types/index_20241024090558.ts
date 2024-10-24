export interface Message {
  sender: "user" | "system";
  text: string;
  chunks?: string[];
}

export interface FileWithOptions {
  id: string;
  file: File;
  name: string;
  needTranslation: boolean;
  status: 'pending' | 'translating' | 'embedding' | 'completed' | 'error';
  progress: number;
  selected: boolean;
  content?: string;
  translatedContent?: string;
  error?: string;
}

export interface TranslatedFile {
  id: string;
  name: string;
  translatedContent: string;
  originalContent?: string;
  isEmbedded: boolean;
  knowledgeBaseId?: string;
  embeddingProgress?: number;
}

export interface ModelSettings {
  model: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  frequencyPenalty: number;
  seed: number;
  topK: number;
  similarityThreshold: number;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  knowledgeBaseId: string;
}

export interface KnowledgeBase {
  id: string;
  name: string;
  description: string;
}
