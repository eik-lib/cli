const joiSemver = require('joi-extension-semver');
const Joi = require('@hapi/joi').extend(joiSemver);

module.exports = Joi.semver()
    .valid()
    .required();
