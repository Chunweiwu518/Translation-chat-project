import React, { useState } from "react";
import {
  MessageSquare,
  PlusCircle,
  Trash2,
  FolderOpen,
  Database,
  Languages,
} from "lucide-react";
import { ChatSession, TranslatedFile } from "../types";
import logo from '../assets/images/logo.jpg';

interface SidebarProps {
  currentMode: string; // 當前模式
  onModeChange: (mode: string) => void; // 切換模式的函數
  chatSessions: ChatSession[]; // 聊天記錄的陣列
  onLoadSession: (sessionId: string) => void; // 載入聊天記錄的函數
  onDeleteSession: (sessionId: string) => void; // 刪除聊天記錄的函數
  onCreateSession: () => void; // 新增聊天記錄的函數
  translatedFiles: TranslatedFile[]; // 翻譯文件的陣列
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
  return (
    <div className="fixed left-0 top-0 h-full w-64 bg-white border-r p-2 flex flex-col">
      {/* Logo 和標題 */}
      <div className="mb-1 flex flex-col items-center">
        <h1 className="text-lg font-bold mb-1">吉一卡哇助手</h1> {/* 標題 */}
        <img 
          src={logo} 
          alt="Translation Assistant Logo" 
          className="w-32 h-32 object-contain hover:scale-110 transition-transform duration-200" // Logo 圖片
        />
      </div>

      {/* 主要導航 */}
      <div className="space-y-1 mt-1">
        {/* 檔案管理按鈕 */}
        <button
          onClick={() => onModeChange("files")}
          className={`w-full text-left px-3 py-1.5 rounded-lg flex items-center space-x-2 ${
            currentMode === "files" ? "bg-blue-50 text-blue-600" : "hover:bg-gray-50"
          }`}
        >
          <FolderOpen className="w-4 h-4" />
          <span>檔案管理</span>
        </button>
        {/* 知識庫管理按鈕 */}
        <button
          onClick={() => onModeChange("knowledge-base")}
          className={`w-full text-left px-3 py-1.5 rounded-lg flex items-center space-x-2 ${
            currentMode === "knowledge-base" ? "bg-blue-50 text-blue-600" : "hover:bg-gray-50"
          }`}
        >
          <Database className="w-4 h-4" />
          <span>知識庫管理</span>
        </button>
        {/* 知識對話按鈕 */}
        <button
          onClick={() => onModeChange("chat")}
          className={`w-full text-left px-3 py-1.5 rounded-lg flex items-center space-x-2 ${
            currentMode === "chat" ? "bg-blue-50 text-blue-600" : "hover:bg-gray-50"
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>知識對話</span>
        </button>
        {/* 翻譯文件檢視按鈕 */}
        <button
          onClick={() => onModeChange("translated-files")}
          className={`w-full text-left px-3 py-1.5 rounded-lg flex items-center space-x-2 ${
            currentMode === "translated-files" ? "bg-blue-50 text-blue-600" : "hover:bg-gray-50"
          }`}
        >
          <Languages className="w-4 h-4" />
          <span>翻譯文件檢視</span>
        </button>
      </div>

      {/* 聊天記錄 */}
      <div className="mt-4">
        <div className="flex justify-between items-center mb-1">
          <h3 className="font-medium text-sm">聊天記錄</h3> {/* 聊天記錄標題 */}
          <button
            onClick={() => {
              onCreateSession(); // 新增對話
              onModeChange("chat"); // 切換到聊天模式
            }}
            className="p-1 hover:bg-blue-100 rounded text-blue-500"
            title="新增對話"
          >
            <PlusCircle className="w-3 h-3" />
          </button>
        </div>
        <div className="max-h-[calc(100vh-350px)] overflow-y-auto">
          {chatSessions.length === 0 ? ( // 檢查是否有聊天記錄
            <div className="text-center text-gray-500 py-2 text-sm">
              <p>尚無對話</p> {/* 無對話時顯示的訊息 */}
            </div>
          ) : (
            <div className="space-y-1">
              {chatSessions.map((session) => ( // 顯示每一個聊天記錄
                <div
                  key={session.id}
                  className="group relative bg-white rounded-lg p-2 hover:bg-gray-50 cursor-pointer text-sm"
                  onClick={() => {
                    onLoadSession(session.id); // 載入選中的聊天記錄
                    onModeChange("chat"); // 切換到聊天模式
                  }}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm truncate">
                        {session.title} {/* 聊天記錄標題 */}
                      </h3>
                      <p className="text-xs text-gray-500">
                        {new Date(session.updatedAt).toLocaleString("zh-TW")} {/* 聊天記錄更新時間 */}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation(); // 防止事件冒泡
                        onDeleteSession(session.id); // 刪除選中的聊天記錄
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded text-red-500"
                      title="刪除對話"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
