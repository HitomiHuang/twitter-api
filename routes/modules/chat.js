const express = require('express')
const router = express.Router()
const chatController = require('../../controllers/chat-controller')

router.get('/public', chatController.getPublicMessages)
router.get('/conversations', chatController.getConversations)
router.get('/unread-count', chatController.getUnreadPrivateCount)
router.get('/private/:userId', chatController.getPrivateMessages)
router.put('/private/:userId/read', chatController.markMessagesAsRead)
router.delete('/messages/:id', chatController.recallMessage)

module.exports = router
