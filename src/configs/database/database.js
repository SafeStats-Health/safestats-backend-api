const Sequelize = require('sequelize');
const credentials = require('./credentials');

const sequelize = new Sequelize(
  credentials['university']['database'],
  credentials['university']['username'],
  credentials['university']['password'],
  {
    host: credentials['university']['host'],
    port: credentials['university']['port'],
    dialect: credentials['university']['dialect'],
  }
);

module.exports = sequelize;
