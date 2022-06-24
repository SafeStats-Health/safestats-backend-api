const database = require('../configs/database/database');

const BloodDonation = database.sequelize.define('bloodDonations', {
  id: {
    type: database.Sequelize.UUID,
    allowNull: false,
    primaryKey: true,
    defaultValue: database.Sequelize.UUIDV4,
  },
  bloodType: {
    type: database.Sequelize.STRING,
    allowNull: false,
  },
  donationLocation: {
    type: database.Sequelize.STRING,
    allowNull: false,
  },
  didDonate: {
    type: database.Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
});

module.exports = BloodDonation;
