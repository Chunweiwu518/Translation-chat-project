// src/hooks/useChat.ts
import { useState } from 'react';
import { Message, ChatSession, ModelSettings, ChatHook } from '../types';

export function useChat(): ChatHook {
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<string | null>(null);

  const createNewChatSession = (knowledgeBaseId: string) => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: "新對話",
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      knowledgeBaseId,
    };
    setChatSessions(prev => [newSession, ...prev]);
    setCurrentSession(newSession.id);
    setMessages([]);
  };

  const handleLoadSession = (sessionId: string) => {
    const session = chatSessions.find(s => s.id === sessionId);
    if (session) {
      setCurrentSession(sessionId);
      setMessages(session.messages);
    }
  };

  const handleDeleteSession = (sessionId: string) => {
    setChatSessions(prev => prev.filter(s => s.id !== sessionId));
    if (currentSession === sessionId) {
      setCurrentSession(null);
      setMessages([]);
    }
  };

  const handleSendMessage = async (
    text: string,
    knowledgeBaseId: string,
    modelSettings: ModelSettings
  ) => {
    if (!currentSession) {
      createNewChatSession(knowledgeBaseId);
    }

    const userMessage = { sender: "user" as const, text };
    setMessages(prev => [...prev, userMessage]);

    try {
      const response = await fetch("http://localhost:5000/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: text,
          knowledge_base_id: knowledgeBaseId,
          model_settings: {
            model_name: modelSettings.model,
            parameters: {
              temperature: modelSettings.temperature,
              max_tokens: modelSettings.maxTokens,
              top_p: modelSettings.topP,
              frequency_penalty: modelSettings.frequencyPenalty,
              seed: modelSettings.seed,
              topK: modelSettings.topK_RAG,
              similarityThreshold: modelSettings.similarityThreshold,
            },
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const systemMessage = {
          sender: "system" as const,
          text: data.answer,
          chunks: data.relevant_chunks,
        };

        setMessages(prev => [...prev, systemMessage]);

        setChatSessions(prev =>
          prev.map(session =>
            session.id === currentSession
              ? {
                  ...session,
                  messages: [...session.messages, userMessage, systemMessage],
                  updatedAt: new Date(),
                }
              : session
          )
        );
      }
    } catch (error) {
      console.error("查詢錯誤:", error);
      setMessages(prev => [
        ...prev,
        {
          sender: "system",
          text: "抱歉，處理您的問題時出現錯誤。請稍後重試。",
        },
      ]);
    }
  };

  return {
    messages,
    chatSessions,
    currentSession,
    setMessages,
    setCurrentSession,
    createNewChatSession,
    handleSendMessage,
    handleLoadSession,
    handleDeleteSession,
  };
}