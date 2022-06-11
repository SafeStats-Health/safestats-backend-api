const database = require('../configs/database/database');

const Token = database.sequelize.define(
  'token',
  {
    user_id: {
      type: database.Sequelize.UUID,
      allowNull: false,
      primaryKey: true,
    },
    token: {
      type: database.Sequelize.STRING,
      allowNull: false,
    },
    expiration: {
      type: database.Sequelize.INTEGER,
      defaultValue: 60 * 60,
      allowNull: false,
    },
    createdAt: {
      type: database.Sequelize.DATE,
      defaultValue: database.Sequelize.NOW,
      allowNull: false,
    },
  },
  {
    timestamps: false,
  }
);

module.exports = Token;
