const database = require('../configs/database/database');

const User = database.sequelize.define('user', {
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
});

module.exports = User;
