/* eslint-disable no-undef */
const supertest = require('supertest');
const app = require('../../src/app');
const request = supertest(app);

const { faker } = require('@faker-js/faker');
// const bcrypt = require('bcrypt');

describe('Authentication', () => {
  it('should register a new user', async () => {
    const user = {
      name: faker.name.firstName(),
      email: faker.internet.email(),
      password: '123456',
      confirmPassword: '123456',
    };

    const response = await request(app).post('/api/users/register').send(user);
    console.log(response.body);

    expect(response.status).toBe(201);
    expect(response.body.message).toBe('User created');
  });

  it('should not register a new user with invalid email', async () => {
    const user = {
      name: faker.name.firstName(),
      email: 'invalid-email',
      password: '123456',
      confirmPassword: '123456',
    };

    const response = await request.post('/api/users/register').send(user);

    expect(response.status).toBe(400);
    expect(response.body.code).toBe('ERR_INVALID_EMAIL');
  });
});
