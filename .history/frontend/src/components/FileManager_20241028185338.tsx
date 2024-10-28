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
  ChevronLeft,
  MessageSquare
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
  onBatchTranslateAndEmbed: (files: string[], knowledgeBaseId: string, folderPath?: string) => Promise<void>;
  onBatchEmbed: (files: string[], knowledgeBaseId: string, folderPath?: string) => Promise<void>;
  onModeChange: (mode: 'chat' | 'file') => void;
  onFileChat: (files: string[]) => void;
}

export const FileManager: React.FC<FileManagerProps> = ({
  knowledgeBases,
  onBatchTranslateAndEmbed,
  onBatchEmbed,
  onModeChange,
  onFileChat
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
  const [isCtrlPressed, setIsCtrlPressed] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

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

  // 創建新料夾
  const handleCreateFolder = async () => {
    if (!newFolderName) return;
    
    try {
      const response = await fetch('http://localhost:5000/api/files/create_folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: currentPath === '/' ? newFolderName : `${currentPath}/${newFolderName}`
        })
      });

      if (response.ok) {
        fetchFiles();
        setShowNewFolderModal(false);
        setNewFolderName('');
        setNotification({
          show: true,
          message: '資料夾創建成功',
          type: 'success'
        });
      }
    } catch (error) {
      console.error('創建資料夾失敗:', error);
      setNotification({
        show: true,
        message: '創建資料夾失敗',
        type: 'error'
      });
    }
  };

  // 修改 notification 的設置方式
  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({
      show: true,
      message,
      type
    });

    // 3秒後自動關閉通知
    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }));
    }, 3000);
  };

  // 在上傳檔案的處理中使用新的通知函數
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const maxSize = 10 * 1024 * 1024;
    const allowedTypes = ['application/pdf', 'text/plain', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    
    const validFiles = Array.from(files).filter(file => {
      if (file.size > maxSize) {
        showNotification(`檔案 ${file.name} 超過大小限制 (10MB)`, 'error');
        return false;
      }
      if (!allowedTypes.includes(file.type)) {
        showNotification(`檔案 ${file.name} 類型不支援`, 'error');
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    const formData = new FormData();
    validFiles.forEach(file => {
      formData.append('files', file);
    });
    formData.append('path', currentPath);

    try {
      setIsUploading(true);
      const response = await fetch('http://localhost:5000/api/files/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (response.ok) {
        fetchFiles();
        showNotification('檔案上傳成功', 'success');
      }
    } catch (error) {
      console.error('檔案上傳失敗:', error);
      showNotification('檔案上傳失敗', 'error');
    } finally {
      setIsUploading(false);
      closeContextMenu();
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

  // 修改檔案選擇邏輯
  const handleSelect = (file: FileInfo, e?: React.MouseEvent) => {
    if (file.isDirectory) {
      toggleFolder(file.path);
    } else {
      setSelectedFiles(prev => {
        if (isCtrlPressed || e?.ctrlKey || e?.metaKey) {
          // Ctrl/Cmd + 點擊：切換選擇
          return prev.includes(file.id)
            ? prev.filter(id => id !== file.id)
            : [...prev, file.id];
        } else {
          // 一般點擊：單選
          return prev.includes(file.id) ? [] : [file.id];
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
          message: '已成功加知識庫',
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

  // 修改右鍵選單
  const handleContextMenu = useCallback((
    e: React.MouseEvent,
    type: 'background' | 'file' | 'folder',
    target?: FileInfo
  ) => {
    e.preventDefault();
    if (type === 'file' && target) {
      // 果點擊的檔案還沒被選中，先選中它
      if (!selectedFiles.includes(target.id)) {
        if (isCtrlPressed || e.ctrlKey || e.metaKey) {
          setSelectedFiles(prev => [...prev, target.id]);
        } else {
          setSelectedFiles([target.id]);
        }
      }
    }
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      type,
      target
    });
  }, [selectedFiles, isCtrlPressed]);

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
    if (!window.confirm('確定要刪除此資料夾及其所有內容嗎？操作無法恢復。')) {
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

  // 監聽按鍵事件
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Control' || e.key === 'Meta') {
        setIsCtrlPressed(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Control' || e.key === 'Meta') {
        setIsCtrlPressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

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
              返上一層
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
          <button
            onClick={() => setShowNewFolderModal(true)}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg cursor-pointer hover:bg-gray-200"
          >
            <FolderPlus className="inline-block w-4 h-4 mr-2" />
            新增資料夾
          </button>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {/* 資料夾列表 */}
          {files.filter(f => f.isDirectory).map(folder => (
            <div
              key={folder.id}
              className="group relative p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setCurrentPath(folder.path)}
              onContextMenu={(e) => handleContextMenu(e, 'folder', folder)}
            >
              <div className="flex flex-col items-center">
                <FolderPlus className="w-12 h-12 text-yellow-500 mb-2" />
                <span className="text-center truncate w-full">{folder.name}</span>
              </div>
            </div>
          ))}

          {/* 檔案列表 */}
          {files.filter(f => !f.isDirectory).map(file => (
            <div
              key={file.id}
              className={`group relative p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer
                ${selectedFiles.includes(file.id) ? 'bg-blue-50 border-blue-200' : ''}`}
              onClick={(e) => handleSelect(file, e)}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleContextMenu(e, 'file', file);
              }}
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
          className="fixed bg-white rounded-lg shadow-lg py-2 min-w-[240px] z-50"
          style={{ 
            top: `${contextMenu.y}px`, 
            left: `${contextMenu.x}px`,
            maxWidth: '300px'
          }}
          onClick={e => e.stopPropagation()}
        >
          {contextMenu.type === 'file' ? (
            <>
              <button
                className="w-full px-6 py-2.5 text-left hover:bg-gray-100 flex items-center"
                onClick={() => {
                  setCurrentAction('translate');
                  setShowActionModal(true);
                  closeContextMenu();
                }}
              >
                <Languages className="w-5 h-5 mr-3" />
                <span className="flex-1">翻譯後加入知識庫 ({selectedFiles.length} 個檔案)</span>
              </button>
              <button
                className="w-full px-6 py-2.5 text-left hover:bg-gray-100 flex items-center"
                onClick={() => {
                  setCurrentAction('direct');
                  setShowActionModal(true);
                  closeContextMenu();
                }}
              >
                <Database className="w-5 h-5 mr-3" />
                <span className="flex-1">直接加入知識庫 ({selectedFiles.length} 個檔案)</span>
              </button>
              <button
                className="w-full px-6 py-2.5 text-left hover:bg-gray-100 flex items-center"
                onClick={() => {
                  onModeChange("chat");
                  onFileChat(selectedFiles);
                  closeContextMenu();
                }}
              >
                <MessageSquare className="w-5 h-5 mr-3" />
                <span className="flex-1">開始檔案對話 ({selectedFiles.length} 個檔案)</span>
              </button>
              <div className="border-t my-1"></div>
              <button
                className="w-full px-6 py-2.5 text-left hover:bg-gray-100 flex items-center text-red-500"
                onClick={() => {
                  selectedFiles.forEach(fileId => handleDeleteFile(fileId));
                  closeContextMenu();
                }}
              >
                <Trash2 className="w-5 h-5 mr-3" />
                <span className="flex-1">刪除選中檔案 ({selectedFiles.length})</span>
              </button>
            </>
          ) : (
            <button
              className="w-full px-6 py-2.5 text-left hover:bg-gray-100 flex items-center"
              onClick={() => {
                const fileInput = document.createElement('input');
                fileInput.type = 'file';
                fileInput.multiple = true;
                fileInput.onchange = (e) => handleFileUpload(e as any);
                fileInput.click();
                closeContextMenu();
              }}
            >
              <Upload className="w-5 h-5 mr-3" />
              <span className="flex-1">上傳檔案</span>
            </button>
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
            <h3 className="text-lg font-bold mb-4">
              {contextMenu?.type === 'folder' ? '處理資料夾' : '處理檔案'}
            </h3>
            
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

            {contextMenu?.type === 'folder' && contextMenu.target && (
              <p className="text-sm text-gray-500 mb-4">
                將處理資料夾: {contextMenu.target.path}
              </p>
            )}

            {processing && (
              <div className="mb-4">
                <div className="relative pt-1">
                  <div className="flex mb-2 items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-200">
                        處理進度
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-semibold inline-block text-blue-600">
                        {progress}%
                      </span>
                    </div>
                  </div>
                  <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-100">
                    <div
                      style={{ width: `${progress}%`, transition: 'width 0.5s ease-in-out' }}
                      className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"
                    ></div>
                  </div>
                  <p className="text-sm text-gray-500 text-center">
                    {progress < 30 && "準備處理文件..."}
                    {progress >= 30 && progress < 60 && "正在翻譯文件..."}
                    {progress >= 60 && progress < 90 && "正在加入知識庫..."}
                    {progress >= 90 && "即將完成..."}
                  </p>
                </div>
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
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="absolute inset-0 bg-black bg-opacity-30" />
          <div
            className={`relative px-6 py-4 rounded-lg shadow-lg ${
              notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
            } text-white transform transition-all duration-300 ease-out`}
          >
            <div className="flex items-center space-x-2">
              {notification.type === 'success' ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
              <span className="text-lg font-medium">{notification.message}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
