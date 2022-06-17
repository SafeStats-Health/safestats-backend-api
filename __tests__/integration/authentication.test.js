/* eslint-disable no-undef */
const supertest = require('supertest');
const app = require('../../src/app');
const request = supertest(app);

const { faker } = require('@faker-js/faker');
const bcrypt = require('bcrypt');

const truncate = require('../utils/truncate');
const database = require('../../src/configs/database/database').sequelize;
const User = require('../../src/models/user');

const encryptSalt = parseInt(process.env.ENCRYPT_SALT);

describe('Authentication', () => {
  beforeAll(async () => {
    await database.sync({ force: true });
  });
  beforeEach(async () => {
    await truncate();
  });

  it('should authenticate with valid credentials', async () => {
    const salt = await bcrypt.genSalt(encryptSalt);
    const password = '123456';

    const user = await User.create({
      name: faker.name.findName(),
      email: faker.internet.email(),
      password: await bcrypt.hash(password, salt),
    });

    const response = await request.post('/api/users/login').send({
      email: user.email,
      password: password,
    });

    expect(response.status).toBe(200);
  });

  it('should not authenticate if there is no user with the give email', async () => {
    const response = await request.post('/api/users/login').send({
      email: faker.internet.email(),
      password: faker.internet.password(),
    });

    expect(response.status).toBe(401);
  });

  it('should not authenticate if the password is invalid', async () => {
    const salt = await bcrypt.genSalt(encryptSalt);
    const password = '123456';

    const user = await User.create({
      name: faker.name.findName(),
      email: faker.internet.email(),
      password: await bcrypt.hash(password, salt),
    });

    const response = await request.post('/api/users/login').send({
      email: user.email,
      password: 'wrong-password',
    });

    expect(response.status).toBe(401);
  });
});
