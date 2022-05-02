const Sequelize = require('sequelize');
const credentials = require('./credentials');
require('dotenv').config({
  path: process.env.NODE_ENV === 'TEST' ? '.env.test' : '.env',
});

const env = process.env.ENVIRONMENT;
var environment;

if (env === 'LOCAL') {
  environment = 'development';
} else if (env === 'UNIVERSITY') {
  environment = 'university';
} else if (env === 'TEST') {
  environment = 'test';
}

var database = {};

const sequelize = new Sequelize(
  credentials[environment]['database'],
  credentials[environment]['username'],
  credentials[environment]['password'],
  {
    host: credentials[environment]['host'],
    port: credentials[environment]['port'],
    dialect: credentials[environment]['dialect'],
    storage: './__tests__/database.sqlite',
    loggin: credentials[environment]['logging'],
    define: credentials[environment]['define'],
  }
);

database.sequelize = sequelize;
database.Sequelize = Sequelize;

module.exports = database;
