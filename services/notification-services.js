const { User, Notification } = require('../models');
const helpers = require('../_helpers');

const notificationServices = {
  getNotifications: (req, cb) => {
    const currentUserId = helpers.getUser(req).id;

    return Notification.findAll({
      where: { recipientId: currentUserId },
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'name', 'account', 'avatar']
        }
      ],
      order: [['createdAt', 'DESC']]
    })
      .then(notifications => {
        const notificationsData = notifications.map(n => ({
          id: n.id,
          type: n.type,
          tweetId: n.tweetId,
          replyId: n.replyId,
          isRead: n.isRead,
          createdAt: n.createdAt,
          senderId: n.senderId,
          sender: n.sender
        }));
        return cb(null, notificationsData);
      })
      .catch(err => cb(err));
  },

  getUnreadCount: (req, cb) => {
    const currentUserId = helpers.getUser(req).id;

    return Notification.count({
      where: {
        recipientId: currentUserId,
        isRead: false
      }
    })
      .then(count => cb(null, { count }))
      .catch(err => cb(err));
  },

  markAsRead: (req, cb) => {
    const notificationId = req.params.id;
    const currentUserId = helpers.getUser(req).id;

    return Notification.findOne({
      where: {
        id: notificationId,
        recipientId: currentUserId
      }
    })
      .then(notification => {
        if (!notification) throw new Error("Notification didn't exist!");
        return notification.update({ isRead: true });
      })
      .then(updatedNotification => cb(null, {
        status: 'success',
        notification: updatedNotification
      }))
      .catch(err => cb(err));
  },

  markAllAsRead: (req, cb) => {
    const currentUserId = helpers.getUser(req).id;

    return Notification.update(
      { isRead: true },
      {
        where: {
          recipientId: currentUserId,
          isRead: false
        }
      }
    )
      .then(() => cb(null, { status: 'success' }))
      .catch(err => cb(err));
  },

  deleteNotification: (req, cb) => {
    const notificationId = req.params.id;
    const currentUserId = helpers.getUser(req).id;

    return Notification.findOne({
      where: {
        id: notificationId,
        recipientId: currentUserId
      }
    })
      .then(notification => {
        if (!notification) throw new Error("Notification didn't exist!");
        return notification.destroy();
      })
      .then(() => cb(null, { status: 'success' }))
      .catch(err => cb(err));
  }
};

module.exports = notificationServices;
