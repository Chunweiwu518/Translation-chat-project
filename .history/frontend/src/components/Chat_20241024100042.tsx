import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronUp, Settings, Database, PlusCircle, Trash2, RefreshCw, Paperclip } from 'lucide-react';
import { Message, ModelSettings } from '../types';

interface ChatProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
  onClearChat: () => void;
  currentKnowledgeBaseName: string;
  modelSettings: ModelSettings;
  onSettingsChange: (settings: ModelSettings) => void;
  knowledgeBases: Array<{ id: string; name: string; description: string }>;
  currentKnowledgeBase: string;
  onSwitchKnowledgeBase: (id: string) => void;
  onCreateKnowledgeBase: (name: string, description: string) => void;
  onResetKnowledgeBase: (id: string) => void;
  onDeleteKnowledgeBase: (id: string) => void;
  onUploadAndEmbed: (file: File, needTranslation: boolean) => Promise<void>;
}

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
}) => {const [input, setInput] = useState('');
  const [expandedMessageId, setExpandedMessageId] = useState<number | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showKnowledgeBaseSettings, setShowKnowledgeBaseSettings] = useState(false);
  const [showNewKBForm, setShowNewKBForm] = useState(false);
  const [newKBName, setNewKBName] = useState('');
  const [newKBDescription, setNewKBDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSendMessage(input);
      setInput('');
    }
  };

  const handleCreateKB = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newKBName.trim()) {
      await onCreateKnowledgeBase(newKBName, newKBDescription);
      setNewKBName('');
      setNewKBDescription('');
      setShowNewKBForm(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      try {
        const needTranslation = window.confirm('是否需要翻譯此文件？');
        await onUploadAndEmbed(file, needTranslation);
      } catch (error) {
        console.error('文件上傳失敗:', error);
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    }
  };return (
    <div className="flex h-full gap-4">
      {/* 主要聊天區域 */}
      <div className="flex-1 border rounded-lg bg-white flex flex-col">
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
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`max-w-[80%] ${
                msg.sender === 'user' ? 'ml-auto' : 'mr-auto'
              }`}
            >
              <div
                className={`rounded-lg ${
                  msg.sender === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100'
                }`}
              >
                <div className="p-3">{msg.text}</div>
                {msg.sender === 'system' && msg.chunks && (
                  <div 
                    className="px-3 py-1 text-sm text-gray-500 border-t border-gray-200 flex justify-between items-center cursor-pointer hover:bg-gray-50"
                    onClick={() => setExpandedMessageId(
                      expandedMessageId === idx ? null : idx
                    )}
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
              {msg.sender === 'system' && msg.chunks && expandedMessageId === idx && (
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
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSubmit} className="p-4 border-t">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="輸入訊息..."
              className="flex-1 p-2 border rounded-lg"
            />
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileUpload}
              className="hidden"
              accept=".pdf,.txt,.docx"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg"
              disabled={isUploading}
            >
              <Paperclip className="w-5 h-5" />
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              disabled={isUploading}
            >
              發送
            </button>
          </div>
        </form>
      </div>{/* 右側邊欄 */}
      <div className="w-80 space-y-4">
        {/* 知識庫選擇 */}
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">知識庫管理</h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowNewKBForm(!showNewKBForm)}
                className="p-2 rounded-full hover:bg-gray-100"
                title="新增知識庫"
              >
                <PlusCircle className="w-5 h-5" />
              </button>
              <button
                onClick={() => setShowKnowledgeBaseSettings(!showKnowledgeBaseSettings)}
                className={`p-2 rounded-full ${
                  showKnowledgeBaseSettings ? 'bg-blue-100' : 'hover:bg-gray-100'
                }`}
              >
                <Database className="w-5 h-5" />
              </button>
            </div>
          </div>

          {showNewKBForm && (
            <div className="mb-4 p-3 bg-gray-50 rounded">
              <form onSubmit={handleCreateKB}>
                <input
                  type="text"
                  value={newKBName}
                  onChange={(e) => setNewKBName(e.target.value)}
                  placeholder="知識庫名稱"
                  className="w-full p-2 border rounded mb-2"
                  required
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
                    onClick={() => setShowNewKBForm(false)}
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
            </div>
          )}

          {showKnowledgeBaseSettings && (
            <div className="space-y-2">
              {knowledgeBases.map((kb) => (
                <div
                  key={kb.id}
                  className={`p-2 rounded group relative ${
                    kb.id === currentKnowledgeBase
                      ? 'bg-blue-50 border-blue-200'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{kb.name}</div>
                      {kb.description && (
                        <div className="text-xs text-gray-500 truncate">
                          {kb.description}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => onSwitchKnowledgeBase(kb.id)}
                        className="p-1 rounded hover:bg-blue-100 text-blue-500"
                        title="使用此知識庫"
                      >
                        <Database className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onResetKnowledgeBase(kb.id)}
                        className="p-1 rounded hover:bg-yellow-100 text-yellow-500"
                        title="重置知識庫"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                      {kb.id !== 'default' && (
                        <button
                          onClick={() => {
                            if (window.confirm('確定要刪除此知識庫嗎？此操作無法恢復。')) {
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
        </div>{/* 模型設定 */}
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">模型設定</h3>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2 rounded-full ${
                showSettings ? 'bg-blue-100' : 'hover:bg-gray-100'
              }`}
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
          
          {showSettings && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium block mb-1">模型</label>
                <select
                  value={modelSettings.model}
                  onChange={(e) => onSettingsChange({
                    ...modelSettings,
                    model: e.target.value
                  })}
                  className="w-full p-2 text-sm border rounded"
                >
                  <option value="llama3.1-ffm-70b-32k-chat">llama3.1-70B-32k</option>
                  <option value="llama3-ffm-70b-chat">llama3-70B</option>
                  <option value="ffm-mixtral-8x7b-32k-instruct">mixtral-8x7B-32k</option>
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
                  onChange={(e) => onSettingsChange({
                    ...modelSettings,
                    temperature: Number(e.target.value)
                  })}
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-1">控制回應的創造性 (0: 保守, 1: 創造性)</p>
              </div>

              <div>
                <label className="text-sm font-medium block mb-1">Max Tokens</label>
                <input
                  type="number"
                  min="100"
                  max="4000"
                  value={modelSettings.maxTokens}
                  onChange={(e) => onSettingsChange({
                    ...modelSettings,
                    maxTokens: Number(e.target.value)
                  })}
                  className="w-full p-2 border rounded"
                />
                <p className="text-xs text-gray-500 mt-1">控制回應的最大長度 (100-4000)</p>
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
                  onChange={(e) => onSettingsChange({
                    ...modelSettings,
                    topP: Number(e.target.value)
                  })}
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-1">控制回應的多樣性</p>
              </div>

              <div>
                <label className="text-sm font-medium block mb-1">Frequency Penalty</label>
                <input
                  type="number"
                  min="-2"
                  max="2"
                  step="0.1"
                  value={modelSettings.frequencyPenalty}
                  onChange={(e) => onSettingsChange({
                    ...modelSettings,
                    frequencyPenalty: Number(e.target.value)
                  })}
                  className="w-full p-2 border rounded"
                />
                <p className="text-xs text-gray-500 mt-1">控制詞彙重複的懲罰程度 (-2 到 2)</p>
              </div>

              <div>
                <label className="text-sm font-medium block mb-1">Seed</label>
                <input
                  type="number"
                  min="0"
                  value={modelSettings.seed}
                  onChange={(e) => onSettingsChange({
                    ...modelSettings,
                    seed: Number(e.target.value)
                  })}
                  className="w-full p-2 border rounded"
                />
                <p className="text-xs text-gray-500 mt-1">控制隨機性種子</p>
              </div>

              <div>
                <label className="text-sm font-medium block mb-1">
                  Top K: {modelSettings.topK}
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value={modelSettings.topK}
                  onChange={(e) => onSettingsChange({
                    ...modelSettings,
                    topK: Number(e.target.value)
                  })}
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
                  onChange={(e) => onSettingsChange({
                    ...modelSettings,
                    similarityThreshold: Number(e.target.value)
                  })}
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-1">文件相關性的最低門檻</p>
              </div>

              {/* 當前設定預覽 */}
              <div className="mt-4 p-4 bg-gray-50 rounded">
                <h4 className="font-medium mb-2">當前設定</h4>
                <pre className="text-sm text-gray-600 whitespace-pre-wrap">
                  {JSON.stringify({
                    model: modelSettings.model,
                    temperature: modelSettings.temperature,
                    maxTokens: modelSettings.maxTokens,
                    topP: modelSettings.topP,
                    frequencyPenalty: modelSettings.frequencyPenalty,
                    seed: modelSettings.seed,
                    topK: modelSettings.topK,
                    similarityThreshold: modelSettings.similarityThreshold
                  }, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};