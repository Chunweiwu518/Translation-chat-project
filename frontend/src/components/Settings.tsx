// src/components/Settings.tsx
import React from 'react';

interface SettingsProps {
  currentModel: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  frequencyPenalty: number;
  seed: number;
  topK: number;  // RAG 參數
  similarityThreshold: number; // RAG 參數
  onSettingsChange: (settings: {
    model: string;
    temperature: number;
    maxTokens: number;
    topP: number;
    frequencyPenalty: number;
    seed: number;
    topK: number;
    similarityThreshold: number;
  }) => void;
}

export const Settings: React.FC<SettingsProps> = ({
  currentModel,
  temperature,
  maxTokens,
  topP,
  frequencyPenalty,
  seed,
  topK,
  similarityThreshold,
  onSettingsChange,
}) => {
  const models = [
    'llama3.1-ffm-70b-32k-chat',
    'llama3-ffm-70b-chat',
    'ffm-mixtral-8x7b-32k-instruct'
  ];

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm">
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-3">模型選擇</h3>
          <select
            value={currentModel}
            onChange={(e) => onSettingsChange({
              model: e.target.value,
              temperature,
              maxTokens,
              topP,
              frequencyPenalty,
              seed,
              topK,
              similarityThreshold
            })}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {models.map(model => (
              <option key={model} value={model}>{model}</option>
            ))}
          </select>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">生成參數</h3>
          
          <div>
            <div className="flex justify-between">
              <label className="text-sm font-medium">Temperature</label>
              <span className="text-sm text-gray-500">{temperature}</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={temperature}
              onChange={(e) => onSettingsChange({
                model: currentModel,
                temperature: Number(e.target.value),
                maxTokens,
                topP,
                frequencyPenalty,
                seed,
                topK,
                similarityThreshold
              })}
              className="w-full mt-2"
            />
            <p className="text-xs text-gray-500 mt-1">控制回應的創造性 (0: 保守, 1: 創造性)</p>
          </div>

          <div>
            <div className="flex justify-between">
              <label className="text-sm font-medium">Max Tokens</label>
              <span className="text-sm text-gray-500">{maxTokens}</span>
            </div>
            <input
              type="range"
              min="100"
              max="4000"
              step="100"
              value={maxTokens}
              onChange={(e) => onSettingsChange({
                model: currentModel,
                temperature,
                maxTokens: Number(e.target.value),
                topP,
                frequencyPenalty,
                seed,
                topK,
                similarityThreshold
              })}
              className="w-full mt-2"
            />
            <p className="text-xs text-gray-500 mt-1">控制回應的最大長度</p>
          </div>

          <div>
            <div className="flex justify-between">
              <label className="text-sm font-medium">Top P</label>
              <span className="text-sm text-gray-500">{topP}</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={topP}
              onChange={(e) => onSettingsChange({
                model: currentModel,
                temperature,
                maxTokens,
                topP: Number(e.target.value),
                frequencyPenalty,
                seed,
                topK,
                similarityThreshold
              })}
              className="w-full mt-2"
            />
            <p className="text-xs text-gray-500 mt-1">控制回應的多樣性</p>
          </div>

          <div>
            <div className="flex justify-between">
              <label className="text-sm font-medium">Frequency Penalty</label>
              <span className="text-sm text-gray-500">{frequencyPenalty}</span>
            </div>
            <input
              type="range"
              min="-2"
              max="2"
              step="0.1"
              value={frequencyPenalty}
              onChange={(e) => onSettingsChange({
                model: currentModel,
                temperature,
                maxTokens,
                topP,
                frequencyPenalty: Number(e.target.value),
                seed,
                topK,
                similarityThreshold
              })}
              className="w-full mt-2"
            />
            <p className="text-xs text-gray-500 mt-1">控制詞彙重複的懲罰程度</p>
          </div>

          <div>
            <div className="flex justify-between">
              <label className="text-sm font-medium">Seed</label>
              <span className="text-sm text-gray-500">{seed}</span>
            </div>
            <input
              type="number"
              min="0"
              value={seed}
              onChange={(e) => onSettingsChange({
                model: currentModel,
                temperature,
                maxTokens,
                topP,
                frequencyPenalty,
                seed: Number(e.target.value),
                topK,
                similarityThreshold
              })}
              className="w-full mt-2 p-2 border rounded"
            />
            <p className="text-xs text-gray-500 mt-1">控制隨機性種子</p>
          </div>

          <h3 className="text-lg font-semibold pt-4">RAG 參數</h3>

          <div>
            <div className="flex justify-between">
              <label className="text-sm font-medium">Top K</label>
              <span className="text-sm text-gray-500">{topK}</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              step="1"
              value={topK}
              onChange={(e) => onSettingsChange({
                model: currentModel,
                temperature,
                maxTokens,
                topP,
                frequencyPenalty,
                seed,
                topK: Number(e.target.value),
                similarityThreshold
              })}
              className="w-full mt-2"
            />
            <p className="text-xs text-gray-500 mt-1">檢索相關文件的數量</p>
          </div>

          <div>
            <div className="flex justify-between">
              <label className="text-sm font-medium">Similarity Threshold</label>
              <span className="text-sm text-gray-500">{similarityThreshold}</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={similarityThreshold}
              onChange={(e) => onSettingsChange({
                model: currentModel,
                temperature,
                maxTokens,
                topP,
                frequencyPenalty,
                seed,
                topK,
                similarityThreshold: Number(e.target.value)
              })}
              className="w-full mt-2"
            />
            <p className="text-xs text-gray-500 mt-1">文件相關性的最低門檻</p>
          </div>
        </div>

        <div className="mt-4 p-4 bg-gray-50 rounded">
          <h4 className="font-medium mb-2">當前設定</h4>
          <pre className="text-sm text-gray-600">
            {JSON.stringify({
              model: currentModel,
              temperature,
              maxTokens,
              topP,
              frequencyPenalty,
              seed,
              topK,
              similarityThreshold
            }, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
};