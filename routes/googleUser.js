require("dotenv").config();
const express = require("express");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcryptjs");
const path = require("path");
const { Pool } = require("pg");

// Import Validation, Queries, and Controllers
const { userSchema, loginSchema } = require("../validators/userValidator");
const { getUserByEmail, insertUser } = require("../queries/userQueries");

const {
  registerUser,
  loginUser,
  getUserProfile,
} = require("../controllers/userController");

const {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_CALLBACK_URL,
  JWT_SECRET,
} = process.env;

const app = express();

// Database Connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(express.static("public"));
app.use(passport.initialize());

// **Google OAuth Strategy**
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

        // Check if user exists
        const existingUser = await pool.query(getUserByEmail, [email]);

        if (existingUser.rows.length === 0) {
          // Insert user into database (without password)
          await pool.query(insertUser, [name, email, null, null]);
        }

        return done(null, { id: profile.id, name, email });
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

// **Google Authentication Routes**
app.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    prompt: "select_account",
  })
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/", session: false }),
  (req, res) => {
    if (!req.user) return res.redirect("/");

    // Generate JWT Token
    const token = jwt.sign(
      {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
      },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    // Store token in HTTP-only cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      sameSite: "Lax",
    });

    return res.redirect("/");
  }
);

// **Email & Password Authentication**
app.post("/register", async (req, res) => {
  await registerUser(req, res, null, pool);
});

app.post("/login", async (req, res) => {
  await loginUser(req, res, pool);
});

// **Check Authentication Status**
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

// **Get User Profile**
app.get("/profile", async (req, res) => {
  await getUserProfile(req, res, pool);
});

// **Logout**
app.get("/logout", (req, res) => {
  res.clearCookie("token", { path: "/" });
  res.redirect("/");
});

// **Serve Frontend**
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// **Start Server**
app.listen(3000, () => {
  console.log("Server running on port 3000");
});
