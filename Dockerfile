FROM node:14.20.1-bullseye-slim

WORKDIR /app

COPY ["package.json", "package-lock.json*", "./"]
RUN npm install
COPY . . 

# 複製 entrypoint.sh 並設定可執行權限
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x entrypoint.sh

# 使用 entrypoint.sh 啟動
CMD ["/entrypoint.sh"]