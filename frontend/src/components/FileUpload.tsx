// src/components/FileUpload.tsx
import React, { useState } from 'react';
import { Upload, X } from 'lucide-react';

interface FileUploadProps {
  onFileUpload: (files: File[]) => void;
  uploadProgress: {[key: string]: number};
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileUpload, uploadProgress }) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  
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
      const newFiles = Array.from(e.dataTransfer.files);
      setSelectedFiles(prev => [...prev, ...newFiles]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...newFiles]);
    }
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
        <p className="text-sm text-gray-500 mt-1">支援多個檔案同時上傳</p>
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
            <h3 className="font-medium">已選擇的檔案</h3>
            <div className="mt-2 space-y-2">
              {selectedFiles.map((file, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded"
                >
                  <span className="text-sm truncate">{file.name}</span>
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
              ))}
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleUpload();
            }}
            className="w-full py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            開始上傳與翻譯({selectedFiles.length}個檔案)
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
