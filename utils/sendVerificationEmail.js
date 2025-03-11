const nodemailer = require("nodemailer");
const { contentSecurityPolicy } = require("helmet");
const jwt = require("jsonwebtoken");

const { FRONT_END_URL, envPORT, EMAIL_USER, EMAIL_PASS, JWT_SECRET } =
  process.env;

// Configure Email Transporter
const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

// Send verification email function
const sendVerificationEmail = async (user) => {
  const token = jwt.sign({ id: user.id }, JWT_SECRET, {
    expiresIn: "1d",
  });

  const verificationUrl = `${FRONT_END_URL}:${envPORT}/verify.html?token=${token}&email=${encodeURIComponent(
    user.email
  )}`;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: user.email,
    subject: "Verify Your Email",
    html: `<a href="${verificationUrl}"><p>Click the link to verify</p></a>`,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = sendVerificationEmail;
