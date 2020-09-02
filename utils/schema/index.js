const Ajv = require('ajv');
const schema = require('./schema.json');

const ajv = new Ajv();
module.exports = ajv.compile(schema);