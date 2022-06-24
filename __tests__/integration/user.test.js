/* eslint-disable no-undef */
const request = require('supertest');
const app = require('../../src/app');

const { faker } = require('@faker-js/faker');

describe('User', () => {
  it('should delete a logged user using his token', async () => {
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

    user.passwordConfirmation = user.confirmPassword;

    const token = response2.body.token;

    const response3 = await request(app)
      .post('/api/users/delete-user')
      .set({
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      })
      .send(user);

    expect(response3.status).toBe(200);
    expect(response3.body.message).toBe('User deleted.');
  });

  it('should not delete a logged user with different confirmation password', async () => {
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

    user.passwordConfirmation = 'invalid-password';

    const token = response2.body.token;

    const response3 = await request(app)
      .post('/api/users/delete-user')
      .set({
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      })
      .send(user);

    expect(response3.status).toBe(400);
    expect(response3.body.error).toBe(
      'Password and confirmation must be equal'
    );
  });
});
