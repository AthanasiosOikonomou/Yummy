require("dotenv").config();

const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const pool = require("../config/db.config");
const { getUserByEmail, insertUser } = require("../queries/userQueries");
const sendVerificationEmail = require("../utils/sendVerificationEmail");

const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL } =
  process.env;

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
            "customer",
            googleId,
            null,
            false,
            null,
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
