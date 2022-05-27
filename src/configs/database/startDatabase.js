// Start the database and create the tables
async function startDatabase() {
  const database = require('./database').sequelize;
  require('../../models/User');
  require('../../models/Token');

  try {
    await database.sync();

    console.log('Database started');
  } catch (error) {
    console.log(error);
  }
}

module.exports = startDatabase;
