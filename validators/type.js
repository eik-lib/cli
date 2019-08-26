'use strict';

const Joi = require('@hapi/joi');

module.exports = Joi.string()
    .valid('js', 'css')
    .required();
