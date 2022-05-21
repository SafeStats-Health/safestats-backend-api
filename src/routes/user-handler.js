require('dotenv').config({ path: '.env' });

const crypto = require('crypto');
const bcrypt = require('bcrypt');
const EmailValidator = require('email-validator');

const User = require('../models/user');
const Token = require('../models/token');
const sendMail = require('../services/email/email');

const ENCRYPT_SALT = parseInt(process.env.ENCRYPT_SALT);
const clientURL = process.env.CLIENT_URL;

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

    if (!EmailValidator.validate(user.email)) {
      return res.status(400).send({
        error: 'Invalid e-mail',
      });
    }

    // Validating password and confirmation
    if (user.password !== user.confirmPassword) {
      return res.status(400).send({
        error: 'Password and confirmation must be equal',
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
        error: 'User already exists',
      });
    }

    // Encrypting password
    const salt = await bcrypt.genSalt(ENCRYPT_SALT);
    user.password = await bcrypt.hash(user.password, salt);

    // Creating user
    await User.create(user);

    // Sending confirmation email to the user
    sendMail(
      '"Equipe SafeStats 🏥" <help.safestats@gmail.com>',
      await user.email,
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

    // Checking if password is correct
    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
      return res.status(401).send({
        error: 'Invalid credentials',
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

/**
 * @openapi
 * /users/request-password-recover:
 *   post:
 *     summary: Request a user password recover.
 *     tags:
 *       - "users"
 *     operationId: users_request_password_recover
 *     x-eov-operation-handler: user-handler
 *
 *     requestBody:
 *       description: "User email."
 *       content:
 *         "application/json":
 *           schema:
 *             type: object
 *             required:
 *               - email
 *
 *             properties:
 *               email:
 *                 type: string
 *                 example: "jose@email.com"
 *
 *     responses:
 *       '200':
 *         description: "Recovery link sent"
 *       '404':
 *         description: "User not found"
 */
module.exports.users_request_password_recover = [
  async function (req, res) {
    const { email } = req.body;

    // Checking if user email exists
    const user = await User.findOne({
      where: {
        email,
      },
    });

    // Returning error if email doesn't exist
    if (!user) {
      return res.status(404).send({
        error: 'User not found',
      });
    }

    // Generating a recovery token
    const token = await Token.findOne({
      where: {
        user_id: user.id,
      },
    });

    let resetToken = crypto.randomBytes(32).toString('hex');

    if (token) {
      await Token.update(
        {
          token: resetToken,
          createdAt: new Date(),
        },
        {
          where: {
            user_id: user.id,
          },
        }
      );
    } else {
      await Token.create({ user_id: user.id, token: resetToken });
    }

    // Send a link to the user to recover his password
    const link = `${clientURL}/passwordReset?token=${resetToken}&user_id=${user.id}`;

    await sendMail(
      '"Equipe SafeStats 🏥" <help.safestats@gmail.com>',
      await user.email,
      'Recuperação de senha 🔐',
      '',
      `
      <b>Olá ${user.name}, aqui está seu link para recuperação de senha!</b><br/>
      ${link}
      `
    );

    return res.status(200).send({
      message: 'Recovery link sent',
    });
  },
];

/**
 * @openapi
 * /users/recover-user-password:
 *   post:
 *     summary: Reset user password.
 *     tags:
 *       - "users"
 *     operationId: users_request_password_recover
 *     x-eov-operation-handler: user-handler
 *
 *     requestBody:
 *       description: "User email."
 *       content:
 *         "application/json":
 *           schema:
 *             type: object
 *             required:
 *               - email
 *
 *             properties:
 *               email:
 *                 type: string
 *                 example: "jose@email.com"
 *
 *     responses:
 *       '200':
 *         description: "Recovery link sent"
 *       '404':
 *         description: "User not found"
 */
