// 基本功能：
// 1. 捕獲錯誤
// 2. 顯示錯誤信息
// 3. 提供重試選項
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode; // 子組件，ErrorBoundary 包裹的內容
}

interface State {
  hasError: boolean; // 用於追蹤是否發生錯誤
  error: Error | null; // 儲存錯誤信息
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false, // 初始狀態，沒有錯誤
    error: null // 初始狀態，沒有錯誤信息
  };

  // 當子組件拋出錯誤時，更新狀態
  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }; // 設置 hasError 為 true 並儲存錯誤信息
  }

  // 捕獲錯誤並記錄錯誤信息
  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('錯誤詳情:', error, errorInfo); // 在控制台輸出錯誤信息
  }

  public render() {
    if (this.state.hasError) {
      // 如果發生錯誤，顯示錯誤界面
      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <h2 className="text-lg font-semibold text-red-600 mb-2">發生錯誤</h2> {/* 錯誤標題 */}
          <p className="text-red-500">{this.state.error?.message}</p> {/* 顯示錯誤信息 */}
          <button
            className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            onClick={() => this.setState({ hasError: false, error: null })} // 點擊按鈕重置錯誤狀態
          >
            重試 {/* 重試按鈕 */}
          </button>
        </div>
      );
    }

    return this.props.children; // 如果沒有錯誤，渲染子組件
  }
}
