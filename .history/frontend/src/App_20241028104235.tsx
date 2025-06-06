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
import { ModelSettings, TranslateModeProps, ChatModeProps, Message } from "./types";
import { FileManager } from './components/FileManager';

const TranslateMode: React.FC<TranslateModeProps> = ({ fileProcessing, knowledgeBase }) => (
  <div className="max-w-4xl mx-auto">
    <h2 className="text-2xl font-bold mb-4">上傳檔案</h2>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2">
        <FileUpload
          onFileUpload={fileProcessing.handleFileUpload}
          uploadProgress={fileProcessing.uploadProgress}
        />
        {fileProcessing.translatedFiles.length > 0 && (
          <TranslatedFiles
            files={fileProcessing.translatedFiles}
            onEmbed={(fileId) => 
              fileProcessing.handleBatchEmbed(
                [fileId], 
                knowledgeBase.currentKnowledgeBase
              )}
          />
        )}
      </div>
      <div>
        <BatchFileProcessor
          files={fileProcessing.translatedFiles}
          knowledgeBases={knowledgeBase.knowledgeBases}
          onBatchEmbed={fileProcessing.handleBatchEmbed}
        />
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
  const [currentMode, setCurrentMode] = useState("translate");
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

  const knowledgeBase = useKnowledgeBase();
  const fileProcessing = useFileProcessing();
  const chat = useChat();

  // 修改批次翻譯並加入知識庫函數
  const handleBatchTranslateAndEmbed = async (files: string[], knowledgeBaseId: string): Promise<void> => {
    try {
      // 獲取原始檔案
      const file_path = files[0]; // 先處理單個檔案
      const formData = new FormData();
      
      // 從檔案系統讀取檔案內容
      const fileResponse = await fetch(`http://localhost:5000/api/files/content/${file_path}`);
      if (!fileResponse.ok) {
        throw new Error('無法讀取檔案內容');
      }
      const fileBlob = await fileResponse.blob();
      formData.append('file', fileBlob, file_path.split('/').pop());

      // 上傳並翻譯
      const translateResponse = await fetch(
        'http://localhost:5000/api/upload_and_translate',
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!translateResponse.ok) {
        throw new Error('翻譯失敗');
      }

      const data = await translateResponse.json();
      
      // 加入知識庫
      const embedResponse = await fetch('http://localhost:5000/api/embed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: data.translated_content,
          filename: file_path,
          knowledge_base_id: knowledgeBaseId,
        }),
      });

      if (!embedResponse.ok) {
        throw new Error('加入知識庫失敗');
      }

      // 更新翻譯界面的檔案列表
      fileProcessing.setTranslatedFiles((prevFiles: TranslatedFile[]) => [...prevFiles, {
        id: file_path,
        name: file_path.split('/').pop() || '',
        translatedContent: data.translated_content,
        originalContent: data.content,
        isEmbedded: true,
        embeddingProgress: 100
      }]);

    } catch (error) {
      console.error('處理檔案時出錯:', error);
      throw error;
    }
  };

  // 修改批次直接加入知識庫函數
  const handleBatchEmbed = async (files: string[], knowledgeBaseId: string): Promise<void> => {
    try {
      const file_path = files[0];
      
      // 獲取檔案內容
      const response = await fetch(`http://localhost:5000/api/files/content/${file_path}`);
      if (!response.ok) {
        throw new Error('無法讀取檔案內容');
      }
      
      const content = await response.text();
      
      // 加入知識庫
      const embedResponse = await fetch('http://localhost:5000/api/embed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: content,
          filename: file_path,
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
      />

      <div className="flex-1 ml-64 p-6">
        {currentMode === "translate" ? (
          <TranslateMode
            fileProcessing={fileProcessing}
            knowledgeBase={knowledgeBase}
          />
        ) : currentMode === "files" ? (
          <FileManager
            knowledgeBases={knowledgeBase.knowledgeBases}
            onBatchTranslateAndEmbed={handleBatchTranslateAndEmbed}
            onBatchEmbed={handleBatchEmbed}
          />
        ) : currentMode === "chat" ? (
          <ChatMode
            chat={chat}
            knowledgeBase={knowledgeBase}
            modelSettings={modelSettings}
            onSettingsChange={setModelSettings}
          />
        ) : null}
      </div>
    </div>
  );
};

export default App;
