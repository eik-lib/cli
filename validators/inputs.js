const Joi = require('@hapi/joi');

module.exports = Joi.object({
    js: Joi.string(),
    css: Joi.string(),
}).required();
