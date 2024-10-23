import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { FileUpload } from './components/FileUpload';
import { Chat } from './components/Chat';
import { TranslatedFiles } from './components/TranslatedFiles';
import { BatchFileProcessor } from './components/BatchFileProcessor';
import { Message, TranslatedFile, ModelSettings } from './types';

interface KnowledgeBaseInfo {
  id: string;
  name: string;
  description: string;
}

interface ChatHistory {
  id: string;
  title: string;
  messages: Message[];
  date: Date;
}

const App: React.FC = () => {
  // 基本狀態
  const [currentMode, setCurrentMode] = useState('translate');
  const [messages, setMessages] = useState<Message[]>([]);
  const [uploadProgress, setUploadProgress] = useState<{[key: string]: number}>({});
  const [translatedFiles, setTranslatedFiles] = useState<TranslatedFile[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([]);
  
  // 知識庫狀態
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBaseInfo[]>([
    { id: 'default', name: '預設知識庫', description: '預設的知識庫' }
  ]);
  const [currentKnowledgeBase, setCurrentKnowledgeBase] = useState('default');
  
  // 模型設定
  const [modelSettings, setModelSettings] = useState<ModelSettings>({
    model: 'llama3.1-ffm-70b-32k-chat',
    temperature: 0.7,
    maxTokens: 2000,
    topP: 0.9,
    frequencyPenalty: 0.0,
    seed: 42,
    topK: 3,
    similarityThreshold: 0.7
  });

  // 載入知識庫列表
  useEffect(() => {
    fetchKnowledgeBases();
  }, []);

  const fetchKnowledgeBases = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/knowledge_bases');
      if (response.ok) {
        const data = await response.json();
        setKnowledgeBases(data);
      }
    } catch (error) {
      console.error('獲取知識庫列表失敗:', error);
    }
  };

  const handleFileUpload = async (files: File[]) => {
    setUploadProgress(
      files.reduce((acc, file) => ({
        ...acc,
        [file.name]: 0
      }), {})
    );
  
    await Promise.all(
      files.map(async file => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('knowledge_base_id', currentKnowledgeBase);
  
        try {
          const updateProgress = (progress: number) => {
            setUploadProgress(prev => ({
              ...prev,
              [file.name]: progress
            }));
          };
  
          updateProgress(10);
  
          const response = await fetch('http://localhost:5000/api/upload_and_translate', {
            method: 'POST',
            body: formData
          });
          
          if (response.ok) {
            updateProgress(100);
            
            const data = await response.json();
            const newFile: TranslatedFile = {
              id: Date.now().toString() + file.name,
              name: file.name,
              translatedContent: data.translated_content,
              isEmbedded: false,
              knowledgeBaseId: currentKnowledgeBase
            };
            
            setTranslatedFiles(prev => [...prev, newFile]);
  
            setTimeout(() => {
              setUploadProgress(prev => {
                const newProgress = { ...prev };
                delete newProgress[file.name];
                return newProgress;
              });
            }, 1000);
          }
        } catch (error) {
          console.error(`上傳錯誤 (${file.name}):`, error);
          setUploadProgress(prev => {
            const newProgress = { ...prev };
            delete newProgress[file.name];
            return newProgress;
          });
        }
      })
    );
  };

  const handleBatchEmbed = async (fileIds: string[], targetKnowledgeBaseId: string) => {
    for (const fileId of fileIds) {
      const file = translatedFiles.find(f => f.id === fileId);
      if (!file) continue;

      try {
        setTranslatedFiles(prev =>
          prev.map(f => f.id === fileId ? { ...f, embeddingProgress: 0 } : f)
        );

        const response = await fetch('http://localhost:5000/api/embed', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            content: file.translatedContent,
            filename: file.name,
            knowledge_base_id: targetKnowledgeBaseId
          })
        });

        if (response.ok) {
          for (let progress = 0; progress <= 100; progress += 10) {
            setTranslatedFiles(prev =>
              prev.map(f => f.id === fileId ? { ...f, embeddingProgress: progress } : f)
            );
            await new Promise(resolve => setTimeout(resolve, 200));
          }

          setTranslatedFiles(prev =>
            prev.map(f => f.id === fileId ? 
              { ...f, isEmbedded: true, knowledgeBaseId: targetKnowledgeBaseId } : f
            )
          );
        }
      } catch (error) {
        console.error('Embedding 錯誤:', error);
        setTranslatedFiles(prev =>
          prev.map(f => f.id === fileId ? { ...f, embeddingProgress: undefined } : f)
        );
      }
    }
  };

  const handleEmbed = async (fileId: string) => {
    const file = translatedFiles.find(f => f.id === fileId);
    if (!file) return;

    try {
      setTranslatedFiles(prev =>
        prev.map(f => f.id === fileId ? { ...f, embeddingProgress: 0 } : f)
      );

      const response = await fetch('http://localhost:5000/api/embed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: file.translatedContent,
          filename: file.name,
          knowledge_base_id: currentKnowledgeBase
        })
      });

      if (response.ok) {
        for (let progress = 0; progress <= 100; progress += 10) {
          setTranslatedFiles(prev =>
            prev.map(f => f.id === fileId ? { ...f, embeddingProgress: progress } : f)
          );
          await new Promise(resolve => setTimeout(resolve, 200));
        }

        setTranslatedFiles(prev =>
          prev.map(f => f.id === fileId ? { ...f, isEmbedded: true } : f)
        );
      }
    } catch (error) {
      console.error('Embedding 錯誤:', error);
      setTranslatedFiles(prev =>
        prev.map(f => f.id === fileId ? { ...f, embeddingProgress: undefined } : f)
      );
    }
  };

  const handleSwitchKnowledgeBase = async (id: string) => {
    try {
      const response = await fetch(`http://localhost:5000/api/knowledge_base/switch/${id}`, {
        method: 'POST'
      });

      if (response.ok) {
        setCurrentKnowledgeBase(id);
        setMessages([]);  // 切換知識庫時清空對話
      }
    } catch (error) {
      console.error('切換知識庫錯誤:', error);
    }
  };

  const handleResetKnowledgeBase = async (id: string) => {
    if (window.confirm('確定要重置此知識庫嗎？此操作無法恢復。')) {
      try {
        const response = await fetch(`http://localhost:5000/api/knowledge_base/reset/${id}`, {
          method: 'POST'
        });

        if (response.ok) {
          setTranslatedFiles(prev => 
            prev.filter(f => f.knowledgeBaseId !== id)
          );
          if (id === currentKnowledgeBase) {
            setMessages([]);  // 如果重置當前知識庫，清空對話
          }
        }
      } catch (error) {
        console.error('重置知識庫錯誤:', error);
      }
    }
  };

  const handleSendMessage = async (text: string) => {
    const userMessage = { sender: 'user' as const, text };
    setMessages(prev => [...prev, userMessage]);
    
    try {
      const response = await fetch('http://localhost:5000/api/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
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
              topK: modelSettings.topK,
              similarityThreshold: modelSettings.similarityThreshold
            }
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        const systemMessage = {
          sender: 'system' as const,
          text: data.answer,
          chunks: data.relevant_chunks
        };
        setMessages(prev => [...prev, systemMessage]);

        // 保存到歷史記錄
        const newHistory: ChatHistory = {
          id: Date.now().toString(),
          title: text.slice(0, 50) + (text.length > 50 ? '...' : ''),
          messages: [...messages, userMessage, systemMessage],
          date: new Date(),
        };
        setChatHistory(prev => [newHistory, ...prev]);
      }
    } catch (error) {
      console.error('查詢錯誤:', error);
      setMessages(prev => [...prev, {
        sender: 'system',
        text: '抱歉，處理您的問題時出現錯誤。請稍後重試。'
      }]);
    }
  };

  const handleLoadHistory = (historyId: string) => {
    const history = chatHistory.find(h => h.id === historyId);
    if (history) {
      setMessages(history.messages);
    }
  };

  const handleDeleteHistory = (historyId: string) => {
    setChatHistory(prev => prev.filter(h => h.id !== historyId));
  };

  const handleDeleteFile = async (fileId: string) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/knowledge_base/${currentKnowledgeBase}/file/${fileId}`,
        { method: 'DELETE' }
      );

      if (response.ok) {
        setTranslatedFiles(prev => 
          prev.filter(file => file.id !== fileId)
        );
      }
    } catch (error) {
      console.error('刪除文件錯誤:', error);
    }
  };

  const handleClearChat = () => {
    setMessages([]);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar 
        onModeChange={setCurrentMode} 
        currentMode={currentMode}
        chatHistory={chatHistory}
        onLoadHistory={handleLoadHistory}
        onDeleteHistory={handleDeleteHistory}
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
                    onEmbed={handleEmbed}
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
              onClearChat={handleClearChat}
              currentKnowledgeBaseName={knowledgeBases.find(kb => kb.id === currentKnowledgeBase)?.name || ''}
              modelSettings={modelSettings}
              onSettingsChange={setModelSettings}
              translatedFiles={translatedFiles}
              onDeleteFile={handleDeleteFile}
              knowledgeBases={knowledgeBases}
              currentKnowledgeBase={currentKnowledgeBase}
              onSwitchKnowledgeBase={handleSwitchKnowledgeBase}
              onResetKnowledgeBase={handleResetKnowledgeBase}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default App;