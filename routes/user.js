const express = require("express");
const passport = require("../middleware/authGoogle");
const {
  registerUser,
  loginUser,
  updateUserDetails,
  getUserProfile,
  googleAuthCallback,
  checkAuthStatus,
  logoutUser,
  verifyEmail,
  resendVerificationEmail,
} = require("../controllers/userController");

module.exports = (pool) => {
  const router = express.Router();

  // **Email & Password Authentication**
  router.post("/register", (req, res) => registerUser(req, res, pool));
  router.post("/login", (req, res) => loginUser(req, res, pool));
  router.patch("/update", (req, res) => updateUserDetails(req, res, pool));
  router.get("/profile", (req, res) => getUserProfile(req, res, pool));
  router.get("/verify-email", (req, res) => verifyEmail(req, res, pool));
  router.post("/resend-verification", (req, res) =>
    resendVerificationEmail(req, res, pool)
  );

  // **Google Authentication**
  router.get(
    "/auth/google",
    passport.authenticate("google", {
      scope: ["profile", "email"],
      prompt: "select_account",
      state: true,
    })
  );

  router.get("/auth/google/callback", (req, res) =>
    googleAuthCallback(req, res, pool)
  );

  // **Authentication Status & Logout**
  router.get("/auth/status", checkAuthStatus);
  router.get("/logout", logoutUser);

  return router;
};
