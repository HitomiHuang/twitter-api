# Twitter — 後端

前後端分離架構的 Twitter 仿作專案後端，提供完整 RESTful API，並支援 Socket.IO 即時通訊。

**技術棧：** Node.js · Express · MySQL · Sequelize · Socket.IO · Redis · JWT · Docker

---

## 功能特色

### 使用者系統
- 註冊 / 登入（JWT 驗證）
- 查看與編輯個人資料（大頭貼、封面照片上傳至 Imgur）
- 追蹤 / 取消追蹤其他使用者
- 追蹤通知開關（可針對特定追蹤對象關閉通知）
- 查看追蹤者 / 追蹤中清單
- 查看熱門使用者（依追蹤數排序，Top 10）
- 查看使用者的推文、回覆、喜歡清單

### 推文系統
- 發布推文（上限 140 字）
- 瀏覽所有推文（支援分頁：`limit` / `offset`）
- 查看單則推文
- 回覆推文
- 對推文按讚 / 取消按讚

### 通知系統
- 即時推播通知（Socket.IO WebSocket）
- 觸發通知事件：按讚、回覆、追蹤
- 查看通知列表
- 標記單則 / 全部通知為已讀
- 查看未讀通知數量
- 刪除通知

### 聊天系統（Socket.IO）
- **公開聊天室**：所有在線使用者即時群聊，自動推播上下線通知
- **私人訊息**：一對一即時私訊，支援訊息撤回
- 查看對話列表（含最新訊息預覽與未讀數量）
- 標記私人訊息為已讀

### 管理員後台
- 查看所有使用者（含推文數、追蹤數等統計）
- 刪除任意推文

### 效能優化
- Redis 快取層，減少重複資料庫查詢

---

## 種子帳戶

| 角色 | Account | Password |
|------|---------|----------|
| Admin | `root` | `12345678` |
| User | `user1` | `12345678` |
| User | `user2` | `12345678` |

---

## API 路由總覽

### 認證
| Method | Path | 說明 |
|--------|------|------|
| POST | `/api/signin` | 使用者登入 |
| POST | `/api/admin/signin` | 管理員登入 |
| POST | `/api/users` | 使用者註冊 |

### 推文
| Method | Path | 說明 |
|--------|------|------|
| GET | `/api/tweets` | 取得所有推文（支援 `?limit=&offset=`）|
| POST | `/api/tweets` | 發布推文 |
| GET | `/api/tweets/:tweet_id` | 取得單則推文 |
| GET | `/api/tweets/:tweet_id/replies` | 取得推文回覆 |
| POST | `/api/tweets/:tweet_id/replies` | 回覆推文 |
| POST | `/api/tweets/:id/like` | 按讚 |
| POST | `/api/tweets/:id/unlike` | 取消按讚 |

### 使用者
| Method | Path | 說明 |
|--------|------|------|
| GET | `/api/users/top` | 熱門使用者 Top 10 |
| GET | `/api/users/:id` | 取得使用者資料 |
| PUT | `/api/users/:id` | 編輯使用者資料（含頭貼/封面上傳）|
| GET | `/api/users/:id/tweets` | 使用者的推文 |
| GET | `/api/users/:id/replied_tweets` | 使用者的回覆 |
| GET | `/api/users/:id/likes` | 使用者喜歡的推文 |
| GET | `/api/users/:id/followers` | 追蹤者清單 |
| GET | `/api/users/:id/followings` | 追蹤中清單 |

### 追蹤
| Method | Path | 說明 |
|--------|------|------|
| POST | `/api/followships` | 追蹤使用者 |
| DELETE | `/api/followships/:followingId` | 取消追蹤 |
| PUT | `/api/followships/:followingId/notification` | 切換通知開關 |

### 通知
| Method | Path | 說明 |
|--------|------|------|
| GET | `/api/notifications` | 取得通知列表 |
| GET | `/api/notifications/unread-count` | 未讀通知數量 |
| PUT | `/api/notifications/read-all` | 全部標為已讀 |
| PUT | `/api/notifications/:id/read` | 標記單則為已讀 |
| DELETE | `/api/notifications/:id` | 刪除通知 |

### 聊天
| Method | Path | 說明 |
|--------|------|------|
| GET | `/api/chat/public` | 取得公開聊天室歷史訊息 |
| GET | `/api/chat/conversations` | 取得私人對話列表 |
| GET | `/api/chat/unread-count` | 未讀私訊數量 |
| GET | `/api/chat/private/:userId` | 取得與指定用戶的私人訊息 |
| PUT | `/api/chat/private/:userId/read` | 標記訊息已讀 |
| DELETE | `/api/chat/messages/:id` | 撤回訊息 |

### 管理員
| Method | Path | 說明 |
|--------|------|------|
| GET | `/api/admin/users` | 取得所有使用者列表 |
| DELETE | `/api/admin/tweets/:id` | 刪除推文 |

---

## Socket.IO 事件

### 客戶端發送
| 事件 | 說明 |
|------|------|
| `register` | 登入後註冊用戶 ID 與 Socket 的對應關係 |
| `joinPublicChat` | 加入公開聊天室 |
| `leavePublicChat` | 離開公開聊天室 |
| `publicMessage` | 發送公開訊息 |
| `privateMessage` | 發送私人訊息 |

### 伺服器推送
| 事件 | 說明 |
|------|------|
| `new_notification` | 新通知（按讚、回覆、追蹤）|
| `onlineUsersUpdate` | 公開聊天室在線用戶更新 |
| `systemMessage` | 系統訊息（上線/下線通知）|
| `newPublicMessage` | 新公開訊息 |
| `newPrivateMessage` | 新私人訊息 |

---

## 本地開發安裝

### 前置需求

- Node.js v14+
- MySQL 5.7+
- Redis（選用，無 Redis 時快取功能會自動略過）

### 安裝步驟

**1. Clone 專案**
```bash
git clone https://github.com/HitomiHuang/twitter-api.git
cd twitter-api
```

**2. 安裝套件**
```bash
npm install
```

**3. 設定環境變數**

新增 `.env` 檔案：
```env
JWT_SECRET=<your_jwt_secret>
IMGUR_CLIENT_ID=<your_imgur_client_id>
FRONTEND_URL=http://localhost:8080
```

**4. 設定資料庫**

在 `config/config.json` 填入 MySQL 資訊：
```json
{
  "development": {
    "username": "root",
    "password": "<your_password>",
    "database": "ac_twitter_workspace",
    "host": "127.0.0.1",
    "dialect": "mysql"
  },
  "test": {
    "username": "root",
    "password": "<your_password>",
    "database": "ac_twitter_workspace_test",
    "host": "127.0.0.1",
    "dialect": "mysql",
    "logging": false
  }
}
```

在 MySQL 建立資料庫：
```sql
CREATE DATABASE ac_twitter_workspace;
CREATE DATABASE ac_twitter_workspace_test;
```

**5. 執行 Migration 與 Seed**
```bash
npx sequelize db:migrate
npx sequelize db:seed:all
```

**6. 啟動伺服器**
```bash
npm run dev
```

出現 `App listening on port 3000!` 即代表啟動成功。

### 執行測試
```bash
npm test
```

---

## Docker 部署

使用 Docker Compose 一鍵啟動前端、後端與資料庫：

```bash
docker-compose up --build
```

服務啟動後：
- 後端 API：`http://localhost:3000/api`
- 前端：`http://localhost:80`

> 容器啟動時會自動執行 `db:migrate` 與 `db:seed:all`。

---

## 開發工具

| 套件 | 版本 | 用途 |
|------|------|------|
| express | 4.16.4 | Web 框架 |
| sequelize | 6.18.0 | ORM |
| mysql2 | 1.6.4 | MySQL 驅動 |
| socket.io | 4.8.3 | 即時通訊 |
| redis | 4.7.0 | 快取 |
| passport / passport-jwt | 0.4.1 / 4.0.0 | JWT 驗證 |
| passport-local | 1.0.0 | 本地驗證策略 |
| bcryptjs | 2.4.3 | 密碼雜湊 |
| jsonwebtoken | 8.5.1 | JWT 簽發 |
| multer | 1.4.4 | 檔案上傳 |
| imgur | 1.0.2 | 圖片雲端儲存 |
| cors | 2.8.5 | 跨域處理 |
| dotenv | 10.0.0 | 環境變數 |
| cross-env | 7.0.3 | 跨平台環境變數 |

---

## 開發人員

- [Nathan](https://github.com/naivelove0822)
- [Hitomi](https://github.com/HitomiHuang)
