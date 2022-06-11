require('dotenv').config({
  path: process.env.NODE_ENV === 'TEST' ? '.env.test' : '.env',
});

const Sequelize = require('sequelize');
const credentials = require('./credentials');

const {
  TIMEZONE: timezone,
  ENVIRONMENT: env,
  DATABASE_URL: databaseUrl,
} = process.env;

var environment;

if (env === 'LOCAL') {
  environment = 'development';
} else if (env === 'UNIVERSITY') {
  environment = 'university';
} else if (env === 'TEST') {
  environment = 'test';
}

var database = {};
var sequelize;

if (env != 'PRODUCTION') {
  sequelize = new Sequelize(
    credentials[environment]['database'],
    credentials[environment]['username'],
    credentials[environment]['password'],
    {
      host: credentials[environment]['host'],
      port: credentials[environment]['port'],
      dialect: credentials[environment]['dialect'],
      storage: credentials[environment]['storage'] || ':memory:',
      loggin: credentials[environment]['logging'],
      define: credentials[environment]['define'],
      timezone: timezone,
    }
  );
} else {
  sequelize = new Sequelize(databaseUrl, {});
}

database.sequelize = sequelize;
database.Sequelize = Sequelize;

module.exports = database;
