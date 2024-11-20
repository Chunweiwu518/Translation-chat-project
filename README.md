<div align="center">
  <img src="https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_REPO/main/assets/images/logo.jpg" alt="Logo" width="200"/>
</div>

基於 RAG (檢索增強生成) 的智能翻譯助手系統，提供文件管理、知識庫對話及翻譯功能。

[English](./README.md) | 繁體中文 | [日本語](./README_ja.md)

---

## 🌟 主要功能

### 1. 檔案管理
<div align="center">
  <img src="screenshot1.png" alt="檔案管理介面" width="800"/>
</div>

- 支援拖拽上傳和點擊選擇檔案
- 支援 PDF、TXT、DOCX 等多種檔案格式
- 檔案批次處理功能
- 即時顯示上傳和處理進度

### 2. 知識庫對話
<div align="center">
  <img src="screenshot2.png" alt="知識庫對話介面" width="800"/>
</div>

- 基於上傳文件的智能對話
- 支援多種 AI 模型選擇
- 對話歷史記錄保存
- 知識庫內容檢索與管理

### 3. 翻譯功能
<div align="center">
  <img src="screenshot3.png" alt="翻譯功能介面" width="800"/>
</div>

- 可選擇是否需要翻譯
- 支援批次翻譯
- 翻譯結果預覽和下載
- 多語言支援

---

## 🛠 技術架構

### 前端
- **React** + **TypeScript**
- **Tailwind CSS**
- **Lucide React** 圖標庫

### 後端
- **Python FastAPI**
- **ChromaDB** 向量資料庫
- **LangChain** LLM 整合

---

## 🚀 快速開始

### 系統需求
- **Node.js** 18.0 或以上
- **Python** 3.9 或以上
- 至少 8GB RAM

### 安裝步驟

#### 1. 克隆專案
```bash
git clone https://github.com/Chunweiwu518/Translation-chat-project.git
cd Translation-chat-project
```

#### 2. 安裝前端依賴
```bash
cd frontend
npm install
npm run build
```

#### 3. 設置後端環境
確保安裝 Python 3.9 或以上，並啟用虛擬環境：
```bash
python -m venv venv
source venv/bin/activate  # Windows 使用 venv\Scripts\activate
pip install -r requirements.txt
```

#### 4. 啟動 Docker 容器
使用提供的 `docker-compose.yml` 啟動所有服務：
```bash
docker-compose up -d
```

---

## 📂 檔案結構

```
Translation-Chat-Assistant/
│
├── frontend/                # 前端程式碼 (React + TypeScript)
├── backend/                 # 後端程式碼 (FastAPI)
├── docker-compose.yml       # Docker 組態檔
├── Dockerfile               # 後端 Docker 構建檔
├── README.md                # 專案說明
└── requirements.txt         # Python 套件依賴
```

---

## 🔧 配置詳情

### 環境變數
確保創建 `.env` 文件並設置必要變數，例如：
```env
LLM_API_KEY=<your-api-key>
DATABASE_URL=<chroma-db-url>
```

### Docker 化
專案已基於 Docker 優化，詳細配置請參考以下檔案：
- **`docker-compose.yml`**: 包含多服務配置，例如資料庫及後端應用。
- **`Dockerfile`**: 快速構建後端容器。

---

## 🤝 貢獻指南

歡迎參與此專案的開發，提交 Issue 或 PR 時，請遵守以下規範：
1. 確保代碼通過單元測試。
2. 撰寫詳細的提交信息。
3. 提供必要的代碼註解。

---

## 📄 授權條款

此專案採用 [MIT 授權條款](LICENSE)。
```

如果需要針對具體功能或其他細節進行修改，請隨時告知！
