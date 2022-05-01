const supertest = require("supertest");
const app = require("../../src/app");
const request = supertest(app);

const { faker } = require("@faker-js/faker");
const bcrypt = require('bcrypt');

const truncate = require("../utils/truncate");
const User = require("../../src/models/User");


describe('Authentication', () => {
  beforeEach(async () => {
    await truncate();
  });

  it('should authenticate with valid credentials', async () => {
    const salt = await bcrypt.genSalt(10);
    const password = "123456";

    const user = await User.create({
      name: faker.name.findName(),
      email: faker.internet.email(),
      password: await bcrypt.hash(password, salt),
    });

    const response = await request.post('/api/users/login').send({
      email: user.email,
      password: password
    });

    console.log(response.body);

    expect(response.status).toBe(200);
  });
});