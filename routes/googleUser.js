require("dotenv").config();
const express = require("express");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const path = require("path");

const {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_CALLBACK_URL,
  JWT_SECRET,
} = process.env;

const app = express();

// Middleware
app.use(cookieParser());
app.use(express.static("public"));
app.use(passport.initialize());

// Passport Strategy for Google Login
passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: GOOGLE_CALLBACK_URL,
    },
    (accessToken, refreshToken, profile, done) => {
      return done(null, profile);
    }
  )
);

// Google Authentication Route (No Sessions)
app.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    prompt: "select_account",
  })
);

// Google Callback Route (No Sessions)
app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/", session: false }),
  (req, res) => {
    if (!req.user) return res.redirect("/");

    // Generate JWT Token
    const token = jwt.sign(
      {
        id: req.user.id,
        name: req.user.displayName,
        email: req.user.emails[0].value,
      },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    // Set JWT as a cookie
    res.cookie("token", token, {
      httpOnly: true, // Secure and not accessible via JS
      secure: process.env.NODE_ENV === "production",
      path: "/",
      sameSite: "Lax",
    });

    return res.redirect("/");
  }
);

// Logout Route (Clear Cookie)
app.get("/logout", (req, res) => {
  res.clearCookie("token", { path: "/" });
  res.redirect("/");
});

// 🔹 NEW: Check Authentication Status Route
app.get("/auth/status", (req, res) => {
  const token = req.cookies.token;
  if (!token) {
    return res.json({ loggedIn: false });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({ loggedIn: true, user: decoded });
  } catch (err) {
    res.clearCookie("token");
    res.json({ loggedIn: false });
  }
});

// Serve Merged index.html File
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Start Server
app.listen(3000, () => {
  console.log("Server running on port 3000");
});
