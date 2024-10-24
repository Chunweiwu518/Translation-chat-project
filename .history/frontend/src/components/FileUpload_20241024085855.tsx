// src/components/FileUpload.tsx
import React, { useState } from 'react';
import { Upload, X, Check } from 'lucide-react';
import { FileWithOptions } from '../types';

interface FileUploadProps {
  onFileUpload: (files: FileWithOptions[]) => void;
  uploadProgress: {[key: string]: number};
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileUpload, uploadProgress }) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileWithOptions[]>([]);
  
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files) {
      const newFiles = Array.from(e.dataTransfer.files).map(file => ({
        id: `${Date.now()}-${file.name}`,
        file,
        name: file.name,
        needTranslation: true,
        status: 'pending' as const,
        progress: 0,
        selected: false
      }));
      setSelectedFiles(prev => [...prev, ...newFiles]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map(file => ({
        id: `${Date.now()}-${file.name}`,
        file,
        name: file.name,
        needTranslation: true,
        status: 'pending' as const,
        progress: 0,
        selected: false
      }));
      setSelectedFiles(prev => [...prev, ...newFiles]);
    }
  };

  const handleToggleTranslation = (fileId: string) => {
    setSelectedFiles(prev =>
      prev.map(file =>
        file.id === fileId
          ? { ...file, needTranslation: !file.needTranslation }
          : file
      )
    );
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = () => {
    if (selectedFiles.length > 0) {
      onFileUpload(selectedFiles);
      setSelectedFiles([]);
    }
  };

  return (
    <div>
      <div
        className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer
          ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => document.getElementById('fileInput')?.click()}
      >
        <Upload className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2">拖拽檔案到此處或點擊上傳</p>
        <p className="text-sm text-gray-500 mt-1">支援 PDF、TXT、DOCX 格式</p>
        <input
          id="fileInput"
          type="file"
          onChange={handleFileInput}
          className="hidden"
          accept=".pdf,.txt,.docx"
          multiple
        />
      </div>

      {selectedFiles.length > 0 && (
        <div className="mt-4">
          <div className="mb-4">
            <h3 className="font-medium mb-2">已選擇的檔案</h3>
            <div className="mt-2 space-y-2">
              {selectedFiles.map((file, index) => (
                <div 
                  key={file.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center flex-1 min-w-0 mr-4">
                    <span className="text-sm truncate">{file.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleTranslation(file.id);
                      }}
                      className={`px-3 py-1 rounded-full text-xs transition-colors ${
                        file.needTranslation
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {file.needTranslation ? '需要翻譯' : '無需翻譯'}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveFile(index);
                      }}
                      className="p-1 hover:bg-gray-200 rounded"
                    >
                      <X className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <button
            onClick={handleUpload}
            className="w-full py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            開始處理 ({selectedFiles.length} 個檔案)
          </button>
        </div>
      )}

      {/* 上傳進度顯示 */}
      {Object.entries(uploadProgress).map(([fileName, progress]) => (
        <div key={fileName} className="mt-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="truncate">{fileName}</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};