const express = require('express')
const router = express.Router()
const passport = require('../config/passport')
const admin = require('./modules/admin')
const users = require('./modules/users')
const tweets = require('./modules/tweets')
const chat = require('./modules/chat')
const { authenticated, authenticatedUser, authenticatedAdmin } = require('../middleware/auth')
const tweetController = require('../controllers/tweet-controller')
const userController = require('../controllers/user-controller')
const notificationController = require('../controllers/notification-controller')
const { apiErrorHandler } = require('../middleware/error-handler')

router.post('/admin/signin', passport.authenticate('local', { session: false }), authenticatedAdmin, userController.signIn)
router.post('/signin', passport.authenticate('local', { session: false }), authenticatedUser, userController.signIn)

router.delete('/followships/:followingId', authenticated, authenticatedUser, userController.removeFollowing)
router.put('/followships/:followingId/notification', authenticated, authenticatedUser, userController.toggleNotification)
router.post('/followships', authenticated, authenticatedUser, userController.addFollowing)

router.get('/notifications/unread-count', authenticated, authenticatedUser, notificationController.getUnreadCount)
router.put('/notifications/read-all', authenticated, authenticatedUser, notificationController.markAllAsRead)
router.put('/notifications/:id/read', authenticated, authenticatedUser, notificationController.markAsRead)
router.delete('/notifications/:id', authenticated, authenticatedUser, notificationController.deleteNotification)
router.get('/notifications', authenticated, authenticatedUser, notificationController.getNotifications)

router.post('/users', userController.signUp)
router.get('/tweets', authenticated, authenticatedUser, tweetController.getTweets)
router.use('/admin', authenticated, authenticatedAdmin, admin)
router.use('/users', authenticated, authenticatedUser, users)
router.use('/tweets', authenticated, authenticatedUser, tweets)
router.use('/chat', authenticated, authenticatedUser, chat)


router.use('/', apiErrorHandler)
module.exports = router