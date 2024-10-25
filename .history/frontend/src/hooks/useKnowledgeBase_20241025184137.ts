// src/hooks/useKnowledgeBase.ts
import { useState, useEffect } from 'react';
import { KnowledgeBaseInfo, KnowledgeBaseHook } from '../types';

export function useKnowledgeBase(): KnowledgeBaseHook {
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBaseInfo[]>([
    { id: "default", name: "預設知識庫", description: "預設的知識庫" },
  ]);
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

  const createKnowledgeBase = async (name: string, description: string) => {
    try {
      const response = await fetch("http://localhost:5000/api/knowledge_base", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
      });
      if (response.ok) {
        await fetchKnowledgeBases();
        return true;
      }
      return false;
    } catch (error) {
      console.error("創建知識庫失敗:", error);
      return false;
    }
  };

  const deleteKnowledgeBase = async (id: string) => {
    if (!window.confirm("確定要刪除此知識庫嗎？此操作無法恢復。")) return false;
    
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
        return true;
      }
      return false;
    } catch (error) {
      console.error("刪除知識庫失敗:", error);
      return false;
    }
  };

  const resetKnowledgeBase = async (id: string) => {
    if (!window.confirm("確定要重置此知識庫嗎？所有檔案將被移除。")) return false;
    
    try {
      const response = await fetch(
        `http://localhost:5000/api/knowledge_base/reset/${id}`,
        { method: "POST" }
      );
      if (response.ok) {
        await fetchKnowledgeBases();
        return true;
      }
      return false;
    } catch (error) {
      console.error("重置知識庫失敗:", error);
      return false;
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