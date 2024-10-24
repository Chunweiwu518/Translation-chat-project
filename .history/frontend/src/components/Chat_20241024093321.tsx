import React, { useState, useRef, useEffect } from "react";
import {
  ChevronDown,
  ChevronUp,
  Settings,
  Database,
  PlusCircle,
  Trash2,
  RefreshCw,
  Paperclip,
} from "lucide-react";
import { Message, ModelSettings, FileWithOptions } from "../types";
import { Settings as SettingsPanel } from "./Settings";

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
}) => {
  const [input, setInput] = useState("");
  const [expandedMessageId, setExpandedMessageId] = useState<number | null>(
    null
  );
  const [showSettings, setShowSettings] = useState(false);
  const [showKnowledgeBaseSettings, setShowKnowledgeBaseSettings] =
    useState(false);
  const [showNewKBForm, setShowNewKBForm] = useState(false);
  const [newKBName, setNewKBName] = useState("");
  const [newKBDescription, setNewKBDescription] = useState("");
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
      setInput("");
    }
  };

  const handleCreateKB = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newKBName.trim()) {
      await onCreateKnowledgeBase(newKBName, newKBDescription);
      setNewKBName("");
      setNewKBDescription("");
      setShowNewKBForm(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      try {
        // 這裡可以添加一個確認對話框詢問是否需要翻譯
        const needTranslation = window.confirm("是否需要翻譯此文件？");
        await onUploadAndEmbed(file, needTranslation);
      } catch (error) {
        console.error("文件上傳失敗:", error);
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    }
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
      </div>

      return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar 
        onModeChange={setCurrentMode} 
        currentMode={currentMode}
        chatSessions={chatSessions}
        onLoadSession={handleLoadSession}
        onDeleteSession={handleDeleteSession}
        onCreateSession={createNewChatSession}
      />
      
      <div className="flex-1 ml-64 p-6">
        {currentMode === 'translate' && (
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-4">上傳檔案</h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <FileUpload
                  onFileUpload={handleFileUpload}
                  uploadProgress={uploadProgress}
                />
                {translatedFiles.length > 0 && (
                  <TranslatedFiles
                    files={translatedFiles}
                    onEmbed={(fileId) => handleBatchEmbed([fileId], currentKnowledgeBase)}
                  />
                )}
              </div>
              <div>
                <BatchFileProcessor
                  files={translatedFiles}
                  knowledgeBases={knowledgeBases}
                  onBatchEmbed={handleBatchEmbed}
                />
              </div>
            </div>
          </div>
        )}
        
        {currentMode === 'chat' && (
          <div className="h-full">
            <Chat
              messages={messages}
              onSendMessage={handleSendMessage}
              onClearChat={() => setMessages([])}
              currentKnowledgeBaseName={knowledgeBases.find(kb => kb.id === currentKnowledgeBase)?.name || ''}
              modelSettings={modelSettings}
              onSettingsChange={setModelSettings}
              knowledgeBases={knowledgeBases}
              currentKnowledgeBase={currentKnowledgeBase}
              onSwitchKnowledgeBase={setCurrentKnowledgeBase}
              onCreateKnowledgeBase={async (name, description) => {
                try {
                  const response = await fetch('http://localhost:5000/api/knowledge_base', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ name, description })
                  });
                  if (response.ok) {
                    fetchKnowledgeBases();
                  }
                } catch (error) {
                  console.error('創建知識庫失敗:', error);
                }
              }}
              onResetKnowledgeBase={handleResetKnowledgeBase}
              onDeleteKnowledgeBase={handleDeleteKnowledgeBase}
              onUploadAndEmbed={handleUploadAndEmbed}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
        {/* 模型設定 */}
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">模型設定</h3>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2 rounded-full ${
                showSettings ? "bg-blue-100" : "hover:bg-gray-100"
              }`}
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>

          {showSettings && (
            <SettingsPanel
              currentModel={modelSettings.model}
              temperature={modelSettings.temperature}
              maxTokens={modelSettings.maxTokens}
              topP={modelSettings.topP}
              frequencyPenalty={modelSettings.frequencyPenalty}
              seed={modelSettings.seed}
              topK={modelSettings.topK}
              similarityThreshold={modelSettings.similarityThreshold}
              onSettingsChange={onSettingsChange}
            />
          )}
        </div>
      </div>
    </div>
  );
};
