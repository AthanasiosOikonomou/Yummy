require("dotenv").config();

const passport = require("passport");
const FacebookStrategy = require("passport-facebook").Strategy;
const pool = require("../config/db.config");
const { getUserByEmail, insertUser } = require("../queries/userQueries");
const sendVerificationEmail = require("../utils/sendVerificationEmail");

//TODO:

const { FACEBOOK_CLIENT_ID, FACEBOOK_CLIENT_SECRET, FACEBOOK_CALLBACK_URL } =
  process.env;

// Facebook OAuth Strategy
passport.use(
  new FacebookStrategy(
    {
      clientID: FACEBOOK_CLIENT_ID,
      clientSecret: FACEBOOK_CLIENT_SECRET,
      callbackURL: FACEBOOK_CALLBACK_URL,
      profileFields: ["id", "displayName", "emails"],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails ? profile.emails[0].value : null;
        const name = profile.displayName;
        const facebookId = profile.id;

        if (!email) {
          return done(null, false, {
            message: "No email provided by Facebook",
          });
        }

        // Check if user exists
        const existingUser = await pool.query(getUserByEmail, [email]);

        if (existingUser.rows.length === 0) {
          // Insert new Facebook user (without password)
          const newFacebookUser = await pool.query(insertUser, [
            name,
            email,
            null,
            null,
            null,
            facebookId,
          ]);
          await sendVerificationEmail(newFacebookUser.rows[0]);
        }

        return done(null, { facebookId, name, email });
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

module.exports = passport;
