// App.tsx
import React, { useState } from "react";
import { AppProvider } from './context/AppContext';
import { useKnowledgeBase } from './hooks/useKnowledgeBase';
import { useFileProcessing } from './hooks/useFileProcessing';
import { useChat } from './hooks/useChat';
import { Sidebar } from "./components/Sidebar";
import { FileUpload } from "./components/FileUpload";
import { Chat } from "./components/Chat";
import { TranslatedFiles } from "./components/TranslatedFiles";
import { BatchFileProcessor } from "./components/BatchFileProcessor";

const App: React.FC = () => {
  const [currentMode, setCurrentMode] = useState("translate");
  const { modelSettings, setModelSettings } = useAppContext();
  const knowledgeBase = useKnowledgeBase();
  const fileProcessing = useFileProcessing();
  const chat = useChat();

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        currentMode={currentMode}
        onModeChange={setCurrentMode}
        chatSessions={chat.chatSessions}
        onLoadSession={chat.handleLoadSession}
        onDeleteSession={chat.handleDeleteSession}
        onCreateSession={chat.createNewChatSession}
      />

      <div className="flex-1 ml-64 p-6">
        {currentMode === "translate" ? (
          <TranslateMode
            fileProcessing={fileProcessing}
            knowledgeBase={knowledgeBase}
          />
        ) : (
          <ChatMode
            chat={chat}
            knowledgeBase={knowledgeBase}
            modelSettings={modelSettings}
            onSettingsChange={setModelSettings}
          />
        )}
      </div>
    </div>
  );
};

// 子組件
const TranslateMode = ({ fileProcessing, knowledgeBase }) => (
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
            onEmbed={(fileId) => fileProcessing.handleBatchEmbed([fileId], knowledgeBase.currentKnowledgeBase)}
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

const ChatMode = ({ chat, knowledgeBase, modelSettings, onSettingsChange }) => (
  <div className="h-full">
    <Chat
      messages={chat.messages}
      onSendMessage={(text) => chat.handleSendMessage(text, knowledgeBase.currentKnowledgeBase, modelSettings)}
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
    />
  </div>
);

export default App;