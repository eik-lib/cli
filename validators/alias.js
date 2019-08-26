const Joi = require('@hapi/joi');

module.exports = Joi.alternatives(
    Joi.number(),
    Joi.string()
        .min(1)
        .regex(/^[a-z0-9-_]+$/)
).required();
