const express = require("express");
const passportGoogle = require("../middleware/authGoogle");
const passportFacebook = require("../middleware/authFacebook");

const {
  registerOwner,
  checkAuthStatus,
  logoutOwner,
  requestResetPasswordOwner,
  resetPasswordOwner,
  checkResetPasswordTokenOwner,
  loginOwner,
  updateOwnerDetails,
} = require("../controllers/ownerController");

module.exports = (pool) => {
  const router = express.Router();

  // **Email & Password Authentication**
  router.post("/register", (req, res) => registerOwner(req, res, pool));
  router.post("/password/reset/request", (req, res) =>
    requestResetPasswordOwner(req, res, pool)
  );
  router.post("/password/reset", (req, res) =>
    resetPasswordOwner(req, res, pool)
  );
  router.post("/password/reset/validate/token", (req, res) =>
    checkResetPasswordTokenOwner(req, res, pool)
  );

  router.post("/login", (req, res) => loginOwner(req, res, pool));
  router.patch("/update", (req, res) => updateOwnerDetails(req, res, pool));
  //   router.get("/profile", (req, res) => getOwnerProfile(req, res, pool));
  //   router.get("/verify-email", (req, res) => verifyOwnerEmail(req, res, pool));
  //   router.post("/resend-verification", (req, res) =>
  //     resendVerificationEmailToOwner(req, res, pool)
  //   );

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
  router.get("/logout", logoutOwner);

  return router;
};
