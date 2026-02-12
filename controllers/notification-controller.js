const notificationServices = require('../services/notification-services');

const notificationController = {
  getNotifications: (req, res, next) => {
    notificationServices.getNotifications(req, (err, notifications) =>
      err ? next(err) : res.json(notifications)
    );
  },

  getUnreadCount: (req, res, next) => {
    notificationServices.getUnreadCount(req, (err, result) =>
      err ? next(err) : res.json(result)
    );
  },

  markAsRead: (req, res, next) => {
    notificationServices.markAsRead(req, (err, result) =>
      err ? next(err) : res.json(result)
    );
  },

  markAllAsRead: (req, res, next) => {
    notificationServices.markAllAsRead(req, (err, result) =>
      err ? next(err) : res.json(result)
    );
  },

  deleteNotification: (req, res, next) => {
    notificationServices.deleteNotification(req, (err, result) =>
      err ? next(err) : res.json(result)
    );
  }
};

module.exports = notificationController;
