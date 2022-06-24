/* eslint-disable no-undef */
const request = require('supertest');
const app = require('../../src/app');

const { faker } = require('@faker-js/faker');

const User = require('../../src/models/user');

describe('Authentication register', () => {
  it('should register a new user', async () => {
    const user = {
      name: faker.name.firstName(),
      email: faker.internet.email(),
      password: '123456',
      confirmPassword: '123456',
    };

    const response = await request(app).post('/api/users/register').send(user);

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

    const response = await request(app).post('/api/users/register').send(user);

    expect(response.status).toBe(400);
    expect(response.body.code).toBe('ERR_INVALID_EMAIL');
  });

  it('should not register a new user with existing email', async () => {
    const user = {
      name: faker.name.firstName(),
      email: faker.internet.email(),
      password: '123456',
      confirmPassword: '123456',
    };

    const response = await request(app).post('/api/users/register').send(user);

    expect(response.status).toBe(201);
    expect(response.body.message).toBe('User created');

    const response2 = await request(app).post('/api/users/register').send(user);

    expect(response2.status).toBe(400);
    expect(response2.body.code).toBe('ERR_EMAIL_ALREADY_USED');
  });
  it('should not register a new user with invalid password confirmation', async () => {
    const user = {
      name: faker.name.firstName(),
      email: faker.internet.email(),
      password: '123456',
      confirmPassword: '1234567',
    };

    const response = await request(app).post('/api/users/register').send(user);

    expect(response.status).toBe(400);
    expect(response.body.code).toBe('ERR_INVALID_PASS');
  });
});

describe('Authentication login', () => {
  it('should login an user after registering', async () => {
    const user = {
      name: faker.name.firstName(),
      email: faker.internet.email(),
      password: '123456',
      confirmPassword: '123456',
    };

    const response = await request(app).post('/api/users/register').send(user);

    expect(response.status).toBe(201);
    expect(response.body.message).toBe('User created');

    const response2 = await request(app).post('/api/users/login').send(user);

    expect(response2.status).toBe(200);
    expect(response2.body.token).toBeDefined();
  });
  it('should not login an user with invalid password', async () => {
    const user = {
      name: faker.name.firstName(),
      email: faker.internet.email(),
      password: '123456',
      confirmPassword: '123456',
    };

    const response = await request(app).post('/api/users/register').send(user);

    expect(response.status).toBe(201);
    expect(response.body.message).toBe('User created');

    user.password = 'invalid-password';

    const response2 = await request(app).post('/api/users/login').send(user);

    expect(response2.status).toBe(401);
    expect(response2.body.error).toBe('Invalid credentials');
  });

  it('should not login an user with invalid email', async () => {
    const user = {
      name: faker.name.firstName(),
      email: faker.internet.email(),
      password: '123456',
      confirmPassword: '123456',
    };

    const response = await request(app).post('/api/users/register').send(user);

    expect(response.status).toBe(201);
    expect(response.body.message).toBe('User created');

    user.email = 'invalid-email';

    const response2 = await request(app).post('/api/users/login').send(user);

    expect(response2.status).toBe(401);
    expect(response2.body.error).toBe('Invalid credentials');
  });
  it('should not login an user with invalid password', async () => {
    const user = {
      name: faker.name.firstName(),
      email: faker.internet.email(),
      password: '123456',
      confirmPassword: '123456',
    };

    const response = await request(app).post('/api/users/register').send(user);

    expect(response.status).toBe(201);
    expect(response.body.message).toBe('User created');

    user.password = 'invalid-password';

    const response2 = await request(app).post('/api/users/login').send(user);

    expect(response2.status).toBe(401);
    expect(response2.body.error).toBe('Invalid credentials');
  });
  it('should not login an deleted user', async () => {
    const user = {
      name: faker.name.firstName(),
      email: faker.internet.email(),
      password: '123456',
      confirmPassword: '123456',
    };

    const response = await request(app).post('/api/users/register').send(user);

    expect(response.status).toBe(201);
    expect(response.body.message).toBe('User created');

    const registeredUser = await User.findOne({ where: { email: user.email } });
    registeredUser.deletedAt = new Date();
    await registeredUser.save();

    const response2 = await request(app).post('/api/users/login').send(user);

    expect(response2.status).toBe(401);
  });
});
