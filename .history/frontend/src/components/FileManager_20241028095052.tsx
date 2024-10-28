import React, { useState, useEffect } from 'react';
import { 
  Loader, 
  Trash2, 
  Search, 
  Upload, 
  FolderPlus, 
  Database, 
  Languages,
  ChevronRight,
  ChevronDown,
  Plus
} from 'lucide-react';

interface FileInfo {
  id: string;
  name: string;
  size: number;
  type: string;
  created_at: string;
  path: string;
  isDirectory: boolean;
}

interface FileManagerProps {
  knowledgeBases: Array<{ id: string; name: string }>;
  onBatchTranslateAndEmbed: (files: string[], knowledgeBaseId: string) => Promise<void>;
  onBatchEmbed: (files: string[], knowledgeBaseId: string) => Promise<void>;
}

export const FileManager: React.FC<FileManagerProps> = ({
  knowledgeBases,
  onBatchTranslateAndEmbed,
  onBatchEmbed
}) => {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPath, setCurrentPath] = useState('/');
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [showActionModal, setShowActionModal] = useState(false);
  const [selectedKnowledgeBase, setSelectedKnowledgeBase] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  // 獲取檔案列表
  const fetchFiles = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        path: currentPath,
        search: searchTerm
      });
      
      const response = await fetch(`http://localhost:5000/api/files?${params}`);
      if (response.ok) {
        const data = await response.json();
        setFiles(data);
      }
    } catch (error) {
      console.error('獲取檔案列表失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  // 創建新資料夾
  const handleCreateFolder = async () => {
    if (!newFolderName) return;

    try {
      const response = await fetch('http://localhost:5000/api/files/create_folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: `${currentPath}${newFolderName}`
        })
      });

      if (response.ok) {
        fetchFiles();
        setShowNewFolderModal(false);
        setNewFolderName('');
      }
    } catch (error) {
      console.error('創建資料夾失敗:', error);
    }
  };

  // 上傳檔案
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const formData = new FormData();
    Array.from(files).forEach(file => {
      formData.append('files', file);
    });
    formData.append('path', currentPath);

    try {
      const response = await fetch('http://localhost:5000/api/files/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (response.ok) {
        fetchFiles();
      }
    } catch (error) {
      console.error('檔案上傳失敗:', error);
    }
  };

  // 切換資料夾展開狀態
  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  // 處理檔案選擇
  const handleSelect = (file: FileInfo) => {
    if (file.isDirectory) {
      toggleFolder(file.path);
    } else {
      setSelectedFiles(prev => {
        if (prev.includes(file.id)) {
          return prev.filter(id => id !== file.id);
        } else {
          return [...prev, file.id];
        }
      });
    }
  };

  // 處理批次操作
  const handleBatchAction = async (action: 'translate' | 'direct') => {
    if (!selectedKnowledgeBase || selectedFiles.length === 0) return;

    try {
      if (action === 'translate') {
        await onBatchTranslateAndEmbed(selectedFiles, selectedKnowledgeBase);
      } else {
        await onBatchEmbed(selectedFiles, selectedKnowledgeBase);
      }
      setSelectedFiles([]);
      setShowActionModal(false);
    } catch (error) {
      console.error('批次處理失敗:', error);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [currentPath, searchTerm]);

  return (
    <div className="flex h-full">
      {/* 左側資料夾樹狀結構 */}
      <div className="w-64 border-r p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-medium">資料夾</h3>
          <button
            onClick={() => setShowNewFolderModal(true)}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-2">
          {files.filter(f => f.isDirectory).map(folder => (
            <div key={folder.path} className="pl-2">
              <button
                onClick={() => toggleFolder(folder.path)}
                className="flex items-center space-x-2 hover:bg-gray-100 w-full p-1 rounded"
              >
                {expandedFolders.has(folder.path) ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
                <span>{folder.name}</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 右側檔案列表 */}
      <div className="flex-1 p-4">
        <div className="mb-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-bold">檔案列表</h2>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜尋檔案..."
                className="pl-10 pr-4 py-2 border rounded-lg"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="flex space-x-4">
            <label className="px-4 py-2 bg-blue-500 text-white rounded-lg cursor-pointer hover:bg-blue-600">
              <input
                type="file"
                multiple
                className="hidden"
                onChange={handleFileUpload}
              />
              <Upload className="inline-block w-4 h-4 mr-2" />
              上傳檔案
            </label>
            {selectedFiles.length > 0 && (
              <button
                onClick={() => setShowActionModal(true)}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
              >
                處理選中檔案 ({selectedFiles.length})
              </button>
            )}
          </div>
        </div>

        {/* 檔案列表 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {files.filter(f => !f.isDirectory).map(file => (
            <div
              key={file.id}
              className={`p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer
                ${selectedFiles.includes(file.id) ? 'bg-blue-50' : ''}`}
              onClick={() => handleSelect(file)}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium truncate">{file.name}</h3>
                  <p className="text-sm text-gray-500">
                    {new Date(file.created_at).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-gray-500">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={selectedFiles.includes(file.id)}
                  onChange={() => handleSelect(file)}
                  onClick={e => e.stopPropagation()}
                  className="ml-2"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 新增資料夾模態框 */}
      {showNewFolderModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-96">
            <h3 className="text-lg font-bold mb-4">新增資料夾</h3>
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="資料夾名稱"
              className="w-full p-2 border rounded mb-4"
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowNewFolderModal(false)}
                className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200"
              >
                取消
              </button>
              <button
                onClick={handleCreateFolder}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                創建
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 處理檔案模態框 */}
      {showActionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-96">
            <h3 className="text-lg font-bold mb-4">選擇處理方式</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                選擇目標知識庫
              </label>
              <select
                className="w-full p-2 border rounded"
                value={selectedKnowledgeBase}
                onChange={(e) => setSelectedKnowledgeBase(e.target.value)}
              >
                <option value="">請選擇知識庫</option>
                {knowledgeBases.map(kb => (
                  <option key={kb.id} value={kb.id}>{kb.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => handleBatchAction('translate')}
                className="w-full py-3 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center justify-center"
              >
                <Languages className="w-5 h-5 mr-2" />
                翻譯後加入知識庫
              </button>
              <button
                onClick={() => handleBatchAction('direct')}
                className="w-full py-3 bg-green-500 text-white rounded hover:bg-green-600 flex items-center justify-center"
              >
                <Database className="w-5 h-5 mr-2" />
                直接加入知識庫
              </button>
            </div>

            <button
              onClick={() => setShowActionModal(false)}
              className="mt-4 w-full py-2 bg-gray-100 rounded hover:bg-gray-200"
            >
              取消
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
