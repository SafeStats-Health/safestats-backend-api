const database = require('../configs/database/database');

const TrustedContact = database.sequelize.define('trustedContacts', {
  id: {
    type: database.Sequelize.UUID,
    allowNull: false,
    primaryKey: true,
    defaultValue: database.Sequelize.UUIDV4,
  },
  name: {
    type: database.Sequelize.STRING,
    allowNull: false,
  },
  email: {
    type: database.Sequelize.STRING,
    allowNull: false,
    unique: true,
    index: true,
  },
  phone: {
    type: database.Sequelize.STRING,
    allowNull: true,
  },
  birthdate: {
    type: database.Sequelize.DATE,
    allowNull: true,
  },
});

module.exports = TrustedContact;
