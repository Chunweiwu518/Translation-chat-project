import React from 'react';
import { MessageSquare, PlusCircle } from 'lucide-react';

interface WelcomeChatScreenProps {
  onCreateNewChat: () => void;
}

export const WelcomeChatScreen: React.FC<WelcomeChatScreenProps> = ({ onCreateNewChat }) => {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center">
        <div className="mb-6">
          <MessageSquare className="w-16 h-16 text-blue-500 mx-auto" />
        </div>
        <h2 className="text-2xl font-bold mb-4">歡迎使用知識對話</h2>
        <p className="text-gray-600 mb-8 max-w-md mx-auto">
          開始一個新的對話，探索您的知識庫內容。我們將幫助您找到所需的信息。
        </p>
        <button
          onClick={onCreateNewChat}
          className="inline-flex items-center px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          <PlusCircle className="w-5 h-5 mr-2" />
          建立新對話
        </button>
      </div>
    </div>
  );
};