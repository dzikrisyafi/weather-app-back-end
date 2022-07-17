const sequelize = require("sequelize");

module.exports = (sequelize, DataTypes) => {
    const WeatherLocation = sequelize.define('WeatherLocation', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
        },
        lat: {
            type: DataTypes.DECIMAL(11, 10),
            allowNull: false
        },
        lon: {
            type: DataTypes.DECIMAL(11, 10),
            allowNull: false
        },
        timezone: {
            type: DataTypes.STRING(50),
            allowNull: false
        },
        pressure: {
            type: DataTypes.INTEGER(4),
            allowNull: false
        },
        humidity: {
            type: DataTypes.INTEGER(3),
            allowNull: false
        },
        wind_speed: {
            type: DataTypes.DECIMAL(11, 10),
            allowNull: false
        },
        forecast_category: {
            type: DataTypes.INTEGER(2),
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
        tableName: 'weather_location'
    });

    WeatherLocation.associate = (models) => {
        WeatherLocation.belongsTo(models.Weather, { foreignKey: 'weather_id', as:'weather', sourceKey: 'id' });
    }

    return WeatherLocation;
}