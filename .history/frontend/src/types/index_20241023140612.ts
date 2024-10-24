// src/types/index.ts

export interface Message {
  sender: 'user' | 'system';
  text: string;
  chunks?: string[];
}

export interface TranslatedFile {
  id: string;
  name: string;
  translatedContent: string;
  isEmbedded: boolean;
  knowledgeBaseId: string;
  needTranslation?: boolean;
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

export interface FileWithType {
  file: File;
  needTranslation: boolean;
  id: string;
  name: string;
  selected: boolean;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress?: number;
}

export interface ChatSession {
  id: string;
  title: string;
  description?: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

export interface KnowledgeBase {
  id: string;
  name: string;
  description: string;
}
export interface FileWithOptions {
  id: string;
  file: File;
  name: string;
  needTranslation: boolean;
  status: 'pending' | 'translating' | 'embedding' | 'completed' | 'error';
  progress: number;
  content?: string;
  translatedContent?: string;
  error?: string;
}