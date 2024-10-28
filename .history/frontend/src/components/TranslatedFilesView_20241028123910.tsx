import React from 'react';
import { TranslatedFile } from '../types';

interface TranslatedFilesViewProps {
  files: TranslatedFile[];
}

export const TranslatedFilesView: React.FC<TranslatedFilesViewProps> = ({ files }) => {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">翻譯文件檢視</h2>
      <div className="space-y-6">
        {files.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>尚無翻譯文件</p>
          </div>
        ) : (
          files.map((file) => (
            <div key={file.id} className="bg-white rounded-lg shadow-sm p-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold">{file.name}</h3>
                <p className="text-sm text-gray-500">
                  {file.isEmbedded ? "已加入知識庫" : "未加入知識庫"}
                </p>
              </div>
              
              <div className="space-y-4">
                {file.originalContent && (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">原文</h4>
                    <div className="p-4 bg-gray-50 rounded-lg text-sm whitespace-pre-wrap">
                      {file.originalContent}
                    </div>
                  </div>
                )}
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">翻譯結果</h4>
                  <div className="p-4 bg-gray-50 rounded-lg text-sm whitespace-pre-wrap">
                    {file.translatedContent}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
