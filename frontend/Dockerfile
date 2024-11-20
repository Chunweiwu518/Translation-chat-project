FROM node:18-alpine

WORKDIR /app

# 複製 package.json 和 package-lock.json
COPY package*.json ./

# 安裝依賴
RUN npm install

# 複製源代碼
COPY . .

# 構建應用
RUN npm run build

# 安裝 serve 用於生產環境服務
RUN npm install -g serve

# 暴露端口
EXPOSE 3000

# 啟動應用
CMD ["serve", "-s", "build", "-l", "3000"] 