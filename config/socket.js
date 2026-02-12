const { Server } = require('socket.io')

let io = null
const userSocketMap = new Map() // userId -> socketId 映射

const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:8080',
      methods: ['GET', 'POST'],
      credentials: true
    }
  })

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id)

    // 用戶註冊：將 userId 與 socketId 關聯
    socket.on('register', (userId) => {
      console.log(`User ${userId} registered with socket ${socket.id}`)
      userSocketMap.set(userId.toString(), socket.id)
      socket.userId = userId
      socket.join(`user_${userId}`) // 加入個人房間
    })

    // 斷線處理
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id)
      if (socket.userId) {
        userSocketMap.delete(socket.userId.toString())
      }
    })
  })

  return io
}

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!')
  }
  return io
}

const emitToUser = (userId, event, data) => {
  if (!io) {
    console.error('Socket.io not initialized!')
    return
  }

  const socketId = userSocketMap.get(userId.toString())
  if (socketId) {
    io.to(socketId).emit(event, data)
    console.log(`Emitted ${event} to user ${userId}`)
  } else {
    console.log(`User ${userId} is not connected`)
  }
}

module.exports = {
  initializeSocket,
  getIO,
  emitToUser
}
