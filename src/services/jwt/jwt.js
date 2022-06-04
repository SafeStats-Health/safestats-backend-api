require('dotenv').config({ path: '.env' });

const jwt = require('jwt-simple');
const moment = require('moment');
const { ExtractJwt, Strategy } = require('passport-jwt');
const AnonymousStrategy = require('passport-anonymous');

const SECRET = process.env.CRYPTO_KEY;
const ISSUER = process.env.ISSUER;
const TOKEN_DURATION = process.env.TOKEN_DURATION_IN_SECONDS;

const params = {
  secretOrKey: SECRET,
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  ignoreExpiration: false,
  issuer: ISSUER,
};

module.exports.createToken = function (user) {
  const exp = moment().add(TOKEN_DURATION, 'seconds');

  const payload = {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
    },
    iss: ISSUER,
    iat: moment(),
    exp: exp,
  };

  return jwt.encode(payload, SECRET);
};

module.exports.strategy = {};

module.exports.strategy.jwt = new Strategy(params, (payload, done) => {
  payload.user.id = parseInt(payload.user.id);
  return done(null, payload.user);
});

module.exports.strategy.none = new AnonymousStrategy();
