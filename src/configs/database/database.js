const Sequelize = require('sequelize');
const credentials = require('./credentials.json');

const sequelize = new Sequelize(
  `postgres://${credentials['username']}
  :${credentials['password']}
  @${credentials['host']}
  :${credentials['port']}
  /${credentials['database']}`,
  {
    dialect: 'postgres',
  }
);

module.exports = sequelize;
