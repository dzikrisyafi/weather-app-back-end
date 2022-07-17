'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
     await queryInterface.createTable('weather_location', { 
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      lat: {
        type: Sequelize.DECIMAL(16,12),
        allowNull: false
      },
      lon: {
        type: Sequelize.DECIMAL(16,12),
        allowNull: false
      },
      timezone: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      pressure: {
        type: Sequelize.INTEGER(4),
        allowNull: false
      },
      humidity: {
        type: Sequelize.INTEGER(3),
        allowNull: false
      },
      wind_speed: {
        type: Sequelize.DECIMAL(4, 2),
        allowNull: false
      },
      forecast_category: {
        type: Sequelize.INTEGER(2),
        allowNull: false
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('weather_location');
  }
};
