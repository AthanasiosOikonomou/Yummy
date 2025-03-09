require("dotenv").config();

const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const pool = require("../config/db.config");
const { getUserByEmail, insertUser } = require("../queries/userQueries");
const nodemailer = require("nodemailer");
const { contentSecurityPolicy } = require("helmet");
const jwt = require("jsonwebtoken");

//TODO: REPEATING imports and code. same code sendmail as userController

const {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_CALLBACK_URL,
  FRONT_END_URL,
  envPORT,
  EMAIL_USER,
  EMAIL_PASS,
  JWT_SECRET,
} = process.env;

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

// Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;
        const name = profile.displayName;
        const googleId = profile.id;

        // Check if user exists
        const existingUser = await pool.query(getUserByEmail, [email]);

        if (existingUser.rows.length === 0) {
          // Insert new Google user (without password)
          const newGoogleUser = await pool.query(insertUser, [
            name,
            email,
            null,
            null,
            googleId,
          ]);
          await sendVerificationEmail(newGoogleUser.rows[0]);
        }

        return done(null, { googleId, name, email });
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

module.exports = passport;
