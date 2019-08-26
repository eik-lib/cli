const joiSemver = require('joi-extension-semver');
const Joi = require('@hapi/joi').extend(joiSemver);
const alias = require('./alias');
const version = require('./version');

const uri = Joi.string().uri();

module.exports = Joi.alternatives()
    .try(uri, version, alias)
    .required();
