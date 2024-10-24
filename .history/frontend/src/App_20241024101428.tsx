import React, { useState, useEffect } from "react";
import { Sidebar } from "./components/Sidebar";
import { FileUpload } from "./components/FileUpload";
import { Chat } from "./components/Chat";
import { TranslatedFiles } from "./components/TranslatedFiles";
import { BatchFileProcessor } from "./components/BatchFileProcessor";
import {
  FileWithOptions,
  Message,
  TranslatedFile,
  ModelSettings,
  ChatSession,
} from "./types";

interface KnowledgeBaseInfo {
  id: string;
  name: string;
  description: string;
}

const App: React.FC = () => {
  // 基本狀態
  const [currentMode, setCurrentMode] = useState("translate");
  const [messages, setMessages] = useState<Message[]>([]);
  const [uploadProgress, setUploadProgress] = useState<{
    [key: string]: number;
  }>({});
  const [translatedFiles, setTranslatedFiles] = useState<TranslatedFile[]>([]);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<string | null>(null);

  // 知識庫狀態
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBaseInfo[]>([
    { id: "default", name: "預設知識庫", description: "預設的知識庫" },
  ]);
  const [currentKnowledgeBase, setCurrentKnowledgeBase] = useState("default");

  // 模型設定
  const [modelSettings, setModelSettings] = useState<ModelSettings>({
    model: "llama3.1-ffm-70b-32k-chat",
    temperature: 0.7,
    maxTokens: 2000,
    topP: 0.9,
    frequencyPenalty: 0.0,
    seed: 42,
    topK_model: 0.3,
    topK_RAG: 3,
    similarityThreshold: 0.7,
  });
  useEffect(() => {
    fetchKnowledgeBases();
  }, []);

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

  const handleFileUpload = async (files: FileWithOptions[]) => {
    for (const file of files) {
      setUploadProgress((prev) => ({
        ...prev,
        [file.name]: 0,
      }));

      try {
        const formData = new FormData();
        formData.append("file", file.file);

        // 根據是否需要翻譯選擇不同的端點
        const endpoint = file.needTranslation
          ? "http://localhost:5000/api/upload_and_translate"
          : "http://localhost:5000/api/upload";

        const response = await fetch(endpoint, {
          method: "POST",
          body: formData,
        });

        if (response.ok) {
          const data = await response.json();
          const newFile: TranslatedFile = {
            id: file.id,
            name: file.name,
            translatedContent: file.needTranslation
              ? data.translated_content
              : data.content,
            originalContent: !file.needTranslation ? data.content : undefined,
            isEmbedded: false,
          };

          setTranslatedFiles((prev) => [...prev, newFile]);
          setUploadProgress((prev) => ({ ...prev, [file.name]: 100 }));
        }
      } catch (error) {
        console.error(`處理文件錯誤 (${file.name}):`, error);
      } finally {
        setTimeout(() => {
          setUploadProgress((prev) => {
            const newProgress = { ...prev };
            delete newProgress[file.name];
            return newProgress;
          });
        }, 1000);
      }
    }
  };

  const handleUploadAndEmbed = async (file: File, needTranslation: boolean) => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      // 根據是否需要翻譯選擇不同的端點
      const uploadEndpoint = needTranslation
        ? "http://localhost:5000/api/upload_and_translate"
        : "http://localhost:5000/api/upload";

      const uploadResponse = await fetch(uploadEndpoint, {
        method: "POST",
        body: formData,
      });

      if (uploadResponse.ok) {
        const data = await uploadResponse.json();
        const content = needTranslation
          ? data.translated_content
          : data.content;

        // 直接進行 embedding
        const embedResponse = await fetch("http://localhost:5000/api/embed", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content: content,
            filename: file.name,
            knowledge_base_id: currentKnowledgeBase,
          }),
        });

        if (embedResponse.ok) {
          // 添加一個系統消息通知用戶
          setMessages((prev) => [
            ...prev,
            {
              sender: "system",
              text: `文件 "${file.name}" 已成功添加到知識庫中。`,
            },
          ]);
        }
      }
    } catch (error) {
      console.error("處理文件時出錯:", error);
      setMessages((prev) => [
        ...prev,
        {
          sender: "system",
          text: `處理文件 "${file.name}" 時出錯。請稍後重試。`,
        },
      ]);
    }
  };

  const handleBatchEmbed = async (
    fileIds: string[],
    targetKnowledgeBaseId: string
  ) => {
    for (const fileId of fileIds) {
      const file = translatedFiles.find((f) => f.id === fileId);
      if (!file) continue;

      try {
        setTranslatedFiles((prev) =>
          prev.map((f) =>
            f.id === fileId ? { ...f, embeddingProgress: 0 } : f
          )
        );

        const response = await fetch("http://localhost:5000/api/embed", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content: file.translatedContent || file.originalContent,
            filename: file.name,
            knowledge_base_id: targetKnowledgeBaseId,
          }),
        });

        if (response.ok) {
          for (let progress = 0; progress <= 100; progress += 10) {
            setTranslatedFiles((prev) =>
              prev.map((f) =>
                f.id === fileId ? { ...f, embeddingProgress: progress } : f
              )
            );
            await new Promise((resolve) => setTimeout(resolve, 100));
          }

          setTranslatedFiles((prev) =>
            prev.map((f) =>
              f.id === fileId
                ? {
                    ...f,
                    isEmbedded: true,
                    knowledgeBaseId: targetKnowledgeBaseId,
                  }
                : f
            )
          );
        }
      } catch (error) {
        console.error("Embedding 錯誤:", error);
      }
    }
  };
  const createNewChatSession = () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: "新對話",
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      knowledgeBaseId: currentKnowledgeBase,
    };
    setChatSessions((prev) => [newSession, ...prev]);
    setCurrentSession(newSession.id);
    setMessages([]);
  };

  const handleSendMessage = async (text: string) => {
    if (!currentSession) {
      createNewChatSession();
    }

    const userMessage = { sender: "user" as const, text };
    setMessages((prev) => [...prev, userMessage]);

    try {
      const response = await fetch("http://localhost:5000/api/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: text,
          knowledge_base_id: currentKnowledgeBase,
          model_settings: {
            model_name: modelSettings.model,
            parameters: {
              temperature: modelSettings.temperature,
              max_tokens: modelSettings.maxTokens,
              top_p: modelSettings.topP,
              frequency_penalty: modelSettings.frequencyPenalty,
              seed: modelSettings.seed,
              topK_model: modelSettings.topK_model,
              topK_RAG: modelSettings.topK_RAG,
              similarityThreshold: modelSettings.similarityThreshold,
            },
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const systemMessage = {
          sender: "system" as const,
          text: data.answer,
          chunks: data.relevant_chunks,
        };

        setMessages((prev) => [...prev, systemMessage]);

        // 更新當前會話
        setChatSessions((prev) =>
          prev.map((session) =>
            session.id === currentSession
              ? {
                  ...session,
                  messages: [...session.messages, userMessage, systemMessage],
                  updatedAt: new Date(),
                }
              : session
          )
        );
      }
    } catch (error) {
      console.error("查詢錯誤:", error);
      setMessages((prev) => [
        ...prev,
        {
          sender: "system",
          text: "抱歉，處理您的問題時出現錯誤。請稍後重試。",
        },
      ]);
    }
  };

  const handleLoadSession = (sessionId: string) => {
    const session = chatSessions.find((s) => s.id === sessionId);
    if (session) {
      setCurrentSession(sessionId);
      setMessages(session.messages);
      setCurrentKnowledgeBase(session.knowledgeBaseId);
    }
  };

  const handleDeleteSession = (sessionId: string) => {
    setChatSessions((prev) => prev.filter((s) => s.id !== sessionId));
    if (currentSession === sessionId) {
      setCurrentSession(null);
      setMessages([]);
    }
  };

  const handleDeleteKnowledgeBase = async (id: string) => {
    if (!window.confirm('確定要刪除此知識庫嗎？此操作無法恢復。')) {
      return;
    }
  
    try {
      // 添加載入狀態
      setMessages(prev => [...prev, {
        sender: 'system',
        text: '正在刪除知識庫...'
      }]);
  
      const response = await fetch(`http://localhost:5000/api/knowledge_base/${id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        // 如果刪除的是當前知識庫，切換到默認知識庫
        if (id === currentKnowledgeBase) {
          setCurrentKnowledgeBase('default');
          setMessages([]);
        }
        
        // 更新已嵌入文件的列表
        setTranslatedFiles(prev => 
          prev.filter(file => file.knowledgeBaseId !== id)
        );
        
        // 重新獲取知識庫列表
        await fetchKnowledgeBases();
        
        setMessages(prev => [...prev, {
          sender: 'system',
          text: '知識庫已成功刪除。'
        }]);
      } else {
        // 如果響應不成功，嘗試讀取錯誤信息
        let errorMessage = '刪除知識庫失敗';
        try {
          const errorData = await response.json();
          errorMessage = `刪除知識庫失敗: ${errorData.detail || '未知錯誤'}`;
        } catch {
          errorMessage = `刪除知識庫失敗: HTTP ${response.status}`;
        }
        
        setMessages(prev => [...prev, {
          sender: 'system',
          text: errorMessage
        }]);
      }
    } catch (error) {
      console.error('刪除知識庫出錯:', error);
      setMessages(prev => [...prev, {
        sender: 'system',
        text: '刪除知識庫時發生錯誤，請稍後重試。'
      }]);
    }
  };

  const handleResetKnowledgeBase = async (id: string) => {
    if (
      window.confirm("確定要重置此知識庫嗎？所有檔案將被移除，此操作無法恢復。")
    ) {
      try {
        const response = await fetch(
          `http://localhost:5000/api/knowledge_base/reset/${id}`,
          {
            method: "POST",
          }
        );

        if (response.ok) {
          // 如果重置的是當前知識庫，清空對話
          if (id === currentKnowledgeBase) {
            setMessages([]);
          }
          // 更新已嵌入文件的列表
          setTranslatedFiles((prev) =>
            prev.filter((file) => file.knowledgeBaseId !== id)
          );
        }
      } catch (error) {
        console.error("重置知識庫失敗:", error);
      }
    }
  };
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
        {currentMode === "translate" && (
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
                    onEmbed={(fileId) =>
                      handleBatchEmbed([fileId], currentKnowledgeBase)
                    }
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

        {currentMode === "chat" && (
          <div className="h-full">
            <Chat
              messages={messages}
              onSendMessage={handleSendMessage}
              onClearChat={() => setMessages([])}
              currentKnowledgeBaseName={
                knowledgeBases.find((kb) => kb.id === currentKnowledgeBase)
                  ?.name || ""
              }
              modelSettings={modelSettings}
              onSettingsChange={setModelSettings}
              knowledgeBases={knowledgeBases}
              currentKnowledgeBase={currentKnowledgeBase}
              onSwitchKnowledgeBase={setCurrentKnowledgeBase}
              onCreateKnowledgeBase={async (name, description) => {
                try {
                  const response = await fetch(
                    "http://localhost:5000/api/knowledge_base",
                    {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({ name, description }),
                    }
                  );
                  if (response.ok) {
                    fetchKnowledgeBases();
                  }
                } catch (error) {
                  console.error("創建知識庫失敗:", error);
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
