import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronUp, Trash2, Settings, Database } from 'lucide-react';
import { Message, ModelSettings, TranslatedFile } from '../types';

interface KnowledgeBase {
  id: string;
  name: string;
  description: string;
}

interface ChatProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
  onClearChat: () => void;
  currentKnowledgeBaseName: string;
  modelSettings: ModelSettings;
  onSettingsChange: (settings: ModelSettings) => void;
  translatedFiles: TranslatedFile[];
  onDeleteFile: (fileId: string) => void;
  knowledgeBases: KnowledgeBase[];
  currentKnowledgeBase: string;
  onSwitchKnowledgeBase: (id: string) => void;
  onResetKnowledgeBase: (id: string) => void;
}

export const Chat: React.FC<ChatProps> = ({
  messages,
  onSendMessage,
  onClearChat,
  currentKnowledgeBaseName,
  modelSettings,
  onSettingsChange,
  translatedFiles,
  onDeleteFile,
  knowledgeBases,
  currentKnowledgeBase,
  onSwitchKnowledgeBase,
  onResetKnowledgeBase,
}) => {
  const [input, setInput] = useState('');
  const [expandedMessageId, setExpandedMessageId] = useState<number | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showKnowledgeBaseSettings, setShowKnowledgeBaseSettings] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentFiles = translatedFiles.filter(file => file.isEmbedded);

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

  const toggleExpand = (index: number) => {
    setExpandedMessageId(expandedMessageId === index ? null : index);
  };

  return (
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
          <button
            onClick={onClearChat}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-full"
            title="清除對話"
          >
            <Trash2 className="w-5 h-5" />
          </button>
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
                    className="px-3 py-1 text-sm text-gray-500 border-t border-gray-200 flex justify-between items-center cursor-pointer hover:bg-gray-50 rounded-b-lg"
                    onClick={() => toggleExpand(idx)}
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
                      <div className="font-medium text-gray-700 mb-1">參考段落 {i + 1}:</div>
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
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              發送
            </button>
          </div>
        </form>
      </div>

      {/* 右側邊欄 */}
      <div className="w-80 space-y-4">
        {/* 知識庫選擇 */}
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">知識庫選擇</h3>
            <button
              onClick={() => setShowKnowledgeBaseSettings(!showKnowledgeBaseSettings)}
              className={`p-2 rounded-full ${showKnowledgeBaseSettings ? 'bg-blue-100' : 'hover:bg-gray-100'}`}
            >
              <Database className="w-5 h-5" />
            </button>
          </div>
          
          {showKnowledgeBaseSettings && (
            <div className="space-y-2">
              {knowledgeBases.map((kb) => (
                <div
                  key={kb.id}
                  className={`p-2 rounded flex items-center justify-between ${
                    kb.id === currentKnowledgeBase
                      ? 'bg-blue-50 border-blue-200'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{kb.name}</div>
                    {kb.description && (
                      <div className="text-xs text-gray-500 truncate">
                        {kb.description}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 ml-2">
                    <button
                      onClick={() => onSwitchKnowledgeBase(kb.id)}
                      className="text-xs px-2 py-1 rounded bg-blue-500 text-white"
                    >
                      切換
                    </button>
                    <button
                      onClick={() => onResetKnowledgeBase(kb.id)}
                      className="text-xs px-2 py-1 rounded bg-yellow-500 text-white"
                    >
                      重置
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 知識庫文件 */}
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <h3 className="font-semibold mb-4">知識庫文件</h3>
          <div className="space-y-2 max-h-[200px] overflow-y-auto">
            {currentFiles.length === 0 ? (
              <p className="text-sm text-gray-500">尚無文件</p>
            ) : (
              currentFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded hover:bg-gray-100 group"
                >
                  <span className="text-sm truncate flex-1 mr-2" title={file.name}>
                    {file.name}
                  </span>
                  <button
                    onClick={() => onDeleteFile(file.id)}
                    className="p-1 text-red-500 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    title="刪除文件"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 模型設定 */}
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">模型設定</h3>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2 rounded-full ${showSettings ? 'bg-blue-100' : 'hover:bg-gray-100'}`}
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
              </div>

              <div>
                <label className="text-sm font-medium block mb-1">
                  Max Tokens: {modelSettings.maxTokens}
                </label>
                <input
                  type="range"
                  min="100"
                  max="4000"
                  step="100"
                  value={modelSettings.maxTokens}
                  onChange={(e) => onSettingsChange({
                    ...modelSettings,
                    maxTokens: Number(e.target.value)
                  })}
                  className="w-full"
                />
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
              </div>

              <div>
                <label className="text-sm font-medium block mb-1">
                  Frequency Penalty: {modelSettings.frequencyPenalty}
                </label>
                <input
                  type="range"
                  min="-2"
                  max="2"
                  step="0.1"
                  value={modelSettings.frequencyPenalty}
                  onChange={(e) => onSettingsChange({
                    ...modelSettings,
                    frequencyPenalty: Number(e.target.value)
                  })}
                  className="w-full"
                />
              </div>

              <div>
                <label className="text-sm font-medium block mb-1">
                  Seed: {modelSettings.seed}
                </label>
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
              </div>

              <div>
                <label className="text-sm font-medium block mb-1">
                  相似度閾值: {modelSettings.similarityThreshold}
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={modelSettings.similarityThreshold}
                  onChange={(e) => onSettingsChange({
                    ...modelSettings,
                    similarityThreshold: Number(e.target.value)
                  })}
                  className="w-full"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};