import React, { useState } from 'react';
import { MessageSquare, PlusCircle } from 'lucide-react';

interface WelcomeChatScreenProps {
  onCreateNewChat: (title: string) => void;
}

export const WelcomeChatScreen: React.FC<WelcomeChatScreenProps> = ({ onCreateNewChat }) => {
  const [showNewChatDialog, setShowNewChatDialog] = useState(false);
  const [newChatTitle, setNewChatTitle] = useState('');

  const handleCreateChat = (e: React.FormEvent) => {
    e.preventDefault();
    const title = newChatTitle.trim() || '新對話';
    onCreateNewChat(title);
    setNewChatTitle('');
    setShowNewChatDialog(false);
  };

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
        
        {!showNewChatDialog ? (
          <button
            onClick={() => setShowNewChatDialog(true)}
            className="inline-flex items-center px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <PlusCircle className="w-5 h-5 mr-2" />
            建立新對話
          </button>
        ) : (
          <form onSubmit={handleCreateChat} className="max-w-sm mx-auto">
            <input
              type="text"
              value={newChatTitle}
              onChange={(e) => setNewChatTitle(e.target.value)}
              placeholder="輸入對話名稱"
              className="w-full px-4 py-2 mb-4 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              autoFocus
            />
            <div className="flex justify-center gap-2">
              <button
                type="button"
                onClick={() => setShowNewChatDialog(false)}
                className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                取消
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                建立
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};