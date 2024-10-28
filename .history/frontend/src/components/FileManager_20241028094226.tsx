import React, { useState, useEffect } from 'react';
import { Loader, Trash2, Search, Upload, FolderPlus, Database, Languages } from 'lucide-react';

interface FileInfo {
  id: string;
  name: string;
  size: number;
  type: string;
  created_at: string;
  category?: string;
  tags: string[];
  isDirectory?: boolean;
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
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [categories] = useState(['文件', '圖片', '其他']);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [selectedKnowledgeBase, setSelectedKnowledgeBase] = useState<string>('');
  const [showActionModal, setShowActionModal] = useState(false);

  // 獲取檔案列表
  const fetchFiles = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedCategory) params.append('category', selectedCategory);
      
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

  // 上傳檔案
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    if (selectedCategory) {
      formData.append('category', selectedCategory);
    }

    try {
      // 修改為正確的上傳端點
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

  // 刪除檔案
  const handleDeleteFile = async (fileId: string) => {
    try {
      const response = await fetch(`http://localhost:5000/api/files/${fileId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setFiles(files.filter(f => f.id !== fileId));
      }
    } catch (error) {
      console.error('檔案刪除失敗:', error);
    }
  };

  // 處理檔案/資料夾選擇
  const handleSelect = (fileId: string, isDirectory: boolean) => {
    if (isDirectory) {
      // 如果是資料夾，選擇其下所有檔案
      const folderFiles = files.filter(f => 
        f.category === fileId && !f.isDirectory
      ).map(f => f.id);
      
      setSelectedFiles(prev => {
        const isSelected = selectedFiles.some(id => folderFiles.includes(id));
        if (isSelected) {
          return prev.filter(id => !folderFiles.includes(id));
        } else {
          return [...prev, ...folderFiles];
        }
      });
    } else {
      setSelectedFiles(prev => {
        if (prev.includes(fileId)) {
          return prev.filter(id => id !== fileId);
        } else {
          return [...prev, fileId];
        }
      });
    }
  };

  // 處理批次操作
  const handleBatchAction = async (action: 'translate' | 'embed') => {
    if (!selectedKnowledgeBase || selectedFiles.length === 0) return;

    try {
      if (action === 'translate') {
        await onBatchTranslateAndEmbed(selectedFiles, selectedKnowledgeBase);
      } else {
        await onBatchEmbed(selectedFiles, selectedKnowledgeBase);
      }
      // 清除選擇
      setSelectedFiles([]);
      setShowActionModal(false);
    } catch (error) {
      console.error('批次處理失敗:', error);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [searchTerm, selectedCategory]);

  return (
    <div className="p-4">
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-xl font-bold">檔案管理</h2>
        <div className="flex space-x-4">
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
          <select
            className="px-4 py-2 border rounded-lg"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">所有分類</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
          <label className="px-4 py-2 bg-blue-500 text-white rounded-lg cursor-pointer hover:bg-blue-600">
            <input
              type="file"
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

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader className="w-8 h-8 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map(category => (
            <div
              key={category}
              className={`p-4 border rounded-lg hover:shadow-md transition-shadow 
                ${selectedFiles.some(id => 
                  files.find(f => f.id === id)?.category === category
                ) ? 'bg-blue-50' : ''}`}
              onClick={() => handleSelect(category, true)}
            >
              <div className="flex items-center space-x-2">
                <FolderPlus className="w-6 h-6 text-blue-500" />
                <h3 className="font-medium">{category}</h3>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {files.filter(f => f.category === category).length} 個檔案
              </p>
            </div>
          ))}

          {files.map(file => (
            <div
              key={file.id}
              className={`p-4 border rounded-lg hover:shadow-md transition-shadow
                ${selectedFiles.includes(file.id) ? 'bg-blue-50' : ''}`}
              onClick={() => handleSelect(file.id, false)}
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
                <button
                  onClick={() => handleDeleteFile(file.id)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-full"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              {file.category && (
                <span className="mt-2 inline-block px-2 py-1 text-xs bg-gray-100 rounded">
                  {file.category}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 批次操作模態框 */}
      {showActionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-96">
            <h3 className="text-lg font-bold mb-4">選擇操作</h3>
            
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

            <div className="flex space-x-4">
              <button
                onClick={() => handleBatchAction('translate')}
                className="flex-1 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                <Languages className="w-4 h-4 inline-block mr-2" />
                翻譯並加入知識庫
              </button>
              <button
                onClick={() => handleBatchAction('embed')}
                className="flex-1 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                <Database className="w-4 h-4 inline-block mr-2" />
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
