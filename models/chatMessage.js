'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class ChatMessage extends Model {
    static associate(models) {
      ChatMessage.belongsTo(models.User, { foreignKey: 'senderId', as: 'sender' });
      ChatMessage.belongsTo(models.User, { foreignKey: 'receiverId', as: 'receiver' });
    }
  }
  ChatMessage.init({
    senderId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    receiverId: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    roomType: {
      type: DataTypes.ENUM('public', 'private'),
      allowNull: false,
      defaultValue: 'public'
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    isRecalled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    }
  }, {
    sequelize,
    modelName: 'ChatMessage',
    tableName: 'ChatMessages'
  });
  return ChatMessage;
};
