'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('ChatMessages', 'isRecalled', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn('ChatMessages', 'isRecalled');
  }
};
