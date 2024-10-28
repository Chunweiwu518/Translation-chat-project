import React, { useState } from 'react';
import { TranslatedFile } from '../types';
import { ChevronDown, ChevronUp, FileText, Trash2 } from 'lucide-react';

interface TranslatedFilesViewProps {
  files: TranslatedFile[];
  onDelete?: (fileId: string) => void;  // 添加刪除功能
}

export const TranslatedFilesView: React.FC<TranslatedFilesViewProps> = ({ 
  files,
  onDelete 
}) => {
  const [expandedFileId, setExpandedFileId] = useState<string | null>(null);
  const [showContent, setShowContent] = useState<{[key: string]: boolean}>({});

  // 切換檔案展開/收合
  const toggleFile = (fileId: string) => {
    setExpandedFileId(expandedFileId === fileId ? null : fileId);
  };

  // 切換內容展開/收合
  const toggleContent = (fileId: string) => {
    setShowContent(prev => ({
      ...prev,
      [fileId]: !prev[fileId]
    }));
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-3">翻譯文件檢視</h2>
      <div className="space-y-2">
        {files.length === 0 ? (
          <div className="text-center text-gray-500 py-4">
            <p>尚無翻譯文件</p>
          </div>
        ) : (
          files.map((file) => (
            <div key={file.id} className="bg-white rounded-lg shadow-sm border">
              {/* 檔案標題列 */}
              <div 
                className="p-3 flex justify-between items-center"
                onClick={() => toggleFile(file.id)}
              >
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-gray-400" />
                  <div>
                    <h3 className="text-sm font-medium">{file.name}</h3>
                    <p className="text-xs text-gray-500">
                      {file.isEmbedded ? "已加入知識庫" : "未加入知識庫"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  {/* 添加刪除按鈕 */}
                  {onDelete && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(file.id);
                      }}
                      className="p-1 hover:bg-red-100 rounded text-red-500"
                      title="刪除文件"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedFileId(expandedFileId === file.id ? null : file.id);
                    }}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    {expandedFileId === file.id ? (
                      <ChevronUp className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              {/* 展開的內容 */}
              {expandedFileId === file.id && (
                <div className="border-t p-3">
                  {/* 原文部分 */}
                  {file.originalContent && (
                    <div className="mb-2">
                      <div 
                        className="flex items-center justify-between cursor-pointer p-1 hover:bg-gray-50 rounded"
                        onClick={() => toggleContent(`${file.id}-original`)}
                      >
                        <h4 className="text-sm font-medium text-gray-700">原文</h4>
                        {showContent[`${file.id}-original`] ? (
                          <ChevronUp className="w-3 h-3 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-3 h-3 text-gray-400" />
                        )}
                      </div>
                      {showContent[`${file.id}-original`] && (
                        <div className="mt-1 p-2 bg-gray-50 rounded-lg text-xs whitespace-pre-wrap max-h-40 overflow-y-auto">
                          {file.originalContent}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 翻譯結果部分 */}
                  <div>
                    <div 
                      className="flex items-center justify-between cursor-pointer p-1 hover:bg-gray-50 rounded"
                      onClick={() => toggleContent(`${file.id}-translated`)}
                    >
                      <h4 className="text-sm font-medium text-gray-700">翻譯結果</h4>
                      {showContent[`${file.id}-translated`] ? (
                        <ChevronUp className="w-3 h-3 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-3 h-3 text-gray-400" />
                      )}
                    </div>
                    {showContent[`${file.id}-translated`] && (
                      <div className="mt-1 p-2 bg-gray-50 rounded-lg text-xs whitespace-pre-wrap max-h-40 overflow-y-auto">
                        {file.translatedContent}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
