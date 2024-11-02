import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Trash2, Download, Checkbox } from 'lucide-react';
import { TranslatedFile } from '../types';

interface TranslatedFilesViewProps {
  files: TranslatedFile[];
  onDelete: (id: string | string[]) => void;
  onDownload: (file: TranslatedFile | TranslatedFile[]) => void;
}

export const TranslatedFilesView: React.FC<TranslatedFilesViewProps> = ({
  files,
  onDelete,
  onDownload,
}) => {
  const [expandedFile, setExpandedFile] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);

  const handleToggleExpand = (fileId: string) => {
    setExpandedFile(expandedFile === fileId ? null : fileId);
  };

  const handleSelectAll = () => {
    if (selectedFiles.length === files.length) {
      setSelectedFiles([]);
    } else {
      setSelectedFiles(files.map(file => file.id));
    }
  };

  const handleSelectFile = (fileId: string) => {
    setSelectedFiles(prev =>
      prev.includes(fileId)
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    );
  };

  const handleBatchDelete = () => {
    if (selectedFiles.length === 0) return;
    
    if (window.confirm(`確定要刪除選中的 ${selectedFiles.length} 個檔案嗎？`)) {
      onDelete(selectedFiles);
      setSelectedFiles([]);
    }
  };

  const handleBatchDownload = () => {
    if (selectedFiles.length === 0) return;
    
    const selectedFileObjects = files.filter(file => 
      selectedFiles.includes(file.id)
    );
    onDownload(selectedFileObjects);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">翻譯文件檢視</h2>
        
        {files.length > 0 && (
          <div className="flex items-center space-x-4">
            <button
              onClick={handleSelectAll}
              className="flex items-center text-sm text-gray-600 hover:text-gray-900"
            >
              <Checkbox 
                className="w-4 h-4 mr-2"
                checked={selectedFiles.length === files.length}
              />
              {selectedFiles.length === files.length ? '取消全選' : '全選'}
            </button>
            
            {selectedFiles.length > 0 && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleBatchDownload}
                  className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  下載所選 ({selectedFiles.length})
                </button>
                <button
                  onClick={handleBatchDelete}
                  className="px-3 py-1.5 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                >
                  刪除所選 ({selectedFiles.length})
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="space-y-4">
        {files.map((file) => (
          <div
            key={file.id}
            className="border rounded-lg overflow-hidden bg-white shadow-sm"
          >
            <div className="flex items-center justify-between px-4 py-3 bg-gray-50">
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={selectedFiles.includes(file.id)}
                  onChange={() => handleSelectFile(file.id)}
                  className="w-4 h-4"
                />
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
                {file.isEmbedded && (
                  <span className="text-sm px-2 py-1 rounded bg-blue-100 text-blue-600">
                    已加入知識庫
                  </span>
                )}
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

            {expandedFile === file.id && (
              <div className="p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium mb-2 text-gray-700">原文</h3>
                    <div 
                      className="bg-gray-50 p-4 rounded-lg whitespace-pre-wrap min-h-[200px] max-h-[500px] overflow-y-auto font-mono text-sm"
                      style={{ 
                        wordBreak: 'break-word',
                        lineHeight: '1.6'
                      }}
                    >
                      {file.originalContent}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-medium mb-2 text-gray-700">翻譯</h3>
                    <div 
                      className="bg-blue-50 p-4 rounded-lg whitespace-pre-wrap min-h-[200px] max-h-[500px] overflow-y-auto font-mono text-sm"
                      style={{ 
                        wordBreak: 'break-word',
                        lineHeight: '1.6'
                      }}
                    >
                      {file.translatedContent.replace(/\n\s*\n/g, '\n\n')}
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
