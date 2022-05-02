const bcrypt = require('bcrypt');
const User = require('../models/user');

/**
 * @openapi
 * /users/register:
 *   post:
 *     summary: Inserts an user in the database.
 *     tags:
 *       - "users"
 *     operationId: users_register
 *     x-eov-operation-handler: user-handler
 *
 *     requestBody:
 *       description: "User data to be included."
 *       content:
 *         "application/json":
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *               - confirmPassword
 *
 *             properties:
 *               name:
 *                 type: string
 *                 example: "José Pereira da Silva"
 *               email:
 *                 type: string
 *                 example: "jose@email.com"
 *               password:
 *                 type: string
 *                 example: "123456"
 *               confirmPassword:
 *                 type: string
 *                 example: "123456"
 *
 *     responses:
 *       '201':
 *         description: "User created"
 *       '400':
 *         description: "Invalid data"
 */
module.exports.users_register = [
  async function (req, res) {
    const user = req.body;

    // Validating password and confirmation
    if (user.password !== user.confirmPassword) {
      return res.status(400).send({
        error: 'Password and confirmation must be equal.',
      });
    }

    // Checking if user already exists
    const userExists = await User.findOne({
      where: {
        email: user.email,
      },
    });

    if (userExists) {
      return res.status(400).send({
        error: 'User already exists.',
      });
    }

    // Encrypting password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);

    // Creating user
    await User.create(user);

    return res.status(201).json({ message: 'User created.' });
  },
];

/**
 * @openapi
 * /users/login:
 *   post:
 *     summary: Login an user.
 *     tags:
 *       - "users"
 *     operationId: users_login
 *     x-eov-operation-handler: user-handler
 *
 *     requestBody:
 *       description: "User credentials."
 *       content:
 *         "application/json":
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *
 *             properties:
 *               email:
 *                 type: string
 *                 example: "jose@email.com"
 *               password:
 *                 type: string
 *                 example: "123456"
 *
 *     responses:
 *       '200':
 *         description: "User logged in"
 *       '400':
 *         description: "Invalid credentials"
 */
module.exports.users_login = [
  async function (req, res) {
    const { email, password } = req.body;

    // Checking if user exists
    const user = await User.findOne({
      where: {
        email,
      },
    });

    if (!user) {
      return res.status(401).send({
        error: 'Invalid credentials.',
      });
    }

    // Checking if password is correct
    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
      return res.status(401).send({
        error: 'Invalid credentials.',
      });
    }

    return res.status(200).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  },
];
