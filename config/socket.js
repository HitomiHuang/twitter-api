// 引入 Socket.IO 的 Server 類別
const { Server } = require('socket.io')
const { ChatMessage, User } = require('../models')

// Socket.IO 實例，用於管理所有的 WebSocket 連接
let io = null

// 用戶映射表：記錄每個用戶 ID 對應的 Socket ID
// 這樣可以快速找到特定用戶的連接，並向他們發送訊息
const userSocketMap = new Map() // userId -> socketId 映射

// 公開聊天室上線用戶：userId -> { id, name, account, avatar }
const publicChatOnlineUsers = new Map()

/**
 * 初始化 Socket.IO 伺服器
 * 
 * Socket.IO 是一個即時通訊框架，讓伺服器可以主動推送訊息到客戶端
 * 不需要客戶端不斷輪詢（polling），實現真正的即時更新
 * 
 * @param {object} server - HTTP 伺服器實例
 * @returns {object} Socket.IO 實例
 */
const initializeSocket = (server) => {
  // 創建 Socket.IO 實例並附加到 HTTP 伺服器
  io = new Server(server, {
    // CORS（跨域資源分享）設定：允許前端應用連接到這個 Socket.IO 伺服器
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:8080',  // 允許的來源網址
      methods: ['GET', 'POST'],                                       // 允許的 HTTP 方法
      credentials: true                                               // 允許攜帶憑證（如 cookies）
    }
  })

  // 監聽「connection」事件：當有新的客戶端連接時觸發
  // Socket.IO 會為每個連接自動分配一個唯一的 socket.id
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id)

    /**
     * 監聽「register」事件：用戶註冊
     * 
     * 當用戶登入後，前端會發送 'register' 事件並附帶用戶 ID
     * 我們需要建立「用戶 ID」與「Socket ID」的對應關係
     * 這樣之後才能找到特定用戶並發送通知給他們
     */
    socket.on('register', (userId) => {
      console.log(`User ${userId} registered with socket ${socket.id}`)

      // 在映射表中記錄：這個用戶 ID 對應到這個 Socket ID
      userSocketMap.set(userId.toString(), socket.id)

      // 在 socket 物件上儲存用戶 ID，方便之後斷線時查找
      socket.userId = userId

      // 將這個 socket 加入到專屬的「房間」（room）
      // Socket.IO 的 room 概念：可以將多個連接分組，方便廣播訊息
      // 這裡每個用戶有自己的房間，格式為 "user_123"
      socket.join(`user_${userId}`)
    })

    /**
     * 監聽「disconnect」事件：連接斷開
     * 
     * 當用戶關閉瀏覽器、網路斷線等情況會觸發
     * 需要清理映射表，釋放資源
     */
    // ─── 公開聊天室 ────────────────────────────────────────────────

    socket.on('joinPublicChat', (userData) => {
      if (!userData || !userData.id) return
      const key = userData.id.toString()
      publicChatOnlineUsers.set(key, {
        id: userData.id,
        name: userData.name,
        account: userData.account,
        avatar: userData.avatar || null
      })
      socket.publicChatUserId = key
      socket.join('publicChat')
      io.to('publicChat').emit('onlineUsersUpdate', Array.from(publicChatOnlineUsers.values()))
      io.to('publicChat').emit('systemMessage', {
        type: 'join',
        text: `${userData.name} 上線`,
        createdAt: new Date()
      })
    })

    socket.on('leavePublicChat', () => {
      _handleLeavePublicChat(socket)
    })

    socket.on('publicMessage', async (content) => {
      if (!socket.userId || !content || !content.trim()) return
      try {
        const message = await ChatMessage.create({
          senderId: socket.userId,
          receiverId: null,
          content: content.trim(),
          roomType: 'public',
          isRead: true
        })
        const sender = await User.findByPk(socket.userId, {
          attributes: ['id', 'name', 'account', 'avatar']
        })
        const payload = { ...message.toJSON(), sender: sender ? sender.toJSON() : null }
        io.to('publicChat').emit('publicMessage', payload)
      } catch (err) {
        console.error('Error saving public message:', err)
      }
    })

    // ─── 私人訊息 ───────────────────────────────────────────────────

    socket.on('privateMessage', async ({ receiverId, content }) => {
      if (!socket.userId || !receiverId || !content || !content.trim()) return
      try {
        const message = await ChatMessage.create({
          senderId: socket.userId,
          receiverId: Number(receiverId),
          content: content.trim(),
          roomType: 'private',
          isRead: false
        })
        const sender = await User.findByPk(socket.userId, {
          attributes: ['id', 'name', 'account', 'avatar']
        })
        const payload = { ...message.toJSON(), sender: sender ? sender.toJSON() : null }
        emitToUser(receiverId, 'newPrivateMessage', payload)
        socket.emit('privateMessageSent', payload)
      } catch (err) {
        console.error('Error saving private message:', err)
      }
    })

    // ─── 斷線處理 ───────────────────────────────────────────────────

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id)
      if (socket.userId) {
        userSocketMap.delete(socket.userId.toString())
      }
      _handleLeavePublicChat(socket)
    })
  })

  return io
}

function _handleLeavePublicChat(socket) {
  const key = socket.publicChatUserId
  if (!key) return
  const user = publicChatOnlineUsers.get(key)
  publicChatOnlineUsers.delete(key)
  socket.publicChatUserId = null
  socket.leave('publicChat')
  if (user) {
    io.to('publicChat').emit('onlineUsersUpdate', Array.from(publicChatOnlineUsers.values()))
    io.to('publicChat').emit('systemMessage', {
      type: 'leave',
      text: `${user.name} 離線`,
      createdAt: new Date()
    })
  }
}

/**
 * 獲取 Socket.IO 實例
 * 
 * 這是一個輔助函數，讓其他模組可以取得 Socket.IO 實例
 * 但通常我們會直接使用 emitToUser 函數，而不是直接操作 io
 * 
 * @returns {object} Socket.IO 實例
 */
const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!')
  }
  return io
}

/**
 * 發送訊息給特定用戶
 * 
 * 這是最重要的函數！讓後端可以主動推送訊息到特定用戶的瀏覽器
 * 例如：當有人按讚你的推文時，立即推送通知給你
 * 
 * @param {number|string} userId - 目標用戶的 ID
 * @param {string} event - 事件名稱（前端會監聽這個事件名稱）
 * @param {object} data - 要發送的資料
 */
const emitToUser = (userId, event, data) => {
  // 確保 Socket.IO 已經初始化
  if (!io) {
    console.error('Socket.io not initialized!')
    return
  }

  // 從映射表中查找這個用戶的 Socket ID
  const socketId = userSocketMap.get(userId.toString())

  if (socketId) {
    // 找到了！使用 io.to(socketId) 定位到特定連接
    // 然後用 .emit() 發送訊息
    // 前端會收到一個事件，事件名稱是 event，內容是 data
    io.to(socketId).emit(event, data)
    console.log(`Emitted ${event} to user ${userId}`)
  } else {
    // 用戶目前不在線上（沒有建立 WebSocket 連接）
    console.log(`User ${userId} is not connected`)
  }
}

const getPublicChatOnlineUsers = () => Array.from(publicChatOnlineUsers.values())

module.exports = {
  initializeSocket,
  getIO,
  emitToUser,
  getPublicChatOnlineUsers
}
