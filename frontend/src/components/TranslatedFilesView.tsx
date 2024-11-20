import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Trash2, Download } from 'lucide-react';
import { TranslatedFile } from '../types';

interface TranslatedFilesViewProps {
  files: TranslatedFile[]; // 翻譯文件的陣列
  onDelete: (id: string) => void; // 刪除文件的函數
  onDownload: (file: TranslatedFile) => void; // 下載文件的函數
}

export const TranslatedFilesView: React.FC<TranslatedFilesViewProps> = ({
  files,
  onDelete,
  onDownload,
}) => {
  const [expandedFile, setExpandedFile] = useState<string | null>(null); // 用於追蹤展開的文件ID
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]); // 用於追蹤選中的文件ID

  // 切換展開或收起文件內容
  const handleToggleExpand = (fileId: string) => {
    setExpandedFile(expandedFile === fileId ? null : fileId);
  };

  // 處理全選/取消全選
  const handleSelectAll = () => {
    if (selectedFiles.length === files.length) {
      setSelectedFiles([]); // 如果已全選，則取消全選
    } else {
      setSelectedFiles(files.map(file => file.id)); // 否則選擇所有文件
    }
  };

  // 處理單個檔案選擇
  const handleSelectFile = (fileId: string) => {
    setSelectedFiles(prev => {
      if (prev.includes(fileId)) {
        return prev.filter(id => id !== fileId); // 如果已選中，則取消選擇
      } else {
        return [...prev, fileId]; // 否則加入選中
      }
    });
  };

  // 批次刪除
  const handleBatchDelete = async () => {
    if (!window.confirm(`確定要刪除選中的 ${selectedFiles.length} 個檔案嗎？`)) {
      return; // 確認刪除操作
    }
    
    try {
      await Promise.all(selectedFiles.map(fileId => onDelete(fileId))); // 刪除所有選中的文件
      setSelectedFiles([]); // 清空選中列表
    } catch (error) {
      console.error('批次刪除失敗:', error); // 錯誤處理
    }
  };

  // 批次下載
  const handleBatchDownload = async () => {
    try {
      await Promise.all(selectedFiles.map(fileId => {
        const file = files.find(f => f.id === fileId);
        if (file) {
          return onDownload(file); // 下載所有選中的文件
        }
      }));
    } catch (error) {
      console.error('批次下載失敗:', error); // 錯誤處理
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">翻譯文件檢視</h2> {/* 頁面標題 */}
        
        {/* 操作按鈕區 */}
        <div className="flex items-center space-x-4">
          <button
            onClick={handleSelectAll}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            {selectedFiles.length === files.length ? '取消全選' : '全選'} {/* 全選/取消全選按鈕 */}
          </button>
          
          {selectedFiles.length > 0 && ( // 如果有選中的文件，顯示批次操作按鈕
            <>
              <button
                onClick={handleBatchDownload}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center"
              >
                <Download className="w-4 h-4 mr-2" />
                下載所選 ({selectedFiles.length}) {/* 批次下載按鈕 */}
              </button>
              <button
                onClick={handleBatchDelete}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                刪除所選 ({selectedFiles.length}) {/* 批次刪除按鈕 */}
              </button>
            </>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {files.map((file) => ( // 遍歷每個翻譯文件
          <div
            key={file.id}
            className={`border rounded-lg overflow-hidden bg-white shadow-sm
              ${selectedFiles.includes(file.id) ? 'border-blue-500 bg-blue-50' : ''}`} // 根據選中狀態改變樣式
          >
            {/* 文件標題列 */}
            <div className="flex items-center justify-between px-4 py-3 bg-gray-50">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectedFiles.includes(file.id)} // 根據選中狀態設置勾選框
                  onChange={() => handleSelectFile(file.id)}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <button
                  onClick={() => handleToggleExpand(file.id)}
                  className="hover:bg-gray-200 p-1 rounded"
                >
                  {expandedFile === file.id ? (
                    <ChevronUp className="w-5 h-5" /> // 展開圖示
                  ) : (
                    <ChevronDown className="w-5 h-5" /> // 收起圖示
                  )}
                </button>
                <span className="font-medium">{file.name}</span> {/* 文件名稱 */}
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
                    : '處理中'} {/* 文件狀態 */}
                </span>
              </div>

              {/* 單個檔案的操作按鈕 */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => onDownload(file)}
                  className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg"
                  title="下載檔案"
                >
                  <Download className="w-5 h-5" />
                </button>
                <button
                  onClick={() => onDelete(file.id)}
                  className="p-2 text-red-600 hover:bg-red-100 rounded-lg"
                  title="刪除檔案"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* 展開的內容 */}
            {expandedFile === file.id && (
              <div className="p-4 border-t">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">原文內容：</h4> {/* 原文內容標題 */}
                    <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto">
                      {file.originalContent} {/* 顯示原文內容 */}
                    </pre>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">翻譯內容：</h4> {/* 翻譯內容標題 */}
                    <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto">
                      {file.translatedContent} {/* 顯示翻譯內容 */}
                    </pre>
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
