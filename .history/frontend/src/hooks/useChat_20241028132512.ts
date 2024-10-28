// src/hooks/useChat.ts
import { useState, useEffect } from 'react';
import { Message, ChatSession, ModelSettings, ChatHook } from '../types';

export function useChat(): ChatHook {
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>(() => {
    // 從 localStorage 讀取聊天記錄
    const savedSessions = localStorage.getItem('chatSessions');
    return savedSessions ? JSON.parse(savedSessions) : [];
  });
  const [currentSession, setCurrentSession] = useState<string | null>(() => {
    // 從 localStorage 讀取當前會話
    return localStorage.getItem('currentSession');
  });

  // 當聊天會話改變時，保存到 localStorage
  useEffect(() => {
    localStorage.setItem('chatSessions', JSON.stringify(chatSessions));
  }, [chatSessions]);

  // 當當前會話改變時，保存到 localStorage
  useEffect(() => {
    if (currentSession) {
      localStorage.setItem('currentSession', currentSession);
    } else {
      localStorage.removeItem('currentSession');
    }
  }, [currentSession]);

  const createNewChatSession = (knowledgeBaseId: string) => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: `新對話 ${chatSessions.length + 1}`,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      knowledgeBaseId
    };
    setChatSessions(prev => [...prev, newSession]);
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
    // 添加用戶訊息
    const userMessage: Message = { sender: "user", text };
    setMessages(prev => [...prev, userMessage]);

    // 更新當前會話
    if (currentSession) {
      setChatSessions(prev => prev.map(session => 
        session.id === currentSession
          ? {
              ...session,
              messages: [...session.messages, userMessage],
              updatedAt: new Date()
            }
          : session
      ));
    }

    try {
      // 發送請求到後端
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
        const systemMessage: Message = {
          sender: "system",
          text: data.answer,
          chunks: data.relevant_chunks,
        };

        // 更新訊息和會話
        setMessages(prev => [...prev, systemMessage]);
        if (currentSession) {
          setChatSessions(prev => prev.map(session => 
            session.id === currentSession
              ? {
                  ...session,
                  messages: [...session.messages, systemMessage],
                  updatedAt: new Date()
                }
              : session
          ));
        }
      }
    } catch (error) {
      console.error("發送訊息失敗:", error);
      const errorMessage: Message = {
        sender: "system",
        text: "抱歉，發生錯誤。請稍後再試。",
      };
      setMessages(prev => [...prev, errorMessage]);
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
