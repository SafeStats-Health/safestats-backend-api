// Start the database and create the tables
async function startDatabase() {
  const database = require('./database').sequelize;
  // require('../../models/address');
  require('../../models/bloodDonation');
  require('../../models/healthPlan');
  require('../../models/token');
  require('../../models/trustedContact');
  require('../../models/user');

  try {
    await database.sync();
    console.log('Database started');
  } catch (error) {
    console.log(error);
  }
}

module.exports = startDatabase;
