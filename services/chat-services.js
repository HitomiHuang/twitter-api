const { ChatMessage, User, Sequelize } = require('../models')
const { Op } = Sequelize

const chatServices = {
  // 取得最新 N 筆公開訊息（含 sender 資料）
  getPublicMessages: async (limit = 50) => {
    const messages = await ChatMessage.findAll({
      where: { roomType: 'public' },
      include: [
        { model: User, as: 'sender', attributes: ['id', 'name', 'account', 'avatar'] }
      ],
      order: [['createdAt', 'ASC']],
      limit
    })
    return messages.map(m => m.toJSON())
  },

  // 取得兩人之間的私人對話訊息
  getPrivateMessages: async (myId, partnerId) => {
    const messages = await ChatMessage.findAll({
      where: {
        roomType: 'private',
        [Op.or]: [
          { senderId: myId, receiverId: partnerId },
          { senderId: partnerId, receiverId: myId }
        ]
      },
      include: [
        { model: User, as: 'sender', attributes: ['id', 'name', 'account', 'avatar'] }
      ],
      order: [['createdAt', 'ASC']]
    })
    return messages.map(m => m.toJSON())
  },

  // 取得目前用戶的所有對話列表（每個對話的最新訊息 + 未讀數）
  getConversations: async (userId) => {
    // 找出所有與此 userId 相關的私人訊息，取得所有對話對象ID
    const messages = await ChatMessage.findAll({
      where: {
        roomType: 'private',
        [Op.or]: [
          { senderId: userId },
          { receiverId: userId }
        ]
      },
      include: [
        { model: User, as: 'sender', attributes: ['id', 'name', 'account', 'avatar'] },
        { model: User, as: 'receiver', attributes: ['id', 'name', 'account', 'avatar'] }
      ],
      order: [['createdAt', 'DESC']]
    })

    // 以對話對象 ID 分組，取每個對話最新一筆
    const conversationMap = new Map()
    messages.forEach(msg => {
      const m = msg.toJSON()
      const partnerId = m.senderId === userId ? m.receiverId : m.senderId
      const partner = m.senderId === userId ? m.receiver : m.sender
      if (!conversationMap.has(partnerId)) {
        conversationMap.set(partnerId, {
          partner,
          lastMessage: m,
          unreadCount: 0
        })
      }
      // 計算未讀：對方傳給我且未讀
      if (m.senderId === partnerId && !m.isRead) {
        conversationMap.get(partnerId).unreadCount++
      }
    })

    return Array.from(conversationMap.values())
  },

  // 將某人傳給我的訊息標記為已讀
  markMessagesAsRead: async (fromUserId, toUserId) => {
    await ChatMessage.update(
      { isRead: true },
      {
        where: {
          senderId: fromUserId,
          receiverId: toUserId,
          roomType: 'private',
          isRead: false
        }
      }
    )
  },

  // 取得此用戶所有未讀私訊總數
  getUnreadPrivateCount: async (userId) => {
    const count = await ChatMessage.count({
      where: {
        receiverId: userId,
        roomType: 'private',
        isRead: false
      }
    })
    return count
  },

  // 回收訊息（只有發送者能回收）
  recallMessage: async (messageId, userId) => {
    const message = await ChatMessage.findByPk(messageId)
    if (!message) {
      const err = new Error('Message not found')
      err.status = 404
      throw err
    }
    if (message.senderId !== userId) {
      const err = new Error('Unauthorized')
      err.status = 403
      throw err
    }
    await message.update({ isRecalled: true })
    return message.toJSON()
  }
}

module.exports = chatServices
