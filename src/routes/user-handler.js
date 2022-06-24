require('dotenv').config({ path: '.env' });

const crypto = require('crypto');
const bcrypt = require('bcrypt');
const jwt = require('jwt-simple');
const moment = require('moment');
const passport = require('passport');

const User = require('../models/user');
const Token = require('../models/token');
const BloodDonation = require('../models/bloodDonation');
const TrustedContact = require('../models/trustedContact');
const HealthPlan = require('../models/healthPlan');
const sendMail = require('../services/email/email');

const encryptSalt = parseInt(process.env.ENCRYPT_SALT);
const { FRONTEND_URL: frontendUrl, CRYPTO_KEY: secret } = process.env;

/**
 * @openapi
 * /users/delete-user:
 *   post:
 *     summary: Soft delete, fill user's deletedAt with current date.
 *     tags:
 *       - "User"
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
 *       - "User"
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
    const link = `${frontendUrl}/reset_password?token=${resetToken}`;

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
 *       - "User"
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
 *               - newPassword
 *               - newPasswordConfirmation
 *
 *             properties:
 *               token:
 *                 type: string
 *                 example: "93637cc78aa24ff4bd56cc05762eb55b"
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
 *         description: "Password and confirmation must be equal"
 *       '404':
 *         description: "Token not found"
 */
module.exports.users_update_password_token = [
  async function (req, res) {
    const { token: userToken, newPassword, newPasswordConfirmation } = req.body;

    const token = await Token.findOne({
      where: {
        token: userToken,
      },
    });

    if (!token) {
      return res.status(404).send({ error: 'Token not found' });
    }

    if (newPassword != newPasswordConfirmation) {
      return res
        .status(400)
        .send({ error: 'Password and confirmation must be equal' });
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

    const user = await User.findOne({
      where: {
        id: token.userId,
      },
    });

    user.password = newUserPassword;
    await user.save();

    await Token.destroy({
      where: {
        userId: user.id,
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
 *       - "User"
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
 *               - oldPassword
 *               - newPassword
 *               - newPasswordConfirmation
 *
 *             properties:
 *               oldPassword:
 *                 type: string
 *                 example: "Josezinho@321"
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

    const isPasswordCorrect = await bcrypt.compare(
      req.body.oldPassword,
      user.password
    );

    if (!isPasswordCorrect) {
      return res.status(400).send({ error: 'Invalid password' });
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
 * /users/update-personal-data:
 *   post:
 *     summary: Updates user's personal-data.
 *     tags:
 *       - "User"
 *     operationId: users_update_personal_data
 *     x-eov-operation-handler: user-handler
 *
 *     requestBody:
 *       description: "Updates user's personal-data."
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
 *         description: "User updated"
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
module.exports.users_update_personal_data = [
  passport.authenticate(['jwt'], { session: false }),
  async function (req, res) {
    const { authorization } = req.headers;
    const decodedToken = jwt.decode(authorization.split(' ')[1], secret);
    const userId = decodedToken['user'].id;

    // Validate if birthdate is on format YYYY-MM-DD
    const { birthdate } = req.body;

    if (!moment(birthdate, 'YYYY-MM-DD', true).isValid()) {
      return res.status(400).send({ error: 'Invalid birthdate' });
    }

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
      message: 'User updated',
    });
  },
];

/**
 * @openapi
 * /users/user-personal-data:
 *   get:
 *     summary: Retrieves user's personal-data.
 *     tags:
 *       - "User"
 *     operationId: users_personal_data
 *     x-eov-operation-handler: user-handler
 *
 *     responses:
 *       '200':
 *         description: "User retrieved"
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
module.exports.users_personal_data = [
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

    res.status(200).send({
      user: {
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        birthdate: user.birthdate,
      },
    });
  },
];

/**
 * @openapi
 * /users/update-blood-donation:
 *   post:
 *     summary: Updates user's blood information.
 *     tags:
 *       - "User"
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
 * /users/user-blood-donation:
 *   get:
 *     summary: Retrieves user's blood-donation.
 *     tags:
 *       - "User"
 *     operationId: users_blood_donation
 *     x-eov-operation-handler: user-handler
 *
 *     responses:
 *       '200':
 *         description: "User retrieved"
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
module.exports.users_blood_donation = [
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

    const bloodDonation = await BloodDonation.findOne({
      where: {
        id: user.bloodDonationId,
      },
    });

    if (!bloodDonation) {
      return res.status(404).send({ error: 'Blood donation not found' });
    }

    res.status(200).send({
      bloodDonation: {
        bloodType: bloodDonation.bloodType,
        donationLocation: bloodDonation.donationLocation,
        didDonate: bloodDonation.didDonate,
      },
    });
  },
];

/**
 * @openapi
 * /users/update-trusted-contact:
 *   post:
 *     summary: Updates user's trusted contact information.
 *     tags:
 *       - "User"
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
 * /users/user-trusted-contact:
 *   get:
 *     summary: Retrieves user's trusted-contact.
 *     tags:
 *       - "User"
 *     operationId: users_trusted_contact
 *     x-eov-operation-handler: user-handler
 *
 *     responses:
 *       '200':
 *         description: "User retrieved"
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
module.exports.users_trusted_contact = [
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

    const trustedContact = await TrustedContact.findOne({
      where: {
        id: user.trustedContactId,
      },
    });

    if (!trustedContact) {
      return res.status(404).send({ error: 'Trusted contact not found' });
    }

    res.status(200).send({
      trustedContact: {
        name: trustedContact.name,
        email: trustedContact.email,
        phone: trustedContact.phone,
        address: trustedContact.address,
        birthdate: trustedContact.birthdate,
      },
    });
  },
];

/**
 * @openapi
 * /users/update-health-plan:
 *   post:
 *     summary: Updates user's health plan information.
 *     tags:
 *       - "User"
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
 *               institution:
 *                 type: string
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

/**
 * @openapi
 * /users/user-health-plan:
 *   get:
 *     summary: Retrieves user's health-plan.
 *     tags:
 *       - "User"
 *     operationId: users_health_plan
 *     x-eov-operation-handler: user-handler
 *
 *     responses:
 *       '200':
 *         description: "User retrieved"
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
module.exports.users_health_plan = [
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

    const healthPlan = await HealthPlan.findOne({
      where: {
        id: user.healthPlanId,
      },
    });

    if (!healthPlan) {
      return res.status(404).send({ error: 'Health plan not found' });
    }

    res.status(200).send({
      healthPlan: {
        institution: healthPlan.institution,
        type: healthPlan.type,
        accomodation: healthPlan.accomodation,
      },
    });
  },
];

/**
 * @openapi
 * /users/update-preferrable-language:
 *   post:
 *     summary: Updates user's preferable language.
 *     tags:
 *       - "User"
 *     operationId: users_update_preferrable_language
 *     x-eov-operation-handler: user-handler
 *
 *     requestBody:
 *       description: "Updates user's preferable language."
 *       content:
 *         "application/json":
 *           schema:
 *             type: object
 *             required:
 *               - language
 *
 *             properties:
 *               language:
 *                 type: string
 *                 enum: ["PT-BR", "EN-US"]
 *                 example: "PT-BR"
 *
 *     responses:
 *       '200':
 *         description: "Preferrable language updated"
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
module.exports.users_update_preferrable_language = [
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

    user.preferredLanguage = req.body.language;
    await user.save();

    res.status(200).send({
      message: 'Preferrable language updated',
    });
  },
];
