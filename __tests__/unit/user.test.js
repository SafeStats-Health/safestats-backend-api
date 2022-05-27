/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
const truncate = require('../utils/truncate');
const database = require('../../src/configs/database/database').sequelize;
const User = require('../../src/models/User');

describe('User', () => {
  beforeAll(async () => {
    await database.sync({ force: true });
  });
  beforeEach(async () => {
    await truncate();
  });

  it('should encrypt user password', async () => {});
});
