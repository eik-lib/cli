const Joi = require('@hapi/joi');

module.exports = Joi.string().valid('default', 'esm', 'iife', 'cjs');
