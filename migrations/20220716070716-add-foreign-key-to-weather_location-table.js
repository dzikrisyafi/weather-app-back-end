'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('weather_location',  
      'weather_id',
      {
        type: Sequelize.INTEGER,
        after: 'wind_speed',
        references: {
          model: 'weathers',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      }
    );
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('weather_location', 'weather_id');
  }
};
