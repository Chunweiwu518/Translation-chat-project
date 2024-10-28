import React, { useState } from "react";
import { Sidebar } from "./components/Sidebar";
import { FileUpload } from "./components/FileUpload";
import { Chat } from "./components/Chat";
import { TranslatedFiles } from "./components/TranslatedFiles";
import { BatchFileProcessor } from "./components/BatchFileProcessor";
import { WelcomeChatScreen } from "./components/WelcomeChatScreen"; // 新增此組件
import { useChat } from "./hooks/useChat";
import { useFileProcessing } from "./hooks/useFileProcessing";
import { useKnowledgeBase } from "./hooks/useKnowledgeBase";
import { ModelSettings, TranslateModeProps, ChatModeProps, Message, TranslatedFile } from "./types";
import { FileManager } from './components/FileManager';
import { KnowledgeBaseManager } from './components/KnowledgeBaseManager';
import { TranslatedFilesView } from './components/TranslatedFilesView';

const TranslateMode: React.FC<TranslateModeProps> = ({ fileProcessing, knowledgeBase }) => (
  <div className="max-w-4xl mx-auto">
    <div className="p-6 bg-white rounded-lg shadow-sm">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">上傳檔案</h2>
        <p className="text-gray-500 mb-8">拖拽檔案到此處或點擊上傳</p>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-12">
          <input
            type="file"
            multiple
            onChange={(e) => {
              const files = Array.from(e.target.files || []).map(file => ({
                id: Math.random().toString(),
                file,
                name: file.name,
                needTranslation: true,  // 預設需要翻譯
                status: 'pending' as const,
                progress: 0,
                selected: false
              }));
              fileProcessing.handleFileUpload(files);
            }}
            className="hidden"
            id="fileInput"
          />
          <label
            htmlFor="fileInput"
            className="cursor-pointer inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            選擇檔案
          </label>
          <p className="mt-2 text-sm text-gray-500">
            支援 PDF、TXT、DOCX 格式
          </p>
        </div>
      </div>
    </div>
  </div>
);

const ChatMode: React.FC<ChatModeProps> = ({
  chat,
  knowledgeBase,
  modelSettings,
  onSettingsChange,
}) => {
  if (!chat.currentSession) {
    return (
      <WelcomeChatScreen 
        onCreateNewChat={() => chat.createNewChatSession(knowledgeBase.currentKnowledgeBase)}
      />
    );
  }

  return (
    <div className="h-full">
      <Chat
        messages={chat.messages}
        onSendMessage={(text) => 
          chat.handleSendMessage(
            text, 
            knowledgeBase.currentKnowledgeBase, 
            modelSettings
          )}
        onClearChat={() => chat.setMessages([])}
        currentKnowledgeBaseName={
          knowledgeBase.knowledgeBases.find(
            (kb) => kb.id === knowledgeBase.currentKnowledgeBase
          )?.name || ""
        }
        modelSettings={modelSettings}
        onSettingsChange={onSettingsChange}
        knowledgeBases={knowledgeBase.knowledgeBases}
        currentKnowledgeBase={knowledgeBase.currentKnowledgeBase}
        onSwitchKnowledgeBase={knowledgeBase.setCurrentKnowledgeBase}
        onCreateKnowledgeBase={knowledgeBase.createKnowledgeBase}
        onResetKnowledgeBase={knowledgeBase.resetKnowledgeBase}
        onDeleteKnowledgeBase={knowledgeBase.deleteKnowledgeBase}
        onUploadAndEmbed={async (file: File, needTranslation: boolean) => {
          const formData = new FormData();
          formData.append("file", file);
    
          try {
            const uploadEndpoint = needTranslation
              ? "http://localhost:5000/api/upload_and_translate"
              : "http://localhost:5000/api/upload";
    
            const uploadResponse = await fetch(uploadEndpoint, {
              method: "POST",
              body: formData,
            });
    
            if (uploadResponse.ok) {
              const data = await uploadResponse.json();
              const content = needTranslation ? data.translated_content : data.content;
    
              const embedResponse = await fetch("http://localhost:5000/api/embed", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  content: content,
                  filename: file.name,
                  knowledge_base_id: knowledgeBase.currentKnowledgeBase,
                }),
              });
    
              if (embedResponse.ok) {
                const successMessage: Message = {
                  sender: "system",
                  text: `文件 "${file.name}" 已成功添加到知識庫中。`,
                };
                chat.setMessages((prev: Message[]) => [...prev, successMessage]);
              }
            }
          } catch (error) {
            console.error("處理文件時出錯:", error);
            const errorMessage: Message = {
              sender: "system",
              text: `處理文件 "${file.name}" 時出錯。請稍後重試。`,
            };
            chat.setMessages((prev: Message[]) => [...prev, errorMessage]);
          }
        }}
      />
    </div>
  );
};

const App: React.FC = () => {
  // 將初始模式改為 "files"
  const [currentMode, setCurrentMode] = useState("files");
  const [modelSettings, setModelSettings] = useState<ModelSettings>({
    model: "llama3.1-ffm-70b-32k-chat",
    temperature: 0.3,
    maxTokens: 2000,
    topP: 0.3,
    frequencyPenalty: 1,
    seed: 42,
    topK_model: 0.3,
    topK_RAG: 3,
    similarityThreshold: 0.7,
  });

  const knowledgeBase = useKnowledgeBase();
  const fileProcessing = useFileProcessing();
  const chat = useChat();

  // 修改批次翻譯並加入知識庫函數
  const handleBatchTranslateAndEmbed = async (files: string[], knowledgeBaseId: string): Promise<void> => {
    try {
      // 處理每個選中的檔案
      for (const file_path of files) {
        // 從檔案系統讀取檔案內容
        const fileResponse = await fetch(`http://localhost:5000/api/files/content/${file_path}`);
        if (!fileResponse.ok) {
          throw new Error(`無法讀取檔案 ${file_path}`);
        }
        const { content: originalContent } = await fileResponse.json();

        // 創建 FormData 用於翻譯
        const formData = new FormData();
        const blob = new Blob([originalContent], { type: 'text/plain' });
        const fileName = file_path.split('/').pop() || 'file.txt';
        formData.append('file', blob, fileName);

        // 翻譯
        const translateResponse = await fetch(
          'http://localhost:5000/api/upload_and_translate',
          {
            method: 'POST',
            body: formData,
          }
        );

        if (!translateResponse.ok) {
          const errorData = await translateResponse.json();
          throw new Error(`翻譯失敗: ${errorData.detail || '未知錯誤'}`);
        }

        const data = await translateResponse.json();
        
        // 保存翻譯後的文件
        const translatedFormData = new FormData();
        const translatedBlob = new Blob([data.translated_content], { type: 'text/plain' });
        const fileNameWithoutExt = fileName.split('.')[0];
        const fileExt = fileName.split('.').pop();
        const translatedFileName = `${fileNameWithoutExt}_translated.${fileExt}`;
        translatedFormData.append('files', translatedBlob, translatedFileName);
        translatedFormData.append('path', 'translated_files');

        // 上傳翻譯後的文件
        await fetch('http://localhost:5000/api/files/upload', {
          method: 'POST',
          body: translatedFormData,
        });
        
        // 加入知識庫
        const embedResponse = await fetch('http://localhost:5000/api/embed', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: data.translated_content,
            filename: translatedFileName,
            knowledge_base_id: knowledgeBaseId,
          }),
        });

        if (!embedResponse.ok) {
          throw new Error('加入知識庫失敗');
        }

        // 更新翻譯文件檢視
        fileProcessing.setTranslatedFiles(prev => [...prev, {
          id: translatedFileName,
          name: translatedFileName,
          translatedContent: data.translated_content,
          originalContent: originalContent,
          isEmbedded: true,
          embeddingProgress: 100
        }]);
      }
    } catch (error) {
      console.error('處理檔案時出錯:', error);
      throw error;
    }
  };

  // 修改批次直接加入知識庫函數
  const handleBatchEmbed = async (files: string[], knowledgeBaseId: string): Promise<void> => {
    try {
      // 獲取所有檔案的內容
      const fileContents = await Promise.all(
        files.map(async (file_path) => {
          const response = await fetch(`http://localhost:5000/api/files/content/${file_path}`);
          if (!response.ok) {
            throw new Error(`無法讀取檔案 ${file_path} 的內容`);
          }
          return response.json();
        })
      );

      // 將所有檔案內容一次性加入知識庫
      const embedResponse = await fetch('http://localhost:5000/api/embed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: fileContents.map(data => data.content),
          filename: files.join(', '),  // 所有檔案名稱
          knowledge_base_id: knowledgeBaseId,
        }),
      });

      if (!embedResponse.ok) {
        throw new Error('加入知識庫失敗');
      }
    } catch (error) {
      console.error('處理檔案時出錯:', error);
      throw error;
    }
  };

  // 添加檔案對話處理函數
  const handleFileChat = async (files: string[]) => {
    // 創建新的對話會話
    chat.createNewChatSession(knowledgeBase.currentKnowledgeBase);
    
    // 可以在這裡添加一些初始化訊息
    const systemMessage: Message = {
      sender: "system",
      text: `已載入 ${files.length} 個檔案，您可以開始詢問相關問題。`,
    };
    chat.setMessages([systemMessage]);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        currentMode={currentMode}
        onModeChange={setCurrentMode}
        chatSessions={chat.chatSessions}
        onLoadSession={chat.handleLoadSession}
        onDeleteSession={chat.handleDeleteSession}
        onCreateSession={() => 
          chat.createNewChatSession(knowledgeBase.currentKnowledgeBase)}
        translatedFiles={fileProcessing.translatedFiles}
      />

      <div className="flex-1 ml-64 p-6">
        {currentMode === "files" ? (
          <FileManager
            knowledgeBases={knowledgeBase.knowledgeBases}
            onBatchTranslateAndEmbed={handleBatchTranslateAndEmbed}
            onBatchEmbed={handleBatchEmbed}
            onModeChange={setCurrentMode}
            onFileChat={handleFileChat}
          />
        ) : currentMode === "knowledge-base" ? (
          <KnowledgeBaseManager
            knowledgeBases={knowledgeBase.knowledgeBases}
            currentKnowledgeBase={knowledgeBase.currentKnowledgeBase}
            onCreateNew={knowledgeBase.createKnowledgeBase}
            onSwitch={knowledgeBase.setCurrentKnowledgeBase}
            onReset={knowledgeBase.resetKnowledgeBase}
            onDelete={knowledgeBase.deleteKnowledgeBase}
          />
        ) : currentMode === "chat" ? (
          <ChatMode
            chat={chat}
            knowledgeBase={knowledgeBase}
            modelSettings={modelSettings}
            onSettingsChange={setModelSettings}
          />
        ) : currentMode === "translated-files" ? (
          <TranslatedFilesView 
            files={fileProcessing.translatedFiles} 
            onDelete={(fileId) => {
              fileProcessing.setTranslatedFiles(prev => 
                prev.filter(file => file.id !== fileId)
              );
            }}
          />
        ) : null}
      </div>
    </div>
  );
};

export default App;
