const chatServices = require('../services/chat-services')
const { emitToUser } = require('../config/socket')

const chatController = {
  getPublicMessages: async (req, res, next) => {
    try {
      const messages = await chatServices.getPublicMessages(50)
      return res.json(messages)
    } catch (err) {
      next(err)
    }
  },

  getPrivateMessages: async (req, res, next) => {
    try {
      const myId = req.user.id
      const partnerId = Number(req.params.userId)
      const messages = await chatServices.getPrivateMessages(myId, partnerId)
      return res.json(messages)
    } catch (err) {
      next(err)
    }
  },

  getConversations: async (req, res, next) => {
    try {
      const userId = req.user.id
      const conversations = await chatServices.getConversations(userId)
      return res.json(conversations)
    } catch (err) {
      next(err)
    }
  },

  markMessagesAsRead: async (req, res, next) => {
    try {
      const toUserId = req.user.id
      const fromUserId = Number(req.params.userId)
      await chatServices.markMessagesAsRead(fromUserId, toUserId)
      // 通知原發送方：他的訊息已被讀取
      emitToUser(fromUserId, 'messagesRead', { readBy: toUserId })
      return res.json({ success: true })
    } catch (err) {
      next(err)
    }
  },

  getUnreadPrivateCount: async (req, res, next) => {
    try {
      const userId = req.user.id
      const count = await chatServices.getUnreadPrivateCount(userId)
      return res.json({ count })
    } catch (err) {
      next(err)
    }
  },

  recallMessage: async (req, res, next) => {
    try {
      const userId = req.user.id
      const messageId = Number(req.params.id)
      const message = await chatServices.recallMessage(messageId, userId)
      // 通知另一方（私訊通知接收者，公開訊息廣播給所有人由已重戦）
      if (message.roomType === 'private' && message.receiverId) {
        emitToUser(message.receiverId, 'messageRecalled', { id: messageId })
      }
      // 回傳給自己確認
      return res.json({ success: true, id: messageId })
    } catch (err) {
      next(err)
    }
  }
}

module.exports = chatController
