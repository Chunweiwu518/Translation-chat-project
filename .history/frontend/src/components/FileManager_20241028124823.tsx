import React, { useState, useEffect, useCallback } from 'react';
import { 
  Loader, 
  Trash2, 
  Search, 
  Upload, 
  FolderPlus, 
  Database, 
  Languages,
  MoreVertical,
  File as FileIcon,
  ChevronLeft
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
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    type: 'background' | 'file' | 'folder';
    target?: FileInfo;
  } | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentAction, setCurrentAction] = useState<'translate' | 'direct'>('direct');
  const [notification, setNotification] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error';
  }>({ show: false, message: '', type: 'success' });

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
        closeContextMenu();  // 添加這行，上傳成功後關閉右鍵選單
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

  // 理批次操作
  const handleBatchAction = async (action: 'translate' | 'direct') => {
    if (!selectedKnowledgeBase || selectedFiles.length === 0) return;

    setProcessing(true);
    setProgress(0);
    
    try {
      if (action === 'translate') {
        setProgress(25);
        await onBatchTranslateAndEmbed(selectedFiles, selectedKnowledgeBase);
        setProgress(100);
        setNotification({
          show: true,
          message: '翻譯完成！請在翻譯界面查看結果',
          type: 'success'
        });
      } else {
        setProgress(25);
        await onBatchEmbed(selectedFiles, selectedKnowledgeBase);
        setProgress(100);
        setNotification({
          show: true,
          message: '已成功加入知識庫',
          type: 'success'
        });
      }
      setSelectedFiles([]);
      setShowActionModal(false);
    } catch (error) {
      console.error('批次處理失敗:', error);
      setNotification({
        show: true,
        message: '處理失敗，請稍後重試',
        type: 'error'
      });
    } finally {
      setProcessing(false);
      setProgress(0);
      // 3後自動關閉通知
      setTimeout(() => {
        setNotification(prev => ({ ...prev, show: false }));
      }, 3000);
    }
  };

  // 處理右鍵選單
  const handleContextMenu = useCallback((
    e: React.MouseEvent,
    type: 'background' | 'file' | 'folder',
    target?: FileInfo
  ) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      type,
      target
    });
  }, []);

  // 關閉右鍵選單
  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  // 點擊其他地方時關閉選單
  useEffect(() => {
    const handleClick = () => closeContextMenu();
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [closeContextMenu]);

  useEffect(() => {
    fetchFiles();
  }, [currentPath, searchTerm]);

  // 修改刪除檔案的函數
  const handleDeleteFile = async (fileId: string) => {
    try {
      // 處理檔案路徑，確保正確編碼
      const encodedFileId = encodeURIComponent(fileId);
      const response = await fetch(`http://localhost:5000/api/files/${encodedFileId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        fetchFiles();
        closeContextMenu();
      } else if (response.status === 404) {
        // 如果檔案在資料夾中，嘗試使用完整路徑刪除
        const folderPath = currentPath === '/' ? '' : currentPath;
        const fullPath = `${folderPath}/${fileId}`.replace(/^\/+/, '');
        const encodedFullPath = encodeURIComponent(fullPath);
        
        const secondResponse = await fetch(`http://localhost:5000/api/files/${encodedFullPath}`, {
          method: 'DELETE'
        });
        
        if (secondResponse.ok) {
          fetchFiles();
          closeContextMenu();
        } else {
          console.error('刪除檔案失敗');
        }
      }
    } catch (error) {
      console.error('刪除檔案失敗:', error);
    }
  };

  // 添加刪除資料夾的函數
  const handleDeleteFolder = async (folderPath: string) => {
    if (!window.confirm('確定要刪除此資料夾及其所有內容嗎？此操作無法恢復。')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/files/folder/${folderPath}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        fetchFiles();
        closeContextMenu();
      }
    } catch (error) {
      console.error('刪除資料夾失敗:', error);
    }
  };

  // 添加返回上一層的函數
  const handleGoBack = () => {
    const parentPath = currentPath.split('/').slice(0, -1).join('/');
    setCurrentPath(parentPath || '/');
  };

  return (
    <div className="h-full flex flex-col relative" onContextMenu={(e) => handleContextMenu(e, 'background')}>
      {/* 頂部工具列 */}
      <div className="p-4 border-b flex justify-between items-center">
        <div className="flex items-center space-x-4">
          {/* 添加返回按鈕 */}
          {currentPath !== '/' && (
            <button
              onClick={handleGoBack}
              className="p-2 hover:bg-gray-100 rounded-lg flex items-center text-gray-600"
              title="返回上一層"
            >
              <ChevronLeft className="w-5 h-5" />
              返回上一層
            </button>
          )}
          <h2 className="text-xl font-bold">檔案管理</h2>
          {/* 顯示當前路徑 */}
          <span className="text-sm text-gray-500">
            {currentPath === '/' ? '根目錄' : currentPath}
          </span>
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
        </div>
      </div>

      {/* 檔案列表 */}
      <div className="flex-1 overflow-auto p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4"
             onContextMenu={(e) => {
               e.preventDefault();
               handleContextMenu(e, 'background');
             }}>
          {/* 資料夾 */}
          {files.filter(f => f.isDirectory).map(folder => (
            <div
              key={folder.path}
              className="group relative p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleContextMenu(e, 'folder', folder);
              }}
              onClick={() => setCurrentPath(folder.path)}
            >
              <div className="flex flex-col items-center">
                <FolderPlus className="w-12 h-12 text-blue-500 mb-2" />
                <span className="text-center truncate w-full">{folder.name}</span>
              </div>
            </div>
          ))}

          {/* 檔案 */}
          {files.filter(f => !f.isDirectory).map(file => (
            <div
              key={file.id}
              className={`group relative p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer
                ${selectedFiles.includes(file.id) ? 'bg-blue-50 border-blue-200' : ''}`}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleContextMenu(e, 'file', file);
              }}
              onClick={() => handleSelect(file)}
            >
              <div className="flex flex-col items-center">
                <FileIcon className="w-12 h-12 text-gray-500 mb-2" />
                <span className="text-center truncate w-full">{file.name}</span>
                <span className="text-xs text-gray-500">
                  {(file.size / 1024).toFixed(2)} KB
                </span>
              </div>
              <input
                type="checkbox"
                checked={selectedFiles.includes(file.id)}
                onChange={() => handleSelect(file)}
                className="absolute top-2 left-2 opacity-0 group-hover:opacity-100"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          ))}
        </div>
      </div>

      {/* 右鍵選單 */}
      {contextMenu && (
        <div
          className="fixed bg-white rounded-lg shadow-lg py-2 min-w-[160px] z-50"
          style={{ 
            top: `${contextMenu.y}px`, 
            left: `${contextMenu.x}px`,
            maxWidth: '200px'
          }}
          onClick={e => e.stopPropagation()}
        >
          {contextMenu.type === 'background' && (
            <>
              <button
                className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center"
                onClick={() => setShowNewFolderModal(true)}
              >
                <FolderPlus className="w-4 h-4 mr-2" />
                新增資料夾
              </button>
              <label className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center cursor-pointer">
                <Upload className="w-4 h-4 mr-2" />
                上傳檔案
                <input
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </label>
            </>
          )}
          
          {contextMenu.type === 'file' && contextMenu.target && (
            <>
              <button
                className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center"
                onClick={() => {
                  if (contextMenu.target) {
                    setSelectedFiles([contextMenu.target.id]);
                    // 設置當前動作類型為 translate
                    const currentAction = 'translate';
                    setShowActionModal(true);
                    // 在模態框中保存當前動作類型
                    setCurrentAction(currentAction);
                    closeContextMenu();
                  }
                }}
              >
                <Languages className="w-4 h-4 mr-2" />
                翻譯後加入知識庫
              </button>
              <button
                className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center"
                onClick={() => {
                  if (contextMenu.target) {
                    setSelectedFiles([contextMenu.target.id]);
                    // 設置當前動作類型為 direct
                    const currentAction = 'direct';
                    setShowActionModal(true);
                    // 在模態框中保存當前動作類型
                    setCurrentAction(currentAction);
                    closeContextMenu();
                  }
                }}
              >
                <Database className="w-4 h-4 mr-2" />
                直接加入知識庫
              </button>
              <div className="border-t my-1"></div>
              <button
                className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center text-red-500"
                onClick={() => {
                  handleDeleteFile(contextMenu.target!.id);
                  closeContextMenu();
                }}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                刪除檔案
              </button>
            </>
          )}

          {contextMenu.type === 'folder' && contextMenu.target && (
            <>
              <button
                className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center"
                onClick={() => {
                  setCurrentPath(contextMenu.target!.path);
                  closeContextMenu();
                }}
              >
                <FolderPlus className="w-4 h-4 mr-2" />
                開啟資料夾
              </button>
              <button
                className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center text-red-500"
                onClick={() => {
                  handleDeleteFolder(contextMenu.target!.path);
                  closeContextMenu();
                }}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                刪除資料夾
              </button>
            </>
          )}
        </div>
      )}

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
            <h3 className="text-lg font-bold mb-4">選擇目標知識庫</h3>
            
            <div className="mb-4">
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

            {processing && (
              <div className="mb-4">
                <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-sm text-gray-500 text-center">處理中... {progress}%</p>
              </div>
            )}

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowActionModal(false)}
                className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200"
                disabled={processing}
              >
                取消
              </button>
              {/* 確認按鈕 */}
              <button
                onClick={() => handleBatchAction(currentAction)}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                disabled={!selectedKnowledgeBase || processing}
              >
                確認加入
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 通知元素 */}
      {notification.show && (
        <div
          className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg transition-all duration-300 ${
            notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
          } text-white`}
        >
          {notification.message}
        </div>
      )}
    </div>
  );
};
