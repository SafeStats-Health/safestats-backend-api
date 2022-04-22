import 'dotenv/config';
import cors from 'cors';
import express from 'express';
const startDatabase = require('./configs/database/startDatabase');
const app = express();

// Starting database
startDatabase();

// Allowing external connections
app.use(cors());

// Disabling the X-Powered-By: Express
app.disable('x-powered-by');

// Base rout
app.get('/', (req, res) => {
  res.send('Hello World!');
});

// Application listening port
app.listen(process.env.PORT || 3000, () => {
  console.log(`Listening on port: ${process.env.PORT}`);
});
