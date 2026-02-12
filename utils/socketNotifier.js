const { emitToUser } = require('../config/socket')
const { User } = require('../models')

/**
 * 發送即時通知給指定用戶
 * @param {number} recipientId - 接收通知的用戶 ID
 * @param {object} notification - 通知物件
 */
const sendNotification = async (recipientId, notification) => {
  try {
    // 如果通知有 senderId，獲取發送者資訊
    if (notification.senderId) {
      const sender = await User.findByPk(notification.senderId, {
        attributes: ['id', 'name', 'account', 'avatar']
      })

      if (sender) {
        const notificationData = {
          id: notification.id,
          type: notification.type,
          tweetId: notification.tweetId,
          replyId: notification.replyId,
          isRead: notification.isRead,
          createdAt: notification.createdAt,
          senderId: notification.senderId,
          sender: sender.toJSON()
        }

        emitToUser(recipientId, 'new_notification', notificationData)
        console.log(`Notification sent to user ${recipientId}:`, notificationData.type)
      }
    }
  } catch (error) {
    console.error('Error sending notification:', error)
  }
}

module.exports = {
  sendNotification
}
