const database = require('../configs/database/database');

const Address = database.sequelize.define('addresses', {
  id: {
    type: database.Sequelize.UUID,
    allowNull: false,
    primaryKey: true,
    defaultValue: database.Sequelize.UUIDV4,
  },
  street: {
    type: database.Sequelize.STRING,
    allowNull: false,
  },
  city: {
    type: database.Sequelize.STRING,
    allowNull: false,
  },
  state: {
    type: database.Sequelize.STRING,
    allowNull: false,
  },
  zip: {
    type: database.Sequelize.STRING,
    allowNull: false,
  },
});

module.exports = Address;
