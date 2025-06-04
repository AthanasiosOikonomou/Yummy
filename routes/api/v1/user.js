const express = require("express");
const passportGoogle = require("../../../middleware/authGoogle");
const passportFacebook = require("../../../middleware/authFacebook");

const {
  registerUser,
  loginUser,
  updateUserDetails,
  getUserProfile,
  googleAuthCallback,
  facebookAuthCallback,
  checkAuthStatus,
  logoutUser,
  verifyEmail,
  resendVerificationEmail,
  getUserPoints,
  getFavorites,
  toggleFavoriteController,
  requestResetPassword,
  resetPassword,
  checkResetPasswordToken,
} = require("../../../controllers/userController");

module.exports = (pool) => {
  const router = express.Router();

  // **Email & Password Authentication**
  router.post("/register", (req, res) => registerUser(req, res, pool));
  router.post("/password/reset/request", (req, res) =>
    requestResetPassword(req, res, pool)
  );
  router.post("/password/reset", (req, res) => resetPassword(req, res, pool));
  router.post("/password/reset/validate/token", (req, res) =>
    checkResetPasswordToken(req, res, pool)
  );

  router.post("/login", (req, res) => loginUser(req, res, pool));
  router.patch("/update", (req, res) => updateUserDetails(req, res, pool));
  router.get("/profile", (req, res) => getUserProfile(req, res, pool));
  router.get("/verify-email", (req, res) => verifyEmail(req, res, pool));
  router.get("/points", (req, res) => getUserPoints(req, res, pool));
  router.get("/favorites", (req, res) => getFavorites(req, res, pool));
  router.post("/favorites/toggle", (req, res) =>
    toggleFavoriteController(req, res, pool)
  );

  router.post("/resend-verification", (req, res) =>
    resendVerificationEmail(req, res, pool)
  );

  // **Google Authentication**
  router.get(
    "/auth/google",
    passportGoogle.authenticate("google", {
      scope: ["profile", "email"],
      prompt: "select_account",
      state: true,
    })
  );

  router.get("/auth/google/callback", (req, res) =>
    googleAuthCallback(req, res, pool)
  );

  // **Facebook Authentication**
  router.get(
    "/auth/facebook",
    passportFacebook.authenticate("facebook", { scope: ["email"] })
  );

  router.get("/auth/facebook/callback", (req, res) =>
    facebookAuthCallback(req, res, pool)
  );

  // **Authentication Status & Logout**
  router.get("/auth/status", checkAuthStatus);
  router.get("/logout", logoutUser);

  return router;
};
