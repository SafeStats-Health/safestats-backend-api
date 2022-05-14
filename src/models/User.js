const database = require('../configs/database/database');

const User = database.sequelize.define('user', {
  id: {
    type: database.Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
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
  createdAt: {
    type: database.Sequelize.DATE,
    allowNull: false,
  },
  updatedAt: {
    type: database.Sequelize.DATE,
    allowNull: false,
  },
  deletedAt: {
    type: database.Sequelize.DATE,
    allowNull: true,
  },
});

module.exports = User;
