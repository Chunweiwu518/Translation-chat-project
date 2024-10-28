// KnowledgeBaseManager.tsx
import React, { useState, useEffect } from "react";
import {
  Plus,
  Database,
  RefreshCw,
  Trash2,
  ChevronDown,
  ChevronUp,
  FileText,
} from "lucide-react";

interface KnowledgeBaseFile {
  id: string;
  filename: string;
  addedAt: string;
}

interface KnowledgeBaseManagerProps {
  knowledgeBases: Array<{ id: string; name: string; description: string }>;
  currentKnowledgeBase: string;
  onCreateNew: (name: string, description: string) => Promise<void>;
  onSwitch: (id: string) => void;
  onReset: (id: string) => void;
  onDelete: (id: string) => void;
}

export const KnowledgeBaseManager: React.FC<KnowledgeBaseManagerProps> = ({
  knowledgeBases,
  currentKnowledgeBase,
  onCreateNew,
  onSwitch,
  onReset,
  onDelete,
}) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newKBName, setNewKBName] = useState("");
  const [newKBDescription, setNewKBDescription] = useState("");
  const [isExpanded, setIsExpanded] = useState(true);
  const [kbFiles, setKbFiles] = useState<{ [key: string]: KnowledgeBaseFile[] }>({});

  // 獲取知識庫中的文件
  const fetchKnowledgeBaseFiles = async (kbId: string) => {
    try {
      const response = await fetch(`http://localhost:5000/api/knowledge_base/${kbId}/files`);
      if (response.ok) {
        const files = await response.json();
        setKbFiles(prev => ({
          ...prev,
          [kbId]: files
        }));
      }
    } catch (error) {
      console.error('獲取知識庫文件失敗:', error);
    }
  };

  // 當知識庫列表改變時，獲取每個知識庫的文件
  useEffect(() => {
    knowledgeBases.forEach(kb => {
      fetchKnowledgeBaseFiles(kb.id);
    });
  }, [knowledgeBases]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newKBName.trim()) {
      onCreateNew(newKBName.trim(), newKBDescription.trim());
      setNewKBName("");
      setNewKBDescription("");
      setShowCreateForm(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5" />
          <h3 className="font-medium">知識庫管理</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCreateForm(true)}
            className="p-1 hover:bg-gray-100 rounded"
            title="新增知識庫"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-gray-100 rounded"
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-2">
          {showCreateForm && (
            <div className="p-2 border rounded mb-2">
              <input
                type="text"
                value={newKBName}
                onChange={(e) => setNewKBName(e.target.value)}
                placeholder="知識庫名稱"
                className="w-full p-2 border rounded mb-2"
              />
              <input
                type="text"
                value={newKBDescription}
                onChange={(e) => setNewKBDescription(e.target.value)}
                placeholder="描述（選填）"
                className="w-full p-2 border rounded mb-2"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
                >
                  取消
                </button>
                <button
                  onClick={handleSubmit}
                  className="px-3 py-1 text-sm bg-blue-500 text-white hover:bg-blue-600 rounded"
                >
                  創建
                </button>
              </div>
            </div>
          )}

          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {knowledgeBases.map((kb) => (
              <div
                key={kb.id}
                className={`p-2 rounded group ${
                  kb.id === currentKnowledgeBase
                    ? "bg-blue-50"
                    : "hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">
                      {kb.name}
                    </div>
                    {kb.description && (
                      <div className="text-xs text-gray-500 truncate">
                        {kb.description}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 ml-2 opacity-0 group-hover:opacity-100">
                    <button
                      onClick={() => onSwitch(kb.id)}
                      className={`p-1 rounded ${
                        kb.id === currentKnowledgeBase
                          ? "text-blue-500"
                          : "hover:bg-gray-200"
                      }`}
                      title="使用此知識庫"
                    >
                      <Database className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onReset(kb.id)}
                      className="p-1 hover:bg-yellow-100 text-yellow-500 rounded"
                      title="重置知識庫"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                    {kb.id !== "default" && (
                      <button
                        onClick={() => onDelete(kb.id)}
                        className="p-1 hover:bg-red-100 text-red-500 rounded"
                        title="刪除知識庫"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
