require('dotenv').config({ path: '.env' });

const BloodDonation = require('../../models/bloodDonation');
const TrustedContact = require('../../models/trustedContact');
const HealthPlan = require('../../models/healthPlan');

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

module.exports.createToken = async function (user) {
  const exp = moment().add(tokenDuration, 'seconds').unix();

  const bloodDonation = await BloodDonation.findOne({
    where: {
      id: user.bloodDonationId,
    },
  });

  const trustedContact = await TrustedContact.findOne({
    where: {
      id: user.trustedContactId,
    },
  });

  const healthPlan = await HealthPlan.findOne({
    where: {
      id: user.healthPlanId,
    },
  });

  const payload = {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      birthdate: user.birthdate,
      age: user.birthdate ? moment().diff(user.birthdate, 'years') : null,
      preferredLanguage: user.preferredLanguage,
      bloodType: bloodDonation ? bloodDonation.bloodType : null,
      didDonateBlood: bloodDonation ? bloodDonation.didDonate : null,
      legalRepresentative: trustedContact ? trustedContact.name : null,
      healthPlan: healthPlan ? healthPlan.institution : null,
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
