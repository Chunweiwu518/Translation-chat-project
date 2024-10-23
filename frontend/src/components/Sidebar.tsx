import React, { useState } from 'react';
import { FileText, MessageSquare, History, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { Message } from '../types';

interface ChatHistory {
  id: string;
  title: string;
  messages: Message[];
  date: Date;
}

interface SidebarProps {
  currentMode: string;
  onModeChange: (mode: string) => void;
  chatHistory: ChatHistory[];
  onLoadHistory: (historyId: string) => void;
  onDeleteHistory: (historyId: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentMode,
  onModeChange,
  chatHistory,
  onLoadHistory,
  onDeleteHistory,
}) => {
  const [showHistory, setShowHistory] = useState(false);

  return (
    <div className="w-64 bg-gray-100 h-screen p-4 fixed left-0 top-0 flex flex-col">
      {/* Logo 和標題 */}
      <div className="flex items-center mb-8">
        <img src="2.jpg" alt="Logo" className="mr-2" />
        <h1 className="text-xl font-bold">翻譯助手</h1>
      </div>
      
      {/* 主要導航 */}
      <div className="space-y-2">
        <button
          onClick={() => onModeChange('translate')}
          className={`w-full text-left p-3 rounded flex items-center ${
            currentMode === 'translate' ? 'bg-blue-100' : 'hover:bg-gray-200'
          }`}
        >
          <FileText className="mr-2 h-5 w-5" />
          翻譯文件
        </button>
        <button
          onClick={() => onModeChange('chat')}
          className={`w-full text-left p-3 rounded flex items-center ${
            currentMode === 'chat' ? 'bg-blue-100' : 'hover:bg-gray-200'
          }`}
        >
          <MessageSquare className="mr-2 h-5 w-5" />
          知識對話
        </button>
      </div>

      {/* 歷史記錄 */}
      <div className="mt-8">
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="w-full p-3 rounded flex items-center justify-between hover:bg-gray-200 transition-colors"
        >
          <div className="flex items-center text-gray-700">
            <History className="mr-2 h-5 w-5" />
            <span className="font-medium">歷史記錄</span>
          </div>
          <div className="flex items-center text-gray-500">
            <span className="text-sm mr-2">{chatHistory.length} 則對話</span>
            {showHistory ? (
              <ChevronUp className="h-5 w-5" />
            ) : (
              <ChevronDown className="h-5 w-5" />
            )}
          </div>
        </button>
        
        {showHistory && (
          <div className="mt-2 max-h-[400px] overflow-y-auto px-2">
            {chatHistory.length === 0 ? (
              <p className="text-sm text-gray-500 p-3 text-center">尚無歷史記錄</p>
            ) : (
              <div className="space-y-1">
                {chatHistory.map((history) => (
                  <div
                    key={history.id}
                    className="p-2 hover:bg-gray-200 rounded group relative cursor-pointer transition-colors"
                  >
                    <div
                      onClick={() => onLoadHistory(history.id)}
                      className="pr-8"
                    >
                      <div className="text-sm font-medium truncate">
                        {history.title}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(history.date).toLocaleString('zh-TW', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteHistory(history.id);
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1 text-red-500 hover:bg-red-50 rounded"
                      title="刪除記錄"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};