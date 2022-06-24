require('dotenv').config({ path: '.env' });

const Sequelize = require('sequelize');
const databaseCredentials = require('./databaseCredentials');

// Getting environment variables
var { ENVIRONMENT: environment, DATABASE_URL: databaseUrl } = process.env;

var database = {},
  sequelize;

if (process.env.NODE_ENV === 'TEST') {
  environment = 'test';
}

if (environment != 'PRODUCTION') {
  // Creating a new Sequelize instance for non production environment
  sequelize = new Sequelize(
    databaseCredentials[environment]['database'],
    databaseCredentials[environment]['username'],
    databaseCredentials[environment]['password'],
    {
      host: databaseCredentials[environment]['host'],
      port: databaseCredentials[environment]['port'],
      dialect: databaseCredentials[environment]['dialect'],
      storage: databaseCredentials[environment]['storage'] || ':memory:',
      logging: databaseCredentials[environment]['logging'],
    }
  );
} else {
  // Creating a new Sequelize instance for production environment
  sequelize = new Sequelize(databaseUrl, {
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
  });

  sequelize
    .authenticate()
    .then(() => {
      console.log('Connection has been established successfully.');
    })
    .catch((err) => {
      console.error('Unable to connect to the database:', err);
    });
}

database.sequelize = sequelize;
database.Sequelize = Sequelize;

module.exports = database;
