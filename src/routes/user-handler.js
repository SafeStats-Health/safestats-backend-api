require('dotenv').config({ path: '.env' });

const crypto = require('crypto');
const bcrypt = require('bcrypt');
const EmailValidator = require('email-validator');
const moment = require('moment');
const passport = require('passport');

const User = require('../models/user');
const Token = require('../models/token');
const { createToken } = require('../services/jwt/jwt');
const sendMail = require('../services/email/email');

const encryptSalt = parseInt(process.env.ENCRYPT_SALT);
const { FRONT_URL: frontURL } = process.env;

/**
 * @openapi
 * /users/register:
 *   post:
 *     summary: Inserts an user in the database.
 *     tags:
 *       - "Users"
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
        deleted_at: null,
      },
    });

    if (userExists) {
      return res.status(400).send({
        error: 'User already exists',
      });
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
 *       - "Users"
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

    // Creating JWT code
    const token = createToken(user);

    return res.status(200).json({
      token: token,
    });
  },
];

/**
 * @openapi
 * /users/delete-user:
 *   post:
 *     summary: Soft delete, marks user's deletedAt with current date.
 *     tags:
 *       - "Users"
 *     operationId: users_delete
 *     x-eov-operation-handler: user-handler
 * 
 *     parameters:
 *      - in: path
 *        name: user_id
 *        schema:
 *          type: integer
 *        required: true
 *        description: Numeric ID of the user to delete.
 
 *     responses:
 *       '201':
 *         description: "User created"
 *       '400':
 *         description: "Invalid data"
 */
module.exports.users_delete = [
  async function (req, res) {
    const { user_id } = req.params;
    const user = await User.findOne({
      where: {
        id: user_id,
      },
    });
    if (!user) {
      return res.status(404).send({
        error: 'User not found.',
      });
    } else {
      await User.update(
        {
          deleted_at: new Date(),
        },
        { where: { id: user_id } }
      );
      return res.status(200).json({ message: 'User deleted.' });
    }
  },
];

/**
 * @openapi
 * /users/request-password-recover:
 *   post:
 *     summary: Request a user password recover.
 *     tags:
 *       - "Users"
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
 *     security:
 *        - JWT: []
 *        - {}
 */
module.exports.users_request_password_recover = [
  passport.authenticate(['jwt'], { session: false }),
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
          createdAt: moment(),
        },
        {
          where: {
            user_id: user.id,
          },
        }
      );
    } else {
      await Token.create({
        user_id: user.id,
        token: resetToken,
        expiration: 60 * 60,
      });
    }

    // Send a link to the user to recover his password
    const link = `${frontURL}/passwordReset?token=${resetToken}&user_id=${user.id}`;

    await sendMail(
      '"Equipe SafeStats 🏥" <help.safestats@gmail.com>',
      user.email,
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
 * /users/update-password:
 *   post:
 *     summary: Updates user password.
 *     tags:
 *       - "Users"
 *     operationId: users_update_password
 *     x-eov-operation-handler: user-handler
 *
 *     requestBody:
 *       description: "Updates user password."
 *       content:
 *         "application/json":
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - userId
 *               - newPassword
 *               - newPasswordConfirmation
 *
 *             properties:
 *               token:
 *                 type: string
 *                 example: "93637cc7-8aa2-4ff4-bd56-cc05762eb55b"
 *               userId:
 *                 type: string
 *                 example: "93637cc7-8aa2-4ff4-bd56-cc05762eb55b"
 *               newPassword:
 *                 type: string
 *                 example: "Josezinho@123"
 *               newPasswordConfirmation:
 *                 type: string
 *                 example: "Josezinho@123"
 *     responses:
 *       '200':
 *         description: "Password updated"
 *       '400':
 *         description: "Invalid token"
 *       '404':
 *         description: "User not found"
 */
module.exports.users_update_password = [
  async function (req, res) {
    const {
      token: userToken,
      userId,
      newPassword,
      newPasswordConfirmation,
    } = req.body;

    if (!(userToken || userId)) {
      return res.status(400).send({
        error: 'Invalid token',
      });
    }

    if (newPassword != newPasswordConfirmation) {
      return res
        .status(400)
        .send({ error: 'Password and confirmation must be equal' });
    }

    const token = await Token.findOne({
      where: {
        user_id: userId,
        token: userToken,
      },
    });

    if (!token) {
      return res.status(404).send({ error: 'Token not found' });
    }

    const currentDateTime = moment();
    const tokenExpirationDateTime = moment(token.createdAt).add(
      token.expiration,
      'seconds'
    );

    if (tokenExpirationDateTime < currentDateTime) {
      return res.status(400).send({
        error: 'Expired token',
      });
    }

    const salt = await bcrypt.genSalt(encryptSalt);
    const newUserPassword = await bcrypt.hash(newPassword, salt);

    await User.update(
      {
        password: newUserPassword,
      },
      {
        where: {
          id: userId,
        },
      }
    );

    const user = await User.findOne({
      where: {
        id: userId,
      },
    });

    sendMail(
      '"Equipe SafeStats 🏥" <help.safestats@gmail.com>',
      user.email,
      'Sua senha foi alterada 🔐',
      '',
      `
      <b>Olá ${user.name}, sua senha foi alterada!</b><br/>
      <b>Caso não reconheça essa alteração, entre em contato conosco!</b>
      `
    );

    await Token.destroy({
      where: {
        user_id: token.user_id,
      },
    });

    return res.status(200).send({
      message: 'Password updated',
    });
  },
];
