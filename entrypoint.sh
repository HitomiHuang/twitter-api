#!/bin/sh
set -e  # 遇錯誤時停止執行

# 確保 DB 已經啟動
echo "Waiting for database..."
sleep 10  # 等待 10 秒，視情況調整

# 執行資料庫遷移
npx sequelize db:migrate

# 設定種子資料
npx sequelize db:seed:all

# 啟動應用程式
exec node app.js
