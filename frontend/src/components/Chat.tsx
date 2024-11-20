// 導入必要的 React 功能
import React, { useState, useRef, useEffect } from "react";

// 導入圖標組件，用於UI顯示
import {
  ChevronDown,  // 向下箭頭
  ChevronUp,    // 向上箭頭
  Settings,     // 設定圖標
  Database,     // 數據庫圖標
  PlusCircle,   // 新增圖標
  Trash2,       // 刪除圖標
  RefreshCw,    // 重整圖標
  Languages,    // 語言圖標
} from "lucide-react";

// 導入類型定義
import { Message, ModelSettings } from "../types";

// 定義 ChatProps 介面，描述組件需要的所有屬性
interface ChatProps {
  messages: Message[];              // 聊天訊息陣列
  onSendMessage: (text: string) => void;  // 發送新訊息的回調函數
  onClearChat: () => void;         // 清除聊天記錄的回調函數
  currentKnowledgeBaseName: string; // 當前使用的知識庫名稱
  modelSettings: ModelSettings;     // AI 模型的設定參數
  onSettingsChange: (settings: ModelSettings) => void;  // 更新模型設定的回調函數
  knowledgeBases: Array<{ id: string; name: string; description: string }>;  // 可用的知識庫列表
  currentKnowledgeBase: string;     // 當前選中的知識庫 ID
  onSwitchKnowledgeBase: (id: string) => void;  // 切換知識庫的回調函數
  onCreateKnowledgeBase: (name: string, description: string) => void;  // 創建新知識庫的回調函數
  onResetKnowledgeBase: (id: string) => void;   // 重置知識庫的回調函數
  onDeleteKnowledgeBase: (id: string) => void;  // 刪除知識庫的回調函數
  onUploadAndEmbed: (file: File, needTranslation: boolean) => Promise<void>;  // 上傳和嵌入文件的回調函數
}

// Chat 組件的主要實現
export const Chat: React.FC<ChatProps> = ({
  messages,
  onSendMessage,
  onClearChat,
  currentKnowledgeBaseName,
  modelSettings,
  onSettingsChange,
  knowledgeBases,
  currentKnowledgeBase,
  onSwitchKnowledgeBase,
  onCreateKnowledgeBase,
  onResetKnowledgeBase,
  onDeleteKnowledgeBase,
  onUploadAndEmbed,
}) => {
  // 組件內部狀態管理
  const [input, setInput] = useState("");  // 用戶輸入的文字
  const [expandedMessageId, setExpandedMessageId] = useState<number | null>(null);  // 追踪哪條訊息被展開顯示參考文件
  const [showSettings, setShowSettings] = useState(false);  // 控制是否顯示設定面板
  const [showKnowledgeBaseSettings, setShowKnowledgeBaseSettings] = useState(true);  // 控制是否顯示知識庫設定
  const [showNewKBForm, setShowNewKBForm] = useState(false);  // 控制是否顯示新增知識庫表單
  const [newKBName, setNewKBName] = useState("");  // 新知識庫名稱
  const [newKBDescription, setNewKBDescription] = useState("");  // 新知識庫描述
  const [isUploading, setIsUploading] = useState(false);  // 文件上傳狀態
  const [showRAGSettings, setShowRAGSettings] = useState(false);  // 控制是否顯示 RAG 設定
  const [showUploadOptions, setShowUploadOptions] = useState(false);  // 控制是否顯示上傳選項
  const [currentUploadMode, setCurrentUploadMode] = useState<'translate' | 'direct'>('translate');  // 上傳模式選擇

  // DOM 引用
  const fileInputRef = useRef<HTMLInputElement>(null);  // 文件上傳輸入框的引用
  const messagesEndRef = useRef<HTMLDivElement>(null);  // 訊息列表末端的引用

  // 自動滾動到最新訊息
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 處理訊息發送
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSendMessage(input);
      setInput("");  // 清空輸入框
    }
  };

  // 處理創建新知識庫
  const handleCreateKB = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newKBName.trim()) {
      await onCreateKnowledgeBase(newKBName, newKBDescription);
      // 重置表單
      setNewKBName("");
      setNewKBDescription("");
      setShowNewKBForm(false);
    }
  };

  // 組件渲染部分
  return (
    <div className="flex h-full gap-4">
      {/* 主要聊天區域 - 包含訊息列表和輸入框 */}
      <div className="flex-1 border rounded-lg bg-white flex flex-col">
        {/* 頂部標題欄 */}
        <div className="p-4 border-b flex items-center justify-between bg-gray-50">
          <div className="flex items-center space-x-4">
            <h2 className="text-lg font-semibold">知識對話</h2>
            <span className="text-sm text-gray-500">
              使用知識庫：{currentKnowledgeBaseName}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={onClearChat}
              className="p-2 text-gray-500 hover:bg-gray-100 rounded-full"
              title="清除對話"
            >
              <Trash2 className="w-5 h-5" />
            </button>
            <button
              onClick={() => onCreateKnowledgeBase("新對話", "")}
              className="p-2 text-blue-500 hover:bg-blue-100 rounded-full"
              title="新增對話"
            >
              <PlusCircle className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 訊息列表區域 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* 遍歷並渲染所有訊息 */}
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`max-w-[80%] ${
                msg.sender === "user" ? "ml-auto" : "mr-auto"
              }`}
            >
              <div
                className={`rounded-lg ${
                  msg.sender === "user"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100"
                }`}
              >
                <div className="p-3">{msg.text}</div>
                {msg.sender === "system" && msg.chunks && (
                  <div
                    className="px-3 py-1 text-sm text-gray-500 border-t border-gray-200 flex justify-between items-center cursor-pointer hover:bg-gray-50"
                    onClick={() =>
                      setExpandedMessageId(
                        expandedMessageId === idx ? null : idx
                      )
                    }
                  >
                    <span>參考文件</span>
                    {expandedMessageId === idx ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                )}
              </div>
              {msg.sender === "system" &&
                msg.chunks &&
                expandedMessageId === idx && (
                  <div className="mt-2 p-3 bg-gray-50 rounded border text-sm">
                    {msg.chunks.map((chunk, i) => (
                      <div key={i} className="mb-2">
                        <div className="font-medium text-gray-700 mb-1">
                          參考段落 {i + 1}:
                        </div>
                        <div className="text-gray-600">{chunk}</div>
                      </div>
                    ))}
                  </div>
                )}
            </div>
          ))}
          <div ref={messagesEndRef} />  {/* 用於自動滾動的錨點 */}
        </div>

        {/* 訊息輸入表單 */}
        <form onSubmit={handleSubmit} className="p-4 border-t">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="輸入訊息..."
              className="flex-1 p-2 border rounded-lg"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              發送
            </button>
          </div>
        </form>
      </div>

      {/* 右側邊欄 - 包含知識庫管理和模型設定 */}
      <div className="w-80 space-y-4">
        {/* 知識庫管理面板 */}
        <div 
          className="bg-white rounded-lg p-4 shadow-sm cursor-pointer"
          onClick={() => setShowKnowledgeBaseSettings(!showKnowledgeBaseSettings)}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">知識庫管理</h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();  // 防止事件冒泡
                  setShowNewKBForm(!showNewKBForm);
                }}
                className="p-2 rounded-full hover:bg-gray-100"
                title="新增知識庫"
              >
                <PlusCircle className="w-5 h-5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();  // 防止事件冒泡
                  setShowKnowledgeBaseSettings(!showKnowledgeBaseSettings);
                }}
                className={`p-2 rounded-full ${
                  showKnowledgeBaseSettings ? "bg-blue-100" : "hover:bg-gray-100"
                }`}
              >
                <Database className="w-5 h-5" />
              </button>
            </div>
          </div>

          {showKnowledgeBaseSettings && (
            <div onClick={(e) => e.stopPropagation()}>  {/* 防止設定內容的點擊事件冒泡 */}
              {knowledgeBases.map((kb) => (
                <div
                  key={kb.id}
                  className={`p-2 rounded group relative cursor-pointer ${
                    kb.id === currentKnowledgeBase
                      ? "bg-blue-50 border-blue-200"
                      : "hover:bg-gray-50"
                  }`}
                  onClick={() => onSwitchKnowledgeBase(kb.id)}  // 添加點擊事件到整個區域
                >
                  <div className="flex justify-between items-center">
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
                    <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();  // 防止事件冒泡
                          onResetKnowledgeBase(kb.id);
                        }}
                        className="p-1 rounded hover:bg-yellow-100 text-yellow-500"
                        title="重置知識庫"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                      {kb.id !== "default" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();  // 防止事件冒泡
                            if (
                              window.confirm(
                                "確定要刪除此知識庫嗎？此操作無法恢復。"
                              )
                            ) {
                              onDeleteKnowledgeBase(kb.id);
                            }
                          }}
                          className="p-1 rounded hover:bg-red-100 text-red-500"
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
          )}
        </div>

        {/* 模型設定面板 */}
        <div 
          className="bg-white rounded-lg p-4 shadow-sm cursor-pointer"
          onClick={() => setShowSettings(!showSettings)}  // 添加點擊事件
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">模型設定</h3>
            <button
              onClick={(e) => {
                e.stopPropagation();  // 防止事件冒泡
                setShowSettings(!showSettings);
              }}
              className={`p-2 rounded-full ${
                showSettings ? "bg-blue-100" : "hover:bg-gray-100"
              }`}
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>

          {showSettings && (
            <div onClick={(e) => e.stopPropagation()}>  {/* 防止設定內容的點擊事件冒泡 */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium block mb-1">模型</label>
                  <select
                    value={modelSettings.model}
                    onChange={(e) =>
                      onSettingsChange({
                        ...modelSettings,
                        model: e.target.value,
                      })
                    }
                    className="w-full p-2 text-sm border rounded"
                  >
                    <option value="llama3.1-ffm-70b-32k-chat">
                      llama3.1-70B-32k
                    </option>
                    <option value="llama3-ffm-70b-chat">llama3-70B</option>
                    <option value="ffm-mixtral-8x7b-32k-instruct">
                      mixtral-8x7B-32k
                    </option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium block mb-1">
                    Temperature: {modelSettings.temperature}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={modelSettings.temperature}
                    onChange={(e) =>
                      onSettingsChange({
                        ...modelSettings,
                        temperature: Number(e.target.value),
                      })
                    }
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    控制回應的創造性 (0: 保守, 1: 創造性)
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium block mb-1">
                    Max Tokens
                  </label>
                  <input
                    type="number"
                    min="100"
                    max="4000"
                    value={modelSettings.maxTokens}
                    onChange={(e) =>
                      onSettingsChange({
                        ...modelSettings,
                        maxTokens: Number(e.target.value),
                      })
                    }
                    className="w-full p-2 border rounded"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    控回應的最大長度 (100-4000)
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium block mb-1">
                    Top P: {modelSettings.topP}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={modelSettings.topP}
                    onChange={(e) =>
                      onSettingsChange({
                        ...modelSettings,
                        topP: Number(e.target.value),
                      })
                    }
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500 mt-1">控制回應的多樣性</p>
                </div>

                <div>
                  <label className="text-sm font-medium block mb-1">
                    Frequency Penalty
                  </label>
                  <input
                    type="number"
                    min="-2"
                    max="2"
                    step="0.1"
                    value={modelSettings.frequencyPenalty}
                    onChange={(e) =>
                      onSettingsChange({
                        ...modelSettings,
                        frequencyPenalty: Number(e.target.value),
                      })
                    }
                    className="w-full p-2 border rounded"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    控制詞彙重複的懲罰程度 (-2 到 2)
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium block mb-1">Seed</label>
                  <input
                    type="number"
                    min="0"
                    value={modelSettings.seed}
                    onChange={(e) =>
                      onSettingsChange({
                        ...modelSettings,
                        seed: Number(e.target.value),
                      })
                    }
                    className="w-full p-2 border rounded"
                  />
                  <p className="text-xs text-gray-500 mt-1">控制隨機性種子</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RAG 設定面板 */}
        <div 
          className="bg-white rounded-lg p-4 shadow-sm mt-4 cursor-pointer"
          onClick={() => setShowRAGSettings(!showRAGSettings)}  // 添加點擊事件
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">RAG 設定</h3>
            <button
              onClick={(e) => {
                e.stopPropagation();  // 防止事件冒泡
                setShowRAGSettings(!showRAGSettings);
              }}
              className={`p-2 rounded-full ${
                showRAGSettings ? "bg-blue-100" : "hover:bg-gray-100"
              }`}
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>

          {showRAGSettings && (
            <div onClick={(e) => e.stopPropagation()}>  {/* 防止設定內容的點擊事件冒泡 */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium block mb-1">
                    Top K: {modelSettings.topK_RAG}
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="1"
                    value={modelSettings.topK_RAG}
                    onChange={(e) =>
                      onSettingsChange({
                        ...modelSettings,
                        topK_RAG: Number(e.target.value),
                      })
                    }
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500 mt-1">檢索相關文件的數量</p>
                </div>

                <div>
                  <label className="text-sm font-medium block mb-1">
                    相似度閾值: {modelSettings.similarityThreshold}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={modelSettings.similarityThreshold}
                    onChange={(e) =>
                      onSettingsChange({
                        ...modelSettings,
                        similarityThreshold: Number(e.target.value),
                      })
                    }
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500 mt-1">文件相關性的最低門檻</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
