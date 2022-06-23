require('dotenv').config({ path: '.env' });

const EmailValidator = require('email-validator');
const bcrypt = require('bcrypt');

const User = require('../models/user');
const { createToken } = require('../services/jwt/jwt');
const sendMail = require('../services/email/email');

const encryptSalt = parseInt(process.env.ENCRYPT_SALT);

/**
 * @openapi
 * /users/register:
 *   post:
 *     summary: Inserts an user in the database.
 *     tags:
 *       - "Authentication"
 *     operationId: users_register
 *     x-eov-operation-handler: authentication-handler
 *
 *     requestBody:
 *       description: "User data to be registered."
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

    // Validating user email
    if (!EmailValidator.validate(user.email)) {
      return res.status(400).send({
        error: 'Invalid e-mail',
        code: 'ERR_INVALID_EMAIL',
      });
    }

    // Validating password and confirmation password
    if (user.password !== user.confirmPassword) {
      return res.status(400).send({
        error: 'Password and confirmation must be equal',
        code: 'ERR_INVALID_PASS',
      });
    }

    // Checking if user already exists
    const userExists = await User.findOne({
      where: {
        email: user.email,
      },
    });

    if (userExists) {
      if (!userExists.deletedAt) {
        return res.status(400).send({
          error: 'Email already in use',
          code: 'ERR_EMAIL_ALREADY_USED',
        });
      }

      await userExists.destroy();
    }

    // Encrypting password
    const salt = await bcrypt.genSalt(encryptSalt);
    user.password = await bcrypt.hash(user.password, salt);

    // Creating user
    await User.create(user);

    // Sending confirmation email to the user
    sendMail(
      '"Equipe SafeStats 🏥" <help.safestats@gmail.com>',
      user.email,
      'Seja bem-vindo ao SafeStats 🥰',
      '',
      '<b>Seja bem-vindo ao SafeStats!</b> <br/> Ficamos muito felizes com sua presença!'
    );

    return res.status(201).send({ message: 'User created' });
  },
];

/**
 * @openapi
 * /users/login:
 *   post:
 *     summary: Login a user.
 *     tags:
 *       - "Authentication"
 *     operationId: users_login
 *     x-eov-operation-handler: authentication-handler
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
 *       '401':
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
        error: 'Invalid credentials',
      });
    }

    if (user.deletedAt) {
      return res.status(401).send({
        error: 'User deleted',
      });
    }

    // Checking if password is correct
    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
      return res.status(401).send({
        error: 'Invalid credentials',
      });
    }

    // Creating JWT code
    const token = await createToken(user);

    return res.status(200).json({
      token: token,
    });
  },
];
