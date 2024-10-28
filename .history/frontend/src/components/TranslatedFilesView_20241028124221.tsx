import React, { useState } from 'react';
import { TranslatedFile } from '../types';
import { ChevronDown, ChevronUp, FileText } from 'lucide-react';

interface TranslatedFilesViewProps {
  files: TranslatedFile[];
}

export const TranslatedFilesView: React.FC<TranslatedFilesViewProps> = ({ files }) => {
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
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">翻譯文件檢視</h2>
      <div className="space-y-4">
        {files.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>尚無翻譯文件</p>
          </div>
        ) : (
          files.map((file) => (
            <div key={file.id} className="bg-white rounded-lg shadow-sm border">
              {/* 檔案標題列 */}
              <div 
                className="p-4 flex justify-between items-center cursor-pointer hover:bg-gray-50"
                onClick={() => toggleFile(file.id)}
              >
                <div className="flex items-center space-x-3">
                  <FileText className="w-5 h-5 text-gray-400" />
                  <div>
                    <h3 className="font-medium">{file.name}</h3>
                    <p className="text-sm text-gray-500">
                      {file.isEmbedded ? "已加入知識庫" : "未加入知識庫"}
                    </p>
                  </div>
                </div>
                {expandedFileId === file.id ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </div>

              {/* 展開的內容 */}
              {expandedFileId === file.id && (
                <div className="border-t p-4">
                  {/* 原文部分 */}
                  {file.originalContent && (
                    <div className="mb-4">
                      <div 
                        className="flex items-center justify-between cursor-pointer p-2 hover:bg-gray-50 rounded"
                        onClick={() => toggleContent(`${file.id}-original`)}
                      >
                        <h4 className="font-medium text-gray-700">原文</h4>
                        {showContent[`${file.id}-original`] ? (
                          <ChevronUp className="w-4 h-4 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                      {showContent[`${file.id}-original`] && (
                        <div className="mt-2 p-4 bg-gray-50 rounded-lg text-sm whitespace-pre-wrap max-h-60 overflow-y-auto">
                          {file.originalContent}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 翻譯結果部分 */}
                  <div>
                    <div 
                      className="flex items-center justify-between cursor-pointer p-2 hover:bg-gray-50 rounded"
                      onClick={() => toggleContent(`${file.id}-translated`)}
                    >
                      <h4 className="font-medium text-gray-700">翻譯結果</h4>
                      {showContent[`${file.id}-translated`] ? (
                        <ChevronUp className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                    {showContent[`${file.id}-translated`] && (
                      <div className="mt-2 p-4 bg-gray-50 rounded-lg text-sm whitespace-pre-wrap max-h-60 overflow-y-auto">
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
