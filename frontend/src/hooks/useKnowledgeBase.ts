// src/hooks/useKnowledgeBase.ts
import { useState, useEffect } from 'react';
import { KnowledgeBase, KnowledgeBaseHook } from '../types';

export function useKnowledgeBase(): KnowledgeBaseHook {
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([]);
  const [currentKnowledgeBase, setCurrentKnowledgeBase] = useState("default");

  const fetchKnowledgeBases = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/knowledge_bases");
      if (response.ok) {
        const data = await response.json();
        setKnowledgeBases(data);
      }
    } catch (error) {
      console.error("獲取知識庫列表失敗:", error);
    }
  };

  const createKnowledgeBase = async (name: string, description: string): Promise<void> => {
    try {
      const response = await fetch("http://localhost:5000/api/knowledge_base", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
      });
      if (response.ok) {
        await fetchKnowledgeBases();
      }
    } catch (error) {
      console.error("創建知識庫失敗:", error);
    }
  };

  const deleteKnowledgeBase = async (id: string): Promise<void> => {
    if (!window.confirm("確定要刪除此知識庫嗎？此操作無法恢復。")) return;
    
    try {
      const response = await fetch(
        `http://localhost:5000/api/knowledge_base/${id}`,
        { method: "DELETE" }
      );
      
      if (response.ok) {
        if (id === currentKnowledgeBase) {
          setCurrentKnowledgeBase("default");
        }
        await fetchKnowledgeBases();
      }
    } catch (error) {
      console.error("刪除知識庫失敗:", error);
    }
  };

  const resetKnowledgeBase = async (id: string): Promise<void> => {
    if (!window.confirm("確定要重置此知識庫嗎？所有檔案將被移除。")) return;
    
    try {
      const response = await fetch(
        `http://localhost:5000/api/knowledge_base/reset/${id}`,
        { method: "POST" }
      );
      if (response.ok) {
        await fetchKnowledgeBases();
      }
    } catch (error) {
      console.error("重置知識庫失敗:", error);
    }
  };

  useEffect(() => {
    fetchKnowledgeBases();
  }, []);

  return {
    knowledgeBases,
    currentKnowledgeBase,
    setCurrentKnowledgeBase,
    createKnowledgeBase,
    deleteKnowledgeBase,
    resetKnowledgeBase,
  };
}