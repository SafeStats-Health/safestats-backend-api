const Sequelize = require('sequelize');
const credentials = require('./credentials');

const sequelize = new Sequelize(
  credentials['development']['database'],
  credentials['development']['username'],
  credentials['development']['password'],
  {
    host: credentials['development']['host'],
    port: credentials['development']['port'],
    dialect: 'postgres',
  }
);

module.exports = sequelize;
