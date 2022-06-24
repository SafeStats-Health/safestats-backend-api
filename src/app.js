require('express-async-errors');
const express = require('express');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');
const startDatabase = require('./configs/database/startDatabase');

//OpenAPI configuration
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const OpenApiValidator = require('express-openapi-validator');

// JSON Web Token configuration
const passport = require('passport');
const jwt = require('./services/jwt/jwt');

// Express configuration
const app = express();

app.use(passport.initialize());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(cors());

passport.use('jwt', jwt.strategy.jwt);
passport.use('none', jwt.strategy.none);

const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.3',
    info: {
      title: 'SafeStats Server',
      version: '1.0.0',
      description: 'SafeStats Server Documentation',
    },
    servers: [
      {
        url: process.env.BACKEND_URL,
        description: 'SafeStats Server',
      },
    ],
  },
  apis: [
    __dirname + '/routes/**/*.yaml',
    __dirname + '/**/*.js',
    __dirname + '/**/*.ts',
  ],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
delete swaggerDocs.channels;

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));
app.use(
  OpenApiValidator.middleware({
    apiSpec: swaggerDocs,
    validateRequests: true,
    unknownFormats: [],
    operationHandlers: __dirname + '/routes',
  })
);

// Starts the database
(async () => {
  await startDatabase();
})();

module.exports = app;
