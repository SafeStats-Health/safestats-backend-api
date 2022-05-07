const { sequelize } = require('../../src/configs/database/database');

module.exports = async () => {
  try {
    return Promise.all(
      Object.keys(sequelize.models).map((key) => {
        return sequelize.models[key].destroy({ truncate: true });
      })
    );
  } catch (error) {
    console.log(error);
  }
};
