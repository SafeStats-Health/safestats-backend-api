const database = require('../configs/database/database');

const MedicalInfo = database.sequelize.define('medicalInfos', {
  id: {
    type: database.Sequelize.UUID,
    allowNull: false,
    primaryKey: true,
    defaultValue: database.Sequelize.UUIDV4,
  },
  type: {
    type: database.Sequelize.STRING,
    allowNull: false,
  },
  name: {
    type: database.Sequelize.STRING,
    allowNull: false,
  },
});

module.exports = MedicalInfo;
