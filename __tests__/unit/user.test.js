/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
const truncate = require('../utils/truncate');
const User = require('../../src/models/User');

describe('User', () => {
  beforeEach(async () => {
    await truncate();
  });

  it('should encrypt user password', async () => {});
});
