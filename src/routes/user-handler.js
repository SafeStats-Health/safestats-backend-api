require('dotenv').config({ path: '.env' });

const crypto = require('crypto');
const EmailValidator = require('email-validator');
const bcrypt = require('bcrypt');
const jwt = require('jwt-simple');
const moment = require('moment');
const passport = require('passport');

const User = require('../models/user');
const Token = require('../models/token');
const BloodDonation = require('../models/bloodDonation');
const Address = require('../models/address');
const TrustedContact = require('../models/trustedContact');
const HealthPlan = require('../models/healthPlan');
const { createToken } = require('../services/jwt/jwt');
const sendMail = require('../services/email/email');

const encryptSalt = parseInt(process.env.ENCRYPT_SALT);
const { FRONT_URL: frontURL, CRYPTO_KEY: secret } = process.env;

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
 *     summary: Soft delete, fill user's deletedAt with current date.
 *     tags:
 *       - "Users"
 *     operationId: users_delete
 *     x-eov-operation-handler: user-handler
 *
 *     requestBody:
 *       description: "User credentials."
 *       content:
 *         "application/json":
 *           schema:
 *             type: object
 *             required:
 *               - password
 *               - passwordConfirmation
 *
 *             properties:
 *               password:
 *                 type: string
 *                 example: "123456"
 *               passwordConfirmation:
 *                 type: string
 *                 example: "123456"
 *
 *     responses:
 *       '200':
 *         description: "User deleted"
 *       '400':
 *         description: "Invalid credentials"
 *     security:
 *        - JWT: []
 *        - {}
 */
module.exports.users_delete = [
  passport.authenticate(['jwt'], { session: false }),
  async function (req, res) {
    const { password, passwordConfirmation } = req.body;
    const { authorization } = req.headers;

    const decodedToken = jwt.decode(authorization.split(' ')[1], secret);
    const userId = decodedToken['user'].id;

    // Validating password and confirmation password
    if (password != passwordConfirmation) {
      return res.status(400).send({
        error: 'Password and confirmation must be equal',
      });
    }

    // Checking if user exists
    const user = await User.findOne({
      where: {
        id: userId,
      },
    });

    if (!user) {
      return res.status(404).send({
        error: 'User not found.',
      });
    } else {
      user.deletedAt = moment();
      await user.save();

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
        userId: user.id,
      },
    });

    let resetToken = crypto.randomBytes(32).toString('hex');

    if (token) {
      token.token = resetToken;
      token.createdAt = moment().format('YYYY-MM-DD HH:mm:ss');
      await token.save();
    } else {
      await Token.create({
        userId: user.id,
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
 * /users/update-password-token:
 *   post:
 *     summary: Updates user password.
 *     tags:
 *       - "Users"
 *     operationId: users_update_password_token
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
module.exports.users_update_password_token = [
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
        userId: userId,
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
        userId: token.user_id,
      },
    });

    return res.status(200).send({
      message: 'Password updated',
    });
  },
];

/**
 * @openapi
 * /users/update-password-authenticated:
 *   post:
 *     summary: Updates user password when authenticated.
 *     tags:
 *       - "Users"
 *     operationId: users_update_password_authenticated
 *     x-eov-operation-handler: user-handler
 *
 *     requestBody:
 *       description: "Update user password when authenticated."
 *       content:
 *         "application/json":
 *           schema:
 *             type: object
 *             required:
 *               - newPassword
 *               - newPasswordConfirmation
 *
 *             properties:
 *               newPassword:
 *                 type: string
 *                 example: "Josezinho@123"
 *               newPasswordConfirmation:
 *                 type: string
 *                 example: "Josezinho@123"
 *
 *     responses:
 *       '200':
 *         description: "Password updated"
 *       '401':
 *         description: "Unauthorized"
 *       '400':
 *         description: "Invalid passwords"
 *       '404':
 *         description: "User not found"
 *     security:
 *        - JWT: []
 *        - {}
 */
module.exports.users_update_password_authenticated = [
  passport.authenticate(['jwt'], { session: false }),
  async function (req, res) {
    const { authorization } = req.headers;
    const decodedToken = jwt.decode(authorization.split(' ')[1], secret);
    const userId = decodedToken['user'].id;

    const user = await User.findOne({
      where: {
        id: userId,
      },
    });

    if (!user) {
      return res.status(404).send({ error: 'User not found' });
    }

    const { newPassword, newPasswordConfirmation } = req.body;

    if (newPassword != newPasswordConfirmation) {
      return res
        .status(400)
        .send({ error: 'Password and confirmation must be equal' });
    }

    const salt = await bcrypt.genSalt(encryptSalt);
    const newUserPassword = await bcrypt.hash(newPassword, salt);

    user.password = newUserPassword;
    await user.save();

    return res.status(200).send({
      message: 'Password updated',
    });
  },
];

/**
 * @openapi
 * /users/update-blood-donation:
 *   post:
 *     summary: Updates user's blood information.
 *     tags:
 *       - "Users"
 *     operationId: users_update_blood_donation
 *     x-eov-operation-handler: user-handler
 *
 *     requestBody:
 *       description: "Updates user's blood information."
 *       content:
 *         "application/json":
 *           schema:
 *             type: object
 *             required:
 *               - didDonate
 *               - bloodType
 *               - donationLocation
 *
 *             properties:
 *               didDonate:
 *                 type: boolean
 *                 example: true
 *               bloodType:
 *                 type: string
 *                 example: "A+"
 *               donationLocation:
 *                 type: string
 *                 example: "Hemobanco"
 *
 *     responses:
 *       '200':
 *         description: "Blood donation info updated"
 *       '401':
 *         description: "Unauthorized"
 *       '400':
 *         description: "Invalid data"
 *       '404':
 *         description: "User not found"
 *     security:
 *        - JWT: []
 *        - {}
 */
module.exports.users_update_blood_donation = [
  passport.authenticate(['jwt'], { session: false }),
  async function (req, res) {
    const { authorization } = req.headers;
    const decodedToken = jwt.decode(authorization.split(' ')[1], secret);
    const userId = decodedToken['user'].id;

    const bloodDonation = await BloodDonation.create({
      ...req.body,
    });

    const user = await User.findOne({
      where: {
        id: userId,
      },
    });

    if (!user) {
      return res.status(404).send({ error: 'User not found' });
    }

    user.bloodDonationId = bloodDonation.id;
    await user.save();

    res.status(200).send({
      message: 'Blood donation info updated',
    });
  },
];

/**
 * @openapi
 * /users/update-user-info:
 *   post:
 *     summary: Updates user's information.
 *     tags:
 *       - "Users"
 *     operationId: users_update_user_info
 *     x-eov-operation-handler: user-handler
 *
 *     requestBody:
 *       description: "Updates user's information."
 *       content:
 *         "application/json":
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - phone
 *               - address
 *               - birthdate
 *
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Joselito"
 *               phone:
 *                 type: string
 *                 example: "(11) 99999-9999"
 *               address:
 *                 type: string
 *                 example: "Rua dos Bobos, 0 - Bairro dos Bobos - SP"
 *               birthdate:
 *                 type: string
 *                 example: "1990-01-01"
 *
 *     responses:
 *       '200':
 *         description: "User info updated"
 *       '401':
 *         description: "Unauthorized"
 *       '400':
 *         description: "Invalid data"
 *       '404':
 *         description: "User not found"
 *     security:
 *        - JWT: []
 *        - {}
 */
module.exports.users_update_user_info = [
  passport.authenticate(['jwt'], { session: false }),
  async function (req, res) {
    const { authorization } = req.headers;
    const decodedToken = jwt.decode(authorization.split(' ')[1], secret);
    const userId = decodedToken['user'].id;

    const user = await User.findOne({
      where: {
        id: userId,
      },
    });

    if (!user) {
      return res.status(404).send({ error: 'User not found' });
    }

    user.name = req.body.name;
    user.phone = req.body.phone;
    user.address = req.body.address;
    user.birthdate = req.body.birthdate;
    await user.save();

    res.status(200).send({
      message: 'User info updated',
    });
  },
];

/**
 * @openapi
 * /users/update-trusted-contact:
 *   post:
 *     summary: Updates user's trusted contact information.
 *     tags:
 *       - "Users"
 *     operationId: users_update_trusted_contact
 *     x-eov-operation-handler: user-handler
 *
 *     requestBody:
 *       description: "Updates user's trusted contact information."
 *       content:
 *         "application/json":
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - phone
 *               - birthdate
 *               - address
 *
 *             properties:
 *               name:
 *                 type: string
 *                 example: "John Doe"
 *               email:
 *                 type: string
 *                 example: "john@email.com"
 *               phone:
 *                 type: string
 *                 example: "(41) 99999-9999"
 *               birthdate:
 *                 type: string
 *                 example: "1990-01-01"
 *               address:
 *                 type: string
 *                 example: "Rua dos bobos, 41 - Curitiba / PR"
 *
 *     responses:
 *       '200':
 *         description: "Trusted contact info updated"
 *       '401':
 *         description: "Unauthorized"
 *       '400':
 *         description: "Invalid data"
 *       '404':
 *         description: "User not found"
 *     security:
 *        - JWT: []
 *        - {}
 */
module.exports.users_update_trusted_contact = [
  passport.authenticate(['jwt'], { session: false }),
  async function (req, res) {
    const { authorization } = req.headers;
    const decodedToken = jwt.decode(authorization.split(' ')[1], secret);
    const userId = decodedToken['user'].id;

    const trustedContact = await TrustedContact.create({
      ...req.body,
    });

    const user = await User.findOne({
      where: {
        id: userId,
      },
    });

    if (!user) {
      return res.status(404).send({ error: 'User not found' });
    }

    user.trustedContactId = trustedContact.id;
    await user.save();

    res.status(200).send({
      message: 'Trusted contact info updated',
    });
  },
];

/**
 * @openapi
 * /users/update-health-plan:
 *   post:
 *     summary: Updates user's health plan information.
 *     tags:
 *       - "Users"
 *     operationId: users_update_health_plan
 *     x-eov-operation-handler: user-handler
 *
 *     requestBody:
 *       description: "Updates user's health plan information."
 *       content:
 *         "application/json":
 *           schema:
 *             type: object
 *             required:
 *               - institution
 *               - type
 *               - accomodation
 *
 *             properties:
 *               name:
 *                 type: institution
 *                 example: "Unimed"
 *               type:
 *                 type: string
 *                 example: "Ouro"
 *               accomodation:
 *                 type: string
 *                 example: "Enfermaria"
 *
 *     responses:
 *       '200':
 *         description: "Health plan info updated"
 *       '401':
 *         description: "Unauthorized"
 *       '400':
 *         description: "Invalid data"
 *       '404':
 *         description: "User not found"
 *     security:
 *        - JWT: []
 *        - {}
 */
module.exports.users_update_health_plan = [
  passport.authenticate(['jwt'], { session: false }),
  async function (req, res) {
    const { authorization } = req.headers;
    const decodedToken = jwt.decode(authorization.split(' ')[1], secret);
    const userId = decodedToken['user'].id;

    const healthPlan = await HealthPlan.create({
      ...req.body,
    });

    const user = await User.findOne({
      where: {
        id: userId,
      },
    });

    if (!user) {
      return res.status(404).send({ error: 'User not found' });
    }

    user.healthPlanId = healthPlan.id;
    await user.save();

    res.status(200).send({
      message: 'Health plan info updated',
    });
  },
];
