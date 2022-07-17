const sequelize = require("sequelize");

module.exports = (sequelize, DataTypes) => {
    const Weather = sequelize.define('Weather', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            allowNull: false
        },
        main: {
            type: DataTypes.STRING(50),
            allowNull: false
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        createdAt: {
            type: DataTypes.DATE,
            allowNull: false
        },
        updatedAt: {
            type: DataTypes.DATE,
            allowNull: false
        }
    }, {
        tableName: 'weathers'
    });

    Weather.associate = (models) => {
        Weather.hasMany(models.WeatherLocation, { foreignKey: 'weather_id', as: 'weather' });
    }

    return Weather;
}