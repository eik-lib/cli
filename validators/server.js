const Joi = require('@hapi/joi');

module.exports = Joi.string()
    .uri()
    .required();
