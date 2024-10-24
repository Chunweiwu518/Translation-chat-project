// FileProcessor.tsx
import React, { useState } from "react";
import { FileWithOptions } from "../types";
import { Trash2, RefreshCw, Check } from "lucide-react";

interface FileProcessorProps {
  files: FileWithOptions[];
  onUpdateFiles: (files: FileWithOptions[]) => void;
  onProcessFiles: (files: FileWithOptions[]) => void;
  knowledgeBases: Array<{ id: string; name: string }>;
  currentKnowledgeBase: string;
  onSwitchKnowledgeBase: (id: string) => void;
}

export const FileProcessor: React.FC<FileProcessorProps> = ({
  files,
  onUpdateFiles,
  onProcessFiles,
  knowledgeBases,
  currentKnowledgeBase,
  onSwitchKnowledgeBase,
}) => {
  const [selectedKnowledgeBase, setSelectedKnowledgeBase] =
    useState(currentKnowledgeBase);

  const handleToggleTranslation = (fileId: string) => {
    onUpdateFiles(
      files.map((file) =>
        file.id === fileId
          ? { ...file, needTranslation: !file.needTranslation }
          : file
      )
    );
  };

  const handleRemoveFile = (fileId: string) => {
    onUpdateFiles(files.filter((file) => file.id !== fileId));
  };

  const handleProcess = () => {
    onProcessFiles(files.filter((f) => f.status === "pending"));
  };

  const pendingFiles = files.filter((f) => f.status === "pending");
  const processingFiles = files.filter((f) =>
    ["translating", "embedding"].includes(f.status)
  );
  const completedFiles = files.filter((f) => f.status === "completed");
  const errorFiles = files.filter((f) => f.status === "error");

  const getStatusText = (status: string) => {
    switch (status) {
      case "translating":
        return "翻譯中";
      case "embedding":
        return "Embedding中";
      default:
        return "處理中";
    }
  };

  return (
    <div className="space-y-4">
      {/* 知識庫選擇 */}
      <div className="bg-white rounded-lg p-4 shadow-sm">
        <h3 className="font-medium mb-2">選擇目標知識庫</h3>
        <select
          value={selectedKnowledgeBase}
          onChange={(e) => setSelectedKnowledgeBase(e.target.value)}
          className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
        >
          {knowledgeBases.map((kb) => (
            <option key={kb.id} value={kb.id}>
              {kb.name}
            </option>
          ))}
        </select>
      </div>

      {/* 待處理文件 */}
      {pendingFiles.length > 0 && (
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <h3 className="font-medium mb-2">待處理文件</h3>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {pendingFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-2 bg-gray-50 rounded"
              >
                <div className="flex items-center flex-1 min-w-0 mr-4">
                  <span className="text-sm truncate">{file.name}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleToggleTranslation(file.id)}
                    className={`px-2 py-1 text-xs rounded ${
                      file.needTranslation
                        ? "bg-blue-100 text-blue-600"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {file.needTranslation ? "需要翻譯" : "直接使用"}
                  </button>
                  <button
                    onClick={() => handleRemoveFile(file.id)}
                    className="p-1 text-red-500 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={handleProcess}
            className="mt-4 w-full py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            開始處理 ({pendingFiles.length} 個文件)
          </button>
        </div>
      )}

      {/* 處理中文件 */}
      {processingFiles.length > 0 && (
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <h3 className="font-medium mb-2">處理中</h3>
          <div className="space-y-2">
            {processingFiles.map((file) => (
              <div key={file.id} className="p-2 bg-gray-50 rounded">
                <div className="flex justify-between mb-1">
                  <span className="text-sm">{file.name}</span>
                  <span className="text-xs text-blue-500">
                    {getStatusText(file.status)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${file.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 已完成文件 */}
      {completedFiles.length > 0 && (
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <h3 className="font-medium mb-2">已完成</h3>
          <div className="space-y-2 max-h-[200px] overflow-y-auto">
            {completedFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-2 bg-gray-50 rounded"
              >
                <span className="text-sm truncate">{file.name}</span>
                <Check className="w-4 h-4 text-green-500" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 錯誤文件 */}
      {errorFiles.length > 0 && (
        <div className="bg-white rounded-lg p-4 shadow-sm border-red-200">
          <h3 className="font-medium mb-2 text-red-600">處理失敗</h3>
          <div className="space-y-2">
            {errorFiles.map((file) => (
              <div key={file.id} className="p-2 bg-red-50 rounded">
                <div className="flex justify-between">
                  <span className="text-sm text-red-600">{file.name}</span>
                  <button
                    onClick={() => {
                      onUpdateFiles(
                        files.map((f) =>
                          f.id === file.id
                            ? { ...f, status: "pending", error: undefined }
                            : f
                        )
                      );
                    }}
                    className="p-1 text-red-500 hover:bg-red-100 rounded"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
                {file.error && (
                  <p className="text-xs text-red-500 mt-1">{file.error}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
