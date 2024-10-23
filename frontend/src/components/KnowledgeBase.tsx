
// KnowledgeBaseManager.tsx
import React, { useState } from "react";
import { Plus, Edit2, Trash2, Database } from "lucide-react";

interface KnowledgeBase {
  id: string;
  name: string;
  description: string;
}

interface KnowledgeBaseManagerProps {
  knowledgeBases: KnowledgeBase[];
  currentKnowledgeBase: string;
  onCreateNew: (name: string, description: string) => void;
  onSwitch: (id: string) => void;
  onReset: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, name: string, description: string) => void;
}

export const KnowledgeBaseManager: React.FC<KnowledgeBaseManagerProps> = ({
  knowledgeBases,
  currentKnowledgeBase,
  onCreateNew,
  onSwitch,
  onReset,
  onDelete,
  onUpdate,
}) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newKBName, setNewKBName] = useState("");
  const [newKBDescription, setNewKBDescription] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newKBName.trim()) {
      onCreateNew(newKBName.trim(), newKBDescription.trim());
      setNewKBName("");
      setNewKBDescription("");
      setShowCreateForm(false);
    }
  };

  const handleUpdate = (id: string, name: string, description: string) => {
    onUpdate(id, name, description);
    setEditingId(null);
  };

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold">知識庫管理</h3>
        <button
          onClick={() => setShowCreateForm(true)}
          className="p-1 hover:bg-gray-100 rounded-full"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {showCreateForm && (
        <form onSubmit={handleSubmit} className="mb-4 p-3 bg-gray-50 rounded">
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
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="px-3 py-1 text-sm bg-gray-200 rounded"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-3 py-1 text-sm bg-blue-500 text-white rounded"
            >
              創建
            </button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        {knowledgeBases.map((kb) => (
          <div
            key={kb.id}
            className={`p-2 rounded border transition-colors ${
              kb.id === currentKnowledgeBase
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200 hover:bg-gray-50"
            }`}
          >
            {editingId === kb.id ? (
              <div className="space-y-2 p-2">
                <input
                  type="text"
                  value={kb.name}
                  onChange={(e) =>
                    handleUpdate(kb.id, e.target.value, kb.description)
                  }
                  className="w-full p-2 border rounded"
                />
                <input
                  type="text"
                  value={kb.description}
                  onChange={(e) => handleUpdate(kb.id, kb.name, e.target.value)}
                  placeholder="描述（選填）"
                  className="w-full p-2 border rounded"
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setEditingId(null)}
                    className="px-2 py-1 text-sm bg-gray-200 rounded"
                  >
                    取消
                  </button>
                  <button
                    onClick={() => handleUpdate(kb.id, kb.name, kb.description)}
                    className="px-2 py-1 text-sm bg-blue-500 text-white rounded"
                  >
                    保存
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium">{kb.name}</h4>
                  {kb.description && (
                    <p className="text-sm text-gray-500 mt-1">
                      {kb.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => onSwitch(kb.id)}
                    className={`p-1 rounded ${
                      kb.id === currentKnowledgeBase
                        ? "text-blue-500"
                        : "text-gray-400 hover:text-gray-600"
                    }`}
                    title="切換知識庫"
                  >
                    <Database className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setEditingId(kb.id)}
                    className="p-1 text-gray-400 hover:text-gray-600 rounded"
                    title="編輯"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  {kb.id !== "default" && (
                    <button
                      onClick={() => onDelete(kb.id)}
                      className="p-1 text-red-400 hover:text-red-600 rounded"
                      title="刪除"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
