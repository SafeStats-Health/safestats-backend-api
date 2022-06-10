require('dotenv').config({ path: '.env' });

const nodemailer = require('nodemailer');

const { EMAIL_USER: emailUser, EMAIL_PASSWORD: emailPassword } = process.env;

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
