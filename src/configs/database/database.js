const Sequelize = require('sequelize');
const credentials = require('./credentials');
require('dotenv').config();

const env = process.env.ENVIRONMENT;
var environment;

if (env === 'LOCAL') {
  environment = "development";
} else if (env === 'UNIVERSITY') {
  environment = "university";
}


const sequelize = new Sequelize(
  credentials[environment]['database'],
  credentials[environment]['username'],
  credentials[environment]['password'],
  {
    host: credentials[environment]['host'],
    port: credentials[environment]['port'],
    dialect: credentials[environment]['dialect'],
  }
);

module.exports = sequelize;