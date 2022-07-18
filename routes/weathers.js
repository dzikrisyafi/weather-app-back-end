var express = require('express');
var router = express.Router();
const Validator = require('fastest-validator');
const axios = require('axios');
const { WeatherLocation, Weather } = require('../models');

const v = new Validator();

const forecast = async (lat, lon, exclude) => {
    try {
        const apiKey = process.env.API_KEY;
        const response = await axios.get(`https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&exclude=${exclude}&appid=${apiKey}`);
        return response;
    } catch (error) {
        console.log(error);
    }
}

router.post('/', async (req, res, next) => {
    const schema = {
        lat: 'number|empty:false',
        lon: 'number|empty:false',
        exclude: 'string|empty:false'
    }

    const validate = v.validate(req.body, schema);
    if (validate.length) {
        return res.status(400).json(validate);
    }

    const { lat, lon, exclude } = req.body;
    const { data } = await forecast(lat, lon, exclude);
    const { timezone } = data;
    
    let forecastData;
    let forecastCategory;
    if (exclude === 'hourly,daily') {
        forecastCategory = 1;
    } else if (exclude === 'current,daily') {
        forecastCategory = 2;
        forecastData = data.hourly;
    } else if (exclude === 'current,hourly') {
        forecastCategory = 3;
        forecastData = data.daily;
    }

    const { count } = await WeatherLocation.findAndCountAll({ where: { lat: data.lat, lon: data.lon, forecast_category: forecastCategory } });
    if (count) {
        return res.status(400).json({ 
            status: 'fail',
            message: 'Ups! Location already exists' 
        });
    }

    if (Array.isArray(forecastData)) {
        const weather = forecastData.map((val) => { 
            return { 
                id: val.weather[0].id, 
                main: val.weather[0].main, 
                description: val.weather[0].description 
            }});
        await Weather.bulkCreate(weather, { updateOnDuplicate: ['main', 'description'] });

        forecastData = forecastData.map((val) => {
            return {
                lat: data.lat,
                lon: data.lon,
                timezone: timezone,
                pressure: val.pressure,
                humidity: val.humidity,
                wind_speed: val.wind_speed,
                weather_id: val.weather[0].id,
                forecast_category: forecastCategory
            }
        });

        forecastData = await WeatherLocation.bulkCreate(forecastData);
    } else {
        const { pressure, humidity, wind_speed } = data.current;

        const { id } = data.current.weather[0];
        let weather = await Weather.findByPk(id);
        if (!weather) {
            weather = await Weather.create(data.current.weather[0]);
        }
        
        forecastData = { 
            lat: data.lat, 
            lon: data.lon, 
            timezone, 
            pressure, 
            humidity, 
            wind_speed, 
            weather_id: weather.id, 
            forecast_category: forecastCategory 
        };

        forecastData = await WeatherLocation.create(forecastData);
    }

    res.status(201).json({
        status: 'success',
        message: 'New location has been added!',
    });
});

router.put('/', async (req, res, next) => {
    const schema = {
        lat: 'number|empty:false',
        lon: 'number|empty:false',
        exclude: 'string|empty:false'
    }
    const validate = v.validate(req.body, schema);

    if (validate.length) {
        return res.status(400).json(validate);
    }

    const { lat, lon, exclude } = req.body;
    const { data } = await forecast(lat, lon, exclude);
    const { timezone } = data;

    let forecastData;
    let forecastCategory;
    if (exclude === 'hourly,daily') {
        forecastCategory = 1;
    } else if (exclude === 'current,daily') {
        forecastCategory = 2;
        forecastData = data.hourly;
    } else if (exclude === 'current,hourly') {
        forecastCategory = 3;
        forecastData = data.daily;
    }

    const { count, rows } = await WeatherLocation.findAndCountAll({ where: { lat: data.lat, lon: data.lon, forecast_category: forecastCategory } });
    if (!count) {
        return res.status(404).json({
            status: 'fail',
            message: 'Location not found'
        });
    }

    if (Array.isArray(forecastData)) {
        const weather = forecastData.map((val) => {
            return {
                id: val.weather[0].id,
                main: val.weather[0].main,
                description: val.weather[0].description
            }
        });
        await Weather.bulkCreate(weather, { updateOnDuplicate: ['main', 'description'] });

        forecastData = forecastData.map((val, index) => {
            return {
                id: rows[index].id,
                lat: data.lat,
                lon: data.lon,
                timezone: timezone,
                pressure: val.pressure,
                humidity: val.humidity,
                wind_speed: val.wind_speed,
                weather_id: val.weather[0].id,
                forecast_category: forecastCategory
            }
        });

        forecastData = await WeatherLocation.bulkCreate(forecastData, { updateOnDuplicate: ['pressure', 'humidity', 'wind_speed'] });
    } else {
        const { pressure, humidity, wind_speed } = data.current;

        const { id } = data.current.weather[0];
        let weather = await Weather.findByPk(id);
        if (!weather) {
            weather = await Weather.create(data.current.weather[0]);
        }

        forecastData = {
            id: rows[0].id,
            lat: data.lat,
            lon: data.lon,
            timezone,
            pressure,
            humidity,
            wind_speed,
            weather_id: weather.id,
            forecast_category: forecastCategory
        };

        forecastData = await WeatherLocation.create(forecastData, { updateOnDuplicate: ['pressure', 'humidity', 'wind_speed', 'weather_id'] });
    }

    res.status(200).json({
        status: 'success',
        message: 'Location has been updated!',
    });
});

router.get('/', async (req, res, next) => {
    const { lat, lon, exclude } = req.query;
    let forecastCategory;
    if (exclude === 'hourly,daily') {
        forecastCategory = 1;
    } else if (exclude === 'current,daily') {
        forecastCategory = 2;
    } else if (exclude === 'current,hourly') {
        forecastCategory = 3;
    }

    const forecastData = await WeatherLocation.findAll({
        attributes: ['lat', 'lon', 'timezone', 'pressure', 'humidity', 'wind_speed'], 
        where: { lat: Number(lat).toFixed(4), lon: Number(lon).toFixed(4), forecast_category: forecastCategory },
        include: [{model: Weather, as: 'weather', attributes: ['id', 'main', 'description']}]
    });
    if (!forecastData.length) {
        return res.status(404).json({
            status: 'fail',
            message: 'Location not found'
        });
    }

    res.status(200).json({
        status: 'success',
        message: 'Success to get weather location',
        data: forecastData
    });
});

module.exports = router;