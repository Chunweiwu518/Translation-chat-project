import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { TranslatedFile } from "../types";

interface TranslatedFilesProps {
  files: TranslatedFile[];
  onEmbed: (fileId: string, knowledgeBaseId?: string) => void;
}

export const TranslatedFiles: React.FC<TranslatedFilesProps> = ({
  files,
  onEmbed,
}) => {
  const [expandedFileId, setExpandedFileId] = useState<string | null>(null);

  const toggleExpand = (fileId: string) => {
    setExpandedFileId(expandedFileId === fileId ? null : fileId);
  };

  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold mb-4">處理完成的文件</h3>
      <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
        {files.map((file) => (
          <div
            key={file.id}
            className="border rounded-lg hover:shadow-md transition-shadow bg-white"
          >
            <div className="p-4 flex items-center justify-between">
              <div>
                <h4 className="font-medium">{file.name}</h4>
                <p className="text-sm text-gray-500">
                  狀態: {file.isEmbedded ? "已加入知識庫" : "未加入知識庫"}
                </p>
              </div>
              <div className="space-x-2 flex items-center">
                <button
                  onClick={() => toggleExpand(file.id)}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                >
                  {expandedFileId === file.id ? (
                    <ChevronUp className="w-5 h-5" />
                  ) : (
                    <ChevronDown className="w-5 h-5" />
                  )}
                </button>
                {!file.isEmbedded && (
                  <button
                    onClick={() => onEmbed(file.id)}
                    className="px-3 py-1 text-sm bg-blue-500 text-white hover:bg-blue-600 rounded transition-colors"
                    disabled={file.embeddingProgress !== undefined}
                  >
                    加入知識庫
                  </button>
                )}
              </div>
            </div>

            {!file.isEmbedded && file.embeddingProgress !== undefined && (
              <div className="px-4 pb-2">
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${file.embeddingProgress}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  正在處理: {file.embeddingProgress}%
                </p>
              </div>
            )}

            {expandedFileId === file.id && (
              <div className="px-4 pb-4">
                <div className="p-3 bg-gray-50 rounded max-h-[400px] overflow-y-auto">
                  <pre className="whitespace-pre-wrap font-sans">
                    {file.translatedContent || file.originalContent}
                  </pre>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
