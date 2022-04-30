const bcrypt = require('bcrypt');
const User = require('../../User/model');

/**
 * @openapi
 * /users:
 *   post:
 *     summary: Inserts an user in the database.
 *     tags:
 *       - "users"
 *     operationId: users_insert
 *     x-eov-operation-handler: user-handler
 *
 *     requestBody:
 *       description: "User data to be included"
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
module.exports.users_insert = [
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

    try {
      await User.create(user);
    } catch (error) {
      return res.status(500).send({
        error: error,
      });
    }

    return res.status(201).json({ message: 'User created.' });
  },
];
