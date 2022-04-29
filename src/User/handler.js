const User = require('./model');

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
 *                 example: "José Pereira da Silva Antônio de Siqueira Borges Junior Filho"
 *
 *     responses:
 *       '201':
 *         description: "User created"
 *       '400':
 *         description: "Invalid data"
 */
module.exports.users_insert = [
  (req, res) => {
    const user = new User(req.body);
    
  },
];