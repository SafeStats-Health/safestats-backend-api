const express = require('express');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');
const startDatabase = require('./configs/database/startDatabase');

//OpenAPI configuration
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const OpenApiValidator = require('express-openapi-validator');

const passport = require('passport');
//const jwt = require('');

const app = express();

app.use(passport.initialize());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(cors());

// passport.use('jwt', jwt.strategy.jwt);
// passport.use('none', jwt.stratey.none);

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
        url: 'http://localhost:8000/api',
        description: 'SafeStats Server',
      },
    ],
  },
  apis: [__dirname + '/routes/**/*.yaml', __dirname + '/**/*.js'],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
delete swaggerDocs.channels;

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));
app.use(
  OpenApiValidator.middleware({
    apiSpec: swaggerDocs,
    unknownFormats: [],
    operationHandlers: __dirname + '/routes',
  })
);

/**
 * Starts the database
 */
startDatabase();

module.exports = app;
