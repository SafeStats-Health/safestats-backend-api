// Start the database
async function startDatabase() {
  const database = require('./database');
  const User = require('../../models/User');

  try {
    await database.sync();

    console.log('Database started');
  } catch (error) {
    console.log(error);
  }
}

module.exports = startDatabase;
