// src/components/BatchFileProcessor.tsx
import React, { useState } from 'react';
import { Check, Loader } from 'lucide-react';
import { TranslatedFile } from '../types';

interface BatchFileProcessorProps {
  files: TranslatedFile[];
  knowledgeBases: Array<{id: string; name: string}>;
  onBatchEmbed: (fileIds: string[], knowledgeBaseId: string) => void;
}

export const BatchFileProcessor: React.FC<BatchFileProcessorProps> = ({
  files,
  knowledgeBases,
  onBatchEmbed
}) => {
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [selectedKB, setSelectedKB] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const nonEmbeddedFiles = files.filter(f => !f.isEmbedded);

  const handleSelectAll = () => {
    if (selectedFiles.length === nonEmbeddedFiles.length) {
      setSelectedFiles([]);
    } else {
      setSelectedFiles(nonEmbeddedFiles.map(f => f.id));
    }
  };

  const handleCheckFile = (fileId: string) => {
    setSelectedFiles(prev => 
      prev.includes(fileId) 
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    );
  };

  const handleProcess = async () => {
    if (selectedFiles.length > 0 && selectedKB) {
      setIsProcessing(true);
      try {
        await onBatchEmbed(selectedFiles, selectedKB);
        // 成功處理後清空選擇
        setSelectedFiles([]);
        setSelectedKB('');
      } catch (error) {
        console.error('Batch processing error:', error);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  if (nonEmbeddedFiles.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm">
      <div className="mb-4">
        <h3 className="font-semibold mb-2">批次處理</h3>
        <select
          value={selectedKB}
          onChange={(e) => setSelectedKB(e.target.value)}
          className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isProcessing}
        >
          <option value="">選擇目標知識庫</option>
          {knowledgeBases.map(kb => (
            <option key={kb.id} value={kb.id}>{kb.name}</option>
          ))}
        </select>
      </div>

      <div className="mb-3">
        <button
          onClick={handleSelectAll}
          className="text-sm text-blue-500 hover:text-blue-600"
          disabled={isProcessing || nonEmbeddedFiles.length === 0}
        >
          {selectedFiles.length === nonEmbeddedFiles.length ? '取消全選' : '全選'}
        </button>
      </div>

      <div className="space-y-2 max-h-60 overflow-y-auto mb-4">
        {nonEmbeddedFiles.map(file => (
          <div
            key={file.id}
            className="flex items-center p-2 hover:bg-gray-50 rounded"
          >
            <input
              type="checkbox"
              checked={selectedFiles.includes(file.id)}
              onChange={() => handleCheckFile(file.id)}
              disabled={isProcessing}
              className="mr-3 h-4 w-4 text-blue-500 rounded border-gray-300 
                focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700 truncate" title={file.name}>
              {file.name}
            </span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
        <span>已選擇 {selectedFiles.length} 個檔案</span>
        {selectedFiles.length > 0 && selectedKB && (
          <span>目標: {knowledgeBases.find(kb => kb.id === selectedKB)?.name}</span>
        )}
      </div>

      <button
        onClick={handleProcess}
        disabled={selectedFiles.length === 0 || !selectedKB || isProcessing}
        className={`w-full py-2 px-4 rounded flex items-center justify-center
          ${isProcessing 
            ? 'bg-gray-300 cursor-not-allowed'
            : selectedFiles.length > 0 && selectedKB
              ? 'bg-blue-500 hover:bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
      >
        {isProcessing ? (
          <>
            <Loader className="w-4 h-4 animate-spin mr-2" />
            處理中...
          </>
        ) : (
          <>
            {selectedFiles.length > 0 && <Check className="w-4 h-4 mr-2" />}
            {`處理選中的檔案 (${selectedFiles.length})`}
          </>
        )}
      </button>

      {isProcessing && (
        <p className="text-sm text-gray-500 mt-2 text-center">
          請稍候，正在處理檔案...
        </p>
      )}
    </div>
  );
};