import React, { useState } from "react";
import {
  MessageSquare,
  PlusCircle,
  Trash2,
  FolderOpen,
  Database,
  Languages,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { ChatSession, TranslatedFile } from "../types";

interface SidebarProps {
  currentMode: string;
  onModeChange: (mode: string) => void;
  chatSessions: ChatSession[];
  onLoadSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
  onCreateSession: () => void;
  translatedFiles: TranslatedFile[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentMode,
  onModeChange,
  chatSessions,
  onLoadSession,
  onDeleteSession,
  onCreateSession,
  translatedFiles,
}) => {
  const [showSessions, setShowSessions] = useState(true);
  const [showTranslatedFiles, setShowTranslatedFiles] = useState(true);

  return (
    <div className="fixed left-0 top-0 h-full w-64 bg-white border-r p-4">
      {/* Logo 和標題 */}
      <div className="flex items-center mb-8">
        <img src="2.jpg" alt="Logo" className="mr-2" />
        <h1 className="text-xl font-bold">翻譯助手</h1>
      </div>

      {/* 主要導航 */}
      <div className="space-y-2">
        <button
          onClick={() => onModeChange("files")}
          className={`w-full text-left px-4 py-2 rounded-lg flex items-center space-x-2 ${
            currentMode === "files" ? "bg-blue-50 text-blue-600" : "hover:bg-gray-50"
          }`}
        >
          <FolderOpen className="w-5 h-5" />
          <span>檔案管理</span>
        </button>
        <button
          onClick={() => onModeChange("knowledge-base")}
          className={`w-full text-left px-4 py-2 rounded-lg flex items-center space-x-2 ${
            currentMode === "knowledge-base" ? "bg-blue-50 text-blue-600" : "hover:bg-gray-50"
          }`}
        >
          <Database className="w-5 h-5" />
          <span>知識庫管理</span>
        </button>
        <button
          onClick={() => onModeChange("chat")}
          className={`w-full text-left px-4 py-2 rounded-lg flex items-center space-x-2 ${
            currentMode === "chat" ? "bg-blue-50 text-blue-600" : "hover:bg-gray-50"
          }`}
        >
          <MessageSquare className="w-5 h-5" />
          <span>知識對話</span>
        </button>
      </div>

      {/* 翻譯文件檢視 */}
      <div className="mt-6">
        <div
          className="flex justify-between items-center mb-2 cursor-pointer"
          onClick={() => setShowTranslatedFiles(!showTranslatedFiles)}
        >
          <div className="flex items-center">
            <Languages className="w-5 h-5 mr-2" />
            <h3 className="font-medium">翻譯文件檢視</h3>
          </div>
          {showTranslatedFiles ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </div>
        {showTranslatedFiles && (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {translatedFiles.length === 0 ? (
              <div className="text-center text-gray-500 py-4">
                <p>尚無翻譯文件</p>
              </div>
            ) : (
              translatedFiles.map((file) => (
                <div
                  key={file.id}
                  className="p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                >
                  <div className="font-medium text-sm truncate">{file.name}</div>
                  <div className="text-xs text-gray-500">
                    {file.isEmbedded ? "已加入知識庫" : "未加入知識庫"}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* 對話列表 */}
      {currentMode === "chat" && (
        <div className="mt-6">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-medium">聊天記錄</h3>
            <button
              onClick={onCreateSession}
              className="p-1 hover:bg-blue-100 rounded text-blue-500"
              title="新增對話"
            >
              <PlusCircle className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {chatSessions.length === 0 ? (
              <div className="text-center text-gray-500 py-4">
                <p>尚無對話</p>
              </div>
            ) : (
              <div className="space-y-2">
                {chatSessions.map((session) => (
                  <div
                    key={session.id}
                    className="group relative bg-white rounded-lg p-3 hover:bg-gray-50 cursor-pointer"
                    onClick={() => onLoadSession(session.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm truncate">
                          {session.title}
                        </h3>
                        <p className="text-xs text-gray-500">
                          {new Date(session.updatedAt).toLocaleString("zh-TW")}
                        </p>
                      </div>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteSession(session.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded text-red-500"
                          title="刪除對話"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
