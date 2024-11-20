FROM python:3.9-slim

WORKDIR /app

# 安裝系統依賴
RUN apt-get update && apt-get install -y \
    build-essential \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

# 首先複製 mylibspublic 目錄
COPY mylibspublic ./mylibspublic

# 複製其他檔案
COPY requirements.txt .
COPY .env .
COPY *.py .
COPY translations ./translations

# 創建並啟動虛擬環境，安裝依賴
RUN python -m venv venv && \
    . /app/venv/bin/activate && \
    pip install --no-cache-dir --upgrade pip && \
    pip install wheel && \
    pip install pdfplumber && \
    grep -v "pywin32" requirements.txt | grep -v "pyreadline3" > requirements_linux.txt && \
    pip install --no-cache-dir -r requirements_linux.txt && \
    # 安裝 mylibspublic 作為本地包
    pip install -e .

# 設定環境變數
ENV PYTHONUNBUFFERED=1
ENV PATH="/app/venv/bin:$PATH"
ENV PYTHONPATH="/app:$PYTHONPATH"

# 暴露端口
EXPOSE 5000

# 啟動應用
CMD ["python", "app.py"] 