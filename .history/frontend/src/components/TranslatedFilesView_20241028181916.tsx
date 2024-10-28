import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Trash2, Download } from 'lucide-react';

interface TranslatedFile {
  id: string;
  name: string;
  originalContent: string;
  translatedContent: string;
  status: 'completed' | 'failed' | 'pending';
}

interface TranslatedFilesViewProps {
  files: TranslatedFile[];
  onDelete: (id: string) => void;
  onDownload: (file: TranslatedFile) => void;
}

export const TranslatedFilesView: React.FC<TranslatedFilesViewProps> = ({
  files,
  onDelete,
  onDownload,
}) => {
  const [expandedFile, setExpandedFile] = useState<string | null>(null);

  const handleToggleExpand = (fileId: string) => {
    setExpandedFile(expandedFile === fileId ? null : fileId);
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">翻譯文件檢視</h2>
      <div className="space-y-4">
        {files.map((file) => (
          <div
            key={file.id}
            className="border rounded-lg overflow-hidden bg-white shadow-sm"
          >
            {/* 文件標題列 */}
            <div className="flex items-center justify-between px-4 py-3 bg-gray-50">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleToggleExpand(file.id)}
                  className="hover:bg-gray-200 p-1 rounded"
                >
                  {expandedFile === file.id ? (
                    <ChevronUp className="w-5 h-5" />
                  ) : (
                    <ChevronDown className="w-5 h-5" />
                  )}
                </button>
                <span className="font-medium">{file.name}</span>
                <span
                  className={`text-sm px-2 py-1 rounded ${
                    file.status === 'completed'
                      ? 'bg-green-100 text-green-600'
                      : file.status === 'failed'
                      ? 'bg-red-100 text-red-600'
                      : 'bg-yellow-100 text-yellow-600'
                  }`}
                >
                  {file.status === 'completed'
                    ? '翻譯完成'
                    : file.status === 'failed'
                    ? '翻譯失敗'
                    : '處理中'}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => onDownload(file)}
                  className="p-2 hover:bg-gray-200 rounded text-gray-600"
                  title="下載翻譯結果"
                >
                  <Download className="w-5 h-5" />
                </button>
                <button
                  onClick={() => onDelete(file.id)}
                  className="p-2 hover:bg-red-100 rounded text-red-500"
                  title="刪除翻譯"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* 展開的內容區域 */}
            {expandedFile === file.id && (
              <div className="p-4">
                <div className="grid grid-cols-2 gap-4">
                  {/* 原文內容 */}
                  <div>
                    <h3 className="font-medium mb-2 text-gray-700">原文</h3>
                    <div className="bg-gray-50 p-4 rounded-lg whitespace-pre-wrap min-h-[200px] max-h-[500px] overflow-y-auto">
                      {file.originalContent}
                    </div>
                  </div>
                  {/* 翻譯內容 */}
                  <div>
                    <h3 className="font-medium mb-2 text-gray-700">翻譯</h3>
                    <div className="bg-blue-50 p-4 rounded-lg whitespace-pre-wrap min-h-[200px] max-h-[500px] overflow-y-auto">
                      {file.translatedContent}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
