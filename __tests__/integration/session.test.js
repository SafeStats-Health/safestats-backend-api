const { User } = require('../../src/models/User');

describe('Authentication', () => {
  it('should receive JWT token when authenticated with valid credentials', async () => {
    await User.create({
      name: "José Pereira da Silva",
      email: "jose@email.com",
      password: "123456",
      confirmPassword: "123456"
    });

    console.log(user);

    expect(user.email).toBe("jose@email.com");
  });
});