/* eslint-disable no-undef */
const request = require('supertest');
const app = require('../../src/app');

const { faker } = require('@faker-js/faker');
const User = require('../../src/models/user');
const Token = require('../../src/models/token');

describe('User delete', () => {
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

describe('User recover password', () => {
  it('should request a password recovery email', async () => {
    const user = {
      name: faker.name.firstName(),
      email: faker.internet.email(),
      password: '123456',
      confirmPassword: '123456',
    };

    const response = await request(app).post('/api/users/register').send(user);

    expect(response.status).toBe(201);
    expect(response.body.message).toBe('User created');

    const response2 = await request(app)
      .post('/api/users/request-password-recover')
      .send(user);

    expect(response2.status).toBe(200);
    expect(response2.body.message).toBe('Recovery link sent');
  });
  it('should not request a password recovery email with invalid email', async () => {
    const response = await request(app)
      .post('/api/users/request-password-recover')
      .send({ email: 'invalid-email@email.com' });

    expect(response.status).toBe(404);
    expect(response.body.error).toBe('User not found');
  });
  it('should update a user password using his token', async () => {
    const user = {
      name: faker.name.firstName(),
      email: faker.internet.email(),
      password: '123456',
      confirmPassword: '123456',
    };

    const response = await request(app).post('/api/users/register').send(user);

    expect(response.status).toBe(201);
    expect(response.body.message).toBe('User created');

    const response2 = await request(app)
      .post('/api/users/request-password-recover')
      .send(user);

    expect(response2.status).toBe(200);
    expect(response2.body.message).toBe('Recovery link sent');

    const userInstance = await User.findOne({ where: { email: user.email } });

    const userToken = await Token.findOne({
      where: {
        userId: userInstance.id,
      },
    });

    const response3 = await request(app)
      .post('/api/users/update-password-token')
      .send({
        token: userToken.token,
        newPassword: '123456',
        newPasswordConfirmation: '123456',
      });

    expect(response3.status).toBe(200);
    expect(response3.body.message).toBe('Password updated');
  });

  it('should not update a user password with invalid token', async () => {
    const user = {
      name: faker.name.firstName(),
      email: faker.internet.email(),
      password: '123456',
      confirmPassword: '123456',
    };

    const response = await request(app).post('/api/users/register').send(user);

    expect(response.status).toBe(201);
    expect(response.body.message).toBe('User created');

    const response2 = await request(app)
      .post('/api/users/request-password-recover')
      .send(user);

    expect(response2.status).toBe(200);
    expect(response2.body.message).toBe('Recovery link sent');

    const response3 = await request(app)
      .post('/api/users/update-password-token')
      .send({
        token: 'invalid-token',
        newPassword: '123456',
        newPasswordConfirmation: '123456',
      });

    expect(response3.status).toBe(404);
    expect(response3.body.error).toBe('Token not found');
  });
  it('should not update a user password with different confirmation password', async () => {
    const user = {
      name: faker.name.firstName(),
      email: faker.internet.email(),
      password: '123456',
      confirmPassword: '123456',
    };

    const response = await request(app).post('/api/users/register').send(user);

    expect(response.status).toBe(201);
    expect(response.body.message).toBe('User created');

    const response2 = await request(app)
      .post('/api/users/request-password-recover')
      .send(user);

    expect(response2.status).toBe(200);
    expect(response2.body.message).toBe('Recovery link sent');

    const userInstance = await User.findOne({ where: { email: user.email } });

    const userToken = await Token.findOne({
      where: {
        userId: userInstance.id,
      },
    });

    const response3 = await request(app)
      .post('/api/users/update-password-token')
      .send({
        token: userToken.token,
        newPassword: '123456',
        newPasswordConfirmation: 'invalid-password',
      });

    expect(response3.status).toBe(400);
    expect(response3.body.error).toBe(
      'Password and confirmation must be equal'
    );
  });
});

describe('User preferred language', () => {
  it('should change the preferred language', async () => {
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

    const token = response2.body.token;

    var oldLanguage = await User.findOne({
      where: { email: user.email },
    });
    oldLanguage = oldLanguage.preferredLanguage;

    const response3 = await request(app)
      .post('/api/users/update-preferrable-language')
      .set({
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      })
      .send({
        language: 'EN-US',
      });

    expect(response3.status).toBe(200);
    expect(response3.body.message).toBe('Preferrable language updated');

    var newLanguage = await User.findOne({
      where: { email: user.email },
    });

    expect(newLanguage.preferredLanguage).toBe('EN-US');
    expect(newLanguage.preferredLanguage).not.toBe(oldLanguage);
  });
  it('should not change the preferred language if it is invalid', async () => {
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

    const token = response2.body.token;

    const response3 = await request(app)
      .post('/api/users/update-preferrable-language')
      .set({
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      })
      .send({
        language: 'invalid-language',
      });

    expect(response3.status).toBe(400);
  });
});
