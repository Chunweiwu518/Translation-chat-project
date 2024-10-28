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

interface KnowledgeBaseInfo {
  id: string;
  name: string;
  description: string;
  files?: KnowledgeBaseFile[];
}

interface KnowledgeBaseManagerProps {
  knowledgeBases: KnowledgeBaseInfo[];
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
  const [expandedKB, setExpandedKB] = useState<string | null>(null);
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

  // 當展開知識庫時獲取文件列表
  useEffect(() => {
    if (expandedKB) {
      fetchKnowledgeBaseFiles(expandedKB);
    }
  }, [expandedKB]);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">知識庫管理</h2>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          <Plus className="w-5 h-5 mr-2" />
          新增知識庫
        </button>
      </div>

      <div className="space-y-4">
        {knowledgeBases.map(kb => (
          <div
            key={kb.id}
            className={`bg-white rounded-lg shadow-sm border p-4 ${
              kb.id === currentKnowledgeBase ? 'border-blue-500' : ''
            }`}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <h3 className="font-semibold text-lg">{kb.name}</h3>
                  {kb.id === currentKnowledgeBase && (
                    <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">
                      當前使用中
                    </span>
                  )}
                </div>
                {kb.description && (
                  <p className="text-gray-500 text-sm mt-1">{kb.description}</p>
                )}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => onSwitch(kb.id)}
                  className="p-2 hover:bg-blue-100 rounded text-blue-500"
                  title="使用此知識庫"
                >
                  <Database className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onReset(kb.id)}
                  className="p-2 hover:bg-yellow-100 rounded text-yellow-500"
                  title="重置知識庫"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                {kb.id !== 'default' && (
                  <button
                    onClick={() => {
                      if (window.confirm('確定要刪除此知識庫嗎？此操作無法恢復。')) {
                        onDelete(kb.id);
                      }
                    }}
                    className="p-2 hover:bg-red-100 rounded text-red-500"
                    title="刪除知識庫"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => setExpandedKB(expandedKB === kb.id ? null : kb.id)}
                  className="p-2 hover:bg-gray-100 rounded"
                >
                  {expandedKB === kb.id ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* 知識庫文件列表 */}
            {expandedKB === kb.id && (
              <div className="mt-4 border-t pt-4">
                <h4 className="text-sm font-medium text-gray-600 mb-2">包含的文件：</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {kbFiles[kb.id]?.length > 0 ? (
                    kbFiles[kb.id].map(file => (
                      <div
                        key={file.id}
                        className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded"
                      >
                        <FileText className="w-4 h-4 text-gray-400" />
                        <span className="flex-1 text-sm truncate">{file.filename}</span>
                        <span className="text-xs text-gray-400">
                          {new Date(file.addedAt).toLocaleDateString()}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 italic">尚無文件</p>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 創建新知識庫的表單 */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-bold mb-4">新增知識庫</h3>
            <input
              type="text"
              placeholder="知識庫名稱"
              className="w-full p-2 border rounded mb-4"
              value={newKBName}
              onChange={e => setNewKBName(e.target.value)}
            />
            <input
              type="text"
              placeholder="描述（選填）"
              className="w-full p-2 border rounded mb-4"
              value={newKBDescription}
              onChange={e => setNewKBDescription(e.target.value)}
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
              >
                取消
              </button>
              <button
                onClick={async () => {
                  if (newKBName) {
                    await onCreateNew(newKBName, newKBDescription);
                    setNewKBName('');
                    setNewKBDescription('');
                    setShowCreateForm(false);
                  }
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                創建
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};