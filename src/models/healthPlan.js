const database = require('../configs/database/database');

const HealthPlan = database.sequelize.define('healthPlans', {
  id: {
    type: database.Sequelize.UUID,
    allowNull: false,
    primaryKey: true,
    defaultValue: database.Sequelize.UUIDV4,
  },
  institution: {
    type: database.Sequelize.STRING,
    allowNull: false,
  },
  type: {
    type: database.Sequelize.STRING,
    allowNull: false,
  },
  accomodation: {
    type: database.Sequelize.STRING,
    allowNull: false,
  },
});

module.exports = HealthPlan;
