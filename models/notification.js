'use strict';
module.exports = (sequelize, DataTypes) => {
  const Notification = sequelize.define('Notification', {
    recipientId: DataTypes.INTEGER,
    senderId: DataTypes.INTEGER,
    type: DataTypes.ENUM('new_tweet', 'new_follower', 'new_reply', 'new_like'),
    tweetId: DataTypes.INTEGER,
    replyId: DataTypes.INTEGER,
    isRead: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'Notification',
    tableName: 'Notifications'
  });

  Notification.associate = function (models) {
    Notification.belongsTo(models.User, { as: 'recipient', foreignKey: 'recipientId' });
    Notification.belongsTo(models.User, { as: 'sender', foreignKey: 'senderId' });
    Notification.belongsTo(models.Tweet, { foreignKey: 'tweetId' });
    Notification.belongsTo(models.Reply, { foreignKey: 'replyId' });
  };

  return Notification;
};
