/* eslint-disable no-undef */
const supertest = require('supertest');
const app = require('../../src/app');
const request = supertest(app);

const { faker } = require('@faker-js/faker');
// const bcrypt = require('bcrypt');

const truncate = require('../utils/truncate');
const User = require('../../src/models/User');

describe('Registration', () => {
  beforeEach(async () => {
    await truncate();
  });

  it('should register a new user with valid parameters', async () => {
    const user = {
      name: faker.name.findName(),
      email: faker.internet.email(),
      password: '123456',
      confirmPassword: '123456',
    };

    const response = await request.post('/api/users/register').send(user);

    expect(response.status).toBe(201);
  });

  it('should not register a new user with wrong password confirmation', async () => {
    const user = {
      name: faker.name.findName(),
      email: faker.internet.email(),
      password: '123456',
      confirmPassword: 'wrong-password',
    };

    const response = await request.post('/api/users/register').send(user);

    expect(response.status).toBe(400);
  });

  it('should not register a new user with an existing email', async () => {
    const user = {
      name: faker.name.findName(),
      email: faker.internet.email(),
      password: '123456',
      confirmPassword: '123456',
    };

    await User.create(user);

    const response = await request.post('/api/users/register').send(user);

    expect(response.status).toBe(400);
  });
});
