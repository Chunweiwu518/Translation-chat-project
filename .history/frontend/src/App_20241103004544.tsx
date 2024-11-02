import React, { useState, useEffect } from "react";
import { Sidebar } from "./components/Sidebar";
import { FileUpload } from "./components/FileUpload";
import { Chat } from "./components/Chat";
import { TranslatedFiles } from "./components/TranslatedFiles";
import { BatchFileProcessor } from "./components/BatchFileProcessor";
import { WelcomeChatScreen } from "./components/WelcomeChatScreen"; // 新增此組件
import { useChat } from "./hooks/useChat";
import { useFileProcessing } from "./hooks/useFileProcessing";
import { useKnowledgeBase } from "./hooks/useKnowledgeBase";
import { ModelSettings, TranslateModeProps, ChatModeProps, Message, TranslatedFile, FileInfo } from "./types";
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
            console.error("處理文件時出��:", error);
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

  // 新增獲取資料夾內所有檔案的函數
  const getFolderFiles = async (folderPath: string): Promise<string[]> => {
    try {
      const response = await fetch(`http://localhost:5000/api/files/recursive?path=${encodeURIComponent(folderPath)}`);
      if (response.ok) {
        const files: FileInfo[] = await response.json();
        return files.map(file => file.path);
      }
      return [];
    } catch (error) {
      console.error('獲取資料夾檔案失敗:', error);
      return [];
    }
  };

  // 修改批次翻譯和嵌入函數
  const handleBatchTranslateAndEmbed = async (
    paths: string[],
    knowledgeBaseId: string,
    onProgress: (progress: number) => void
  ): Promise<void> => {
    try {
      let allFiles: string[] = [];
      
      // 收集所有檔案路徑
      for (const path of paths) {
        const fileInfo = files.find((f: FileInfo) => f.id === path);
        if (fileInfo) {
          if (fileInfo.isDirectory) {
            const folderFiles = await getFolderFiles(fileInfo.path);
            allFiles = [...allFiles, ...folderFiles];
          } else {
            allFiles.push(fileInfo.path);
          }
        }
      }

      const totalFiles = allFiles.length;
      let currentFileIndex = 0;

      for (const filePath of allFiles) {
        try {
          // 獲取檔案的目錄路徑
          const pathParts = filePath.split('/');
          const fileName = pathParts.pop() || ''; // 取得檔案名
          const directoryPath = pathParts.join('/');

          // 更新進度 - 開始處理新檔案
          const baseProgress = (currentFileIndex / totalFiles) * 100;
          onProgress(Math.round(baseProgress));

          // 從檔案系統讀取檔案內容
          const fileResponse = await fetch(`http://localhost:5000/api/files/content/${filePath}`);
          if (!fileResponse.ok) {
            throw new Error(`無法讀取檔案 ${filePath}`);
          }
          const { content } = await fileResponse.json();
          const originalContent = content;

          // 更新進度 - 開始翻譯
          onProgress(Math.round(baseProgress + (100 / totalFiles) * 0.3));

          // 翻譯處理
          const formData = new FormData();
          const blob = new Blob([originalContent], { type: 'text/plain' });
          formData.append('file', blob, fileName);

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
          const translatedContent = data.translated_content;
          
          // 更新進度 - 翻譯完成
          onProgress(Math.round(baseProgress + (100 / totalFiles) * 0.6));

          // 加入知識庫
          const embedResponse = await fetch('http://localhost:5000/api/embed', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              content: translatedContent,
              filename: fileName,
              knowledge_base_id: knowledgeBaseId,
            }),
          });

          if (!embedResponse.ok) {
            throw new Error('加入知識庫失敗');
          }

          // 更新翻譯文件檢視 - 修改這部分，確保檔案資訊被正確保存
          const translatedFile = {
            id: Math.random().toString(),
            name: fileName,
            translatedContent: translatedContent,
            originalContent: originalContent,
            status: 'completed' as const,
            isEmbedded: true,
            embeddingProgress: 100,
            path: filePath  // 保存檔案路徑
          };

          // 使用 setTranslatedFiles 更新檔案列表
          fileProcessing.setTranslatedFiles(prev => {
            // 檢查是否已存在相同檔案（使用檔案名稱和內容比對）
            const existingIndex = prev.findIndex(f => 
              f.name === fileName && 
              f.originalContent === originalContent
            );
            
            if (existingIndex >= 0) {
              // 如果存在，更新該檔案
              const newFiles = [...prev];
              newFiles[existingIndex] = translatedFile;
              return newFiles;
            }
            // 如果不存在，添加新檔案
            return [...prev, translatedFile];
          });

          // 更新進度 - 加入知識庫
          onProgress(Math.round(baseProgress + (100 / totalFiles) * 0.9));

          // 完成當前檔案處理
          currentFileIndex++;
          onProgress(Math.round((currentFileIndex / totalFiles) * 100));
        } catch (error) {
          console.error(`處理檔案 ${filePath} 時出錯:`, error);
          // 繼續處理下一個檔案，而不是中斷整個過程
          currentFileIndex++;
          continue;
        }
      }

      // 確保最後顯示 100%
      onProgress(100);
      
      // 重新獲取檔案列表
      await fetchFiles();
    } catch (error) {
      console.error('處理檔案時出錯:', error);
      throw error;
    }
  };

  // 修改直接加入知識庫函數
  const handleBatchEmbed = async (
    paths: string[],
    knowledgeBaseId: string,
    onProgress: (progress: number) => void
  ): Promise<void> => {
    try {
      let allFiles: string[] = [];
      
      // 收集所有檔案路徑
      for (const path of paths) {
        const fileInfo = files.find((f: FileInfo) => f.id === path);
        if (fileInfo) {
          if (fileInfo.isDirectory) {
            const folderFiles = await getFolderFiles(fileInfo.path);
            allFiles = [...allFiles, ...folderFiles];
          } else {
            allFiles.push(fileInfo.path);
          }
        }
      }

      const totalFiles = allFiles.length;
      let currentFileIndex = 0;

      for (const filePath of allFiles) {
        // 獲取檔案內容
        const fileResponse = await fetch(`http://localhost:5000/api/files/content/${filePath}`);
        if (!fileResponse.ok) {
          throw new Error(`無法讀取檔案 ${filePath}`);
        }
        const { content } = await fileResponse.json();

        // 將檔案加入知識庫
        const embedResponse = await fetch('http://localhost:5000/api/embed', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: content,  // 直接使用原始內容
            filename: filePath,
            knowledge_base_id: knowledgeBaseId,
          }),
        });

        if (!embedResponse.ok) {
          throw new Error(`檔案 ${filePath} 加入知識庫失敗`);
        }

        currentFileIndex++;
        onProgress(Math.round((currentFileIndex / totalFiles) * 100));
      }
    } catch (error) {
      console.error('處理檔案時出錯:', error);
      throw error;
    }
  };

  // 修改檔案對話處理函數
  const handleFileChat = async (files: string[]): Promise<void> => {
    try {
      // 顯示初始化訊息
      const initMessage: Message = {
        sender: "system",
        text: `正在處理 ${files.length} 個檔案，請稍候...`,
      };
      chat.setMessages([initMessage]);

      // 依序處理每個檔案
      for (const file_path of files) {
        // 獲取檔案內容
        const fileResponse = await fetch(`http://localhost:5000/api/files/translated_content/${file_path}`);
        if (!fileResponse.ok) {
          throw new Error(`無法讀取檔案 ${file_path}`);
        }
        const { content: translatedContent } = await fileResponse.json();

        // 將檔案加入知識庫
        const embedResponse = await fetch('http://localhost:5000/api/embed', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: translatedContent,  // 使用翻譯後的內容
            filename: file_path,
            knowledge_base_id: 'default',  // 使用預設知識庫
          }),
        });

        if (!embedResponse.ok) {
          throw new Error(`檔案 ${file_path} 加入知識庫失敗`);
        }
      }

      // 更新成功訊息
      const successMessage: Message = {
        sender: "system",
        text: `已成功載入 ${files.length} 個翻譯檔案到預設知識庫，您可以開始詢問相關問題。`,
      };
      chat.setMessages([successMessage]);

    } catch (error: unknown) {
      console.error('處理檔案對話時錯:', error);
      const errorMessage: Message = {
        sender: "system",
        text: `處理檔案時出錯: ${error instanceof Error ? error.message : '未知錯誤'}`,
      };
      chat.setMessages([errorMessage]);
    }
  };

  // 在 App.tsx 或其他使用 TranslatedFilesView 的地方
  const handleDownloadTranslation = (file: TranslatedFile) => {
    // 創建 Blob 對象
    const content = `原文：\n\n${file.originalContent}\n\n翻譯：\n\n${file.translatedContent}`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    
    // 創建下載連結
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${file.name}_翻譯結果.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 添加 files 狀態
  const [files, setFiles] = useState<FileInfo[]>([]);

  // 添加獲取檔案列表的函數
  const fetchFiles = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/files?path=/`);
      if (response.ok) {
        const data = await response.json();
        setFiles(data);
      }
    } catch (error) {
      console.error('獲取檔案列表失敗:', error);
    }
  };

  // 在 useEffect 中獲取檔案列表
  useEffect(() => {
    fetchFiles();
  }, []);

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
            files={files}  // 傳遞檔案列表
            onFilesChange={setFiles}  // 傳遞更新檔案列表的函數
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
            onDelete={fileProcessing.handleDelete}  // 直接使用 hook 提供的 handleDelete
            onDownload={handleDownloadTranslation}
          />
        ) : null}
      </div>
    </div>
  );
};

export default App;
