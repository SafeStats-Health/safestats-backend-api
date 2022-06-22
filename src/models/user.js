const database = require('../configs/database/database');

const User = database.sequelize.define('users', {
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
  password: {
    type: database.Sequelize.STRING,
    allowNull: false,
  },
  phone: {
    type: database.Sequelize.STRING,
    allowNull: true,
  },
  birthdate: {
    type: database.Sequelize.DATE,
    allowNull: true,
  },
  addressId: {
    type: database.Sequelize.UUID,
    allowNull: true,
    references: {
      model: 'addresses',
      key: 'id',
    },
  },
  trustedContactId: {
    type: database.Sequelize.UUID,
    allowNull: true,
    references: {
      model: 'trustedContacts',
      key: 'id',
    },
  },
  healthPlanId: {
    type: database.Sequelize.UUID,
    allowNull: true,
    references: {
      model: 'healthPlans',
      key: 'id',
    },
  },
  bloodDonationId: {
    type: database.Sequelize.UUID,
    allowNull: true,
    references: {
      model: 'bloodDonations',
      key: 'id',
    },
  },
  preferredLanguage: {
    type: database.Sequelize.STRING,
    allowNull: false,
    defaultValue: 'PT-BR',
  },
  deletedAt: {
    type: database.Sequelize.DATE,
    allowNull: true,
  },
});

module.exports = User;
