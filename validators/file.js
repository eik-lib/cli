const Joi = require('@hapi/joi');

module.exports = Joi.string().regex(/^[a-zA-Z0-9-_]+\.(json|js|css)$/);
