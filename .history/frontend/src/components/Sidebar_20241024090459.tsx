import React, { useState } from "react";
import {
  FileText,
  MessageSquare,
  PlusCircle,
  Trash2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { ChatSession } from "../types";

interface SidebarProps {
  currentMode: string;
  onModeChange: (mode: string) => void;
  chatSessions: ChatSession[];
  onLoadSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
  onCreateSession: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentMode,
  onModeChange,
  chatSessions,
  onLoadSession,
  onDeleteSession,
  onCreateSession,
}) => {
  const [showSessions, setShowSessions] = useState(true);

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
          onClick={() => onModeChange("translate")}
          className={`w-full text-left p-3 rounded flex items-center ${
            currentMode === "translate" ? "bg-blue-100" : "hover:bg-gray-200"
          }`}
        >
          <FileText className="mr-2 h-5 w-5" />
          翻譯文件
        </button>
        <button
          onClick={() => onModeChange("chat")}
          className={`w-full text-left p-3 rounded flex items-center ${
            currentMode === "chat" ? "bg-blue-100" : "hover:bg-gray-200"
          }`}
        >
          <MessageSquare className="mr-2 h-5 w-5" />
          知識對話
        </button>
      </div>

      {/* 對話列表 */}
      <div className="mt-8 flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={() => setShowSessions(!showSessions)}
            className="flex items-center text-gray-700 font-medium"
          >
            <span>對話列表</span>
            {showSessions ? (
              <ChevronUp className="w-4 h-4 ml-1" />
            ) : (
              <ChevronDown className="w-4 h-4 ml-1" />
            )}
          </button>
          <button
            onClick={onCreateSession}
            className="p-1 hover:bg-gray-200 rounded text-gray-600"
            title="新增對話"
          >
            <PlusCircle className="w-5 h-5" />
          </button>
        </div>

        {showSessions && (
          <div className="flex-1 overflow-y-auto">
            {chatSessions.length === 0 ? (
              <div className="text-center text-gray-500 py-4">
                <p>尚無對話</p>
                <button
                  onClick={onCreateSession}
                  className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  建立新對話
                </button>
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
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteSession(session.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
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
