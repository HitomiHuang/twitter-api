// 引入 Socket.IO 的核心功能：發送訊息給特定用戶
const { emitToUser } = require('../config/socket')
// 引入 User 模型，用於查詢發送者資訊
const { User } = require('../models')

/**
 * 發送即時通知給指定用戶（透過 WebSocket）
 * 
 * 這個函數的作用：
 * 1. 當有人對你的推文按讚、回覆或追蹤你時
 * 2. 後端會呼叫這個函數
 * 3. 透過 Socket.IO 即時推送通知到你的瀏覽器
 * 4. 你的畫面會立即更新，不需要重新整理頁面
 * 
 * @param {number} recipientId - 接收通知的用戶 ID（誰要收到通知）
 * @param {object} notification - 通知物件（包含通知的詳細資訊）
 */
const sendNotification = async (recipientId, notification) => {
  try {
    // 檢查通知是否有發送者（例如：誰按了讚、誰回覆了你）
    if (notification.senderId) {
      // 從資料庫查詢發送者的基本資料
      // 只取需要的欄位：id, name, account, avatar（頭像）
      // 這樣前端才能顯示「XXX 按了你的推文讚」
      const sender = await User.findByPk(notification.senderId, {
        attributes: ['id', 'name', 'account', 'avatar']
      })

      if (sender) {
        // 組合完整的通知資料，準備發送給前端
        const notificationData = {
          id: notification.id,              // 通知的 ID
          type: notification.type,          // 通知類型（like=按讚, reply=回覆, follow=追蹤等）
          tweetId: notification.tweetId,    // 相關的推文 ID（如果有的話）
          replyId: notification.replyId,    // 相關的回覆 ID（如果有的話）
          isRead: notification.isRead,      // 是否已讀
          createdAt: notification.createdAt,// 建立時間
          senderId: notification.senderId,  // 發送者 ID
          sender: sender.toJSON()           // 發送者的完整資料（姓名、頭像等）
        }

        // ★ 這裡是關鍵！使用 Socket.IO 即時推送通知
        // emitToUser 函數會：
        // 1. 找到 recipientId 這個用戶的 WebSocket 連接
        // 2. 發送一個名為 'new_notification' 的事件
        // 3. 附帶 notificationData 資料
        // 4. 前端如果有監聽 'new_notification' 事件，就會立即收到並處理
        emitToUser(recipientId, 'new_notification', notificationData)

        console.log(`Notification sent to user ${recipientId}:`, notificationData.type)
      }
    }
  } catch (error) {
    // 錯誤處理：如果發送失敗，記錄錯誤訊息
    // 但不會影響主要的業務邏輯（例如按讚還是會成功儲存到資料庫）
    console.error('Error sending notification:', error)
  }
}

module.exports = {
  sendNotification
}
