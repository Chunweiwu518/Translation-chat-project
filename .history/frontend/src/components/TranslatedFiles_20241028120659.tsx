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

  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold mb-4">翻譯完成的文件</h3>
      <div className="space-y-4">
        {files.map((file) => (
          <div
            key={file.id}
            className="border rounded-lg bg-white shadow-sm"
          >
            <div className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium">{file.name}</h4>
                  <p className="text-sm text-gray-500">
                    {file.isEmbedded ? "已加入知識庫" : "未加入知識庫"}
                  </p>
                </div>
                <button
                  onClick={() => setExpandedFileId(
                    expandedFileId === file.id ? null : file.id
                  )}
                  className="p-2 hover:bg-gray-100 rounded"
                >
                  {expandedFileId === file.id ? (
                    <ChevronUp className="w-5 h-5" />
                  ) : (
                    <ChevronDown className="w-5 h-5" />
                  )}
                </button>
              </div>
              
              {expandedFileId === file.id && (
                <div className="mt-4 space-y-4">
                  {file.originalContent && (
                    <div>
                      <h5 className="font-medium mb-2">原文</h5>
                      <div className="p-3 bg-gray-50 rounded text-sm">
                        {file.originalContent}
                      </div>
                    </div>
                  )}
                  <div>
                    <h5 className="font-medium mb-2">翻譯結果</h5>
                    <div className="p-3 bg-gray-50 rounded text-sm">
                      {file.translatedContent}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
