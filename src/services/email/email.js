require('dotenv').config({ path: '.env' });

const nodemailer = require('nodemailer');

const emailUser = process.env.EMAIL_USER;
const emailPassword = process.env.EMAIL_PASSWORD;

let transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: emailUser,
    pass: emailPassword,
  },
});

async function sendMail(from, to, subject, text, html) {
  await transporter
    .sendMail({
      from: from,
      to: to,
      subject: subject,
      text: text,
      html: html,
    })
    .catch((error) => {
      console.log(error);
    });
}

module.exports = sendMail;
