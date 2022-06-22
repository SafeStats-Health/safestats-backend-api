require('dotenv').config({ path: '.env' });

const jwt = require('jwt-simple');
const moment = require('moment');
const { ExtractJwt, Strategy } = require('passport-jwt');
const AnonymousStrategy = require('passport-anonymous');

const {
  CRYPTO_KEY: secret,
  ISSUER: issuer,
  TOKEN_DURATION_IN_SECONDS: tokenDuration,
} = process.env;

const params = {
  secretOrKey: secret,
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  ignoreExpiration: false,
  issuer: issuer,
};

module.exports.createToken = function (user) {
  const exp = moment().add(tokenDuration, 'seconds').unix();

  const payload = {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      birthdate: user.birthdate,
    },
    iss: issuer,
    iat: moment().unix(),
    exp: exp,
  };

  return jwt.encode(payload, secret);
};

module.exports.strategy = {};

module.exports.strategy.jwt = new Strategy(params, (payload, done) => {
  payload.user.id = parseInt(payload.user.id);
  return done(null, payload.user);
});

module.exports.strategy.none = new AnonymousStrategy();
