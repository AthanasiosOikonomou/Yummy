// routes/userRoutes.js
const express = require("express");
const cookieJWTAuth = require("../middleware/cookieJWTAuth");
const {
  registerUser,
  loginUser,
  updateUserDetails,
  getUserProfile,
} = require("../controllers/userController");

const userRoutes = (pool) => {
  const router = express.Router();
  router.post("/register", (req, res, next) =>
    registerUser(req, res, next, pool)
  );
  router.post("/login", (req, res) => loginUser(req, res, pool));
  router.patch("/update", cookieJWTAuth, (req, res, next) =>
    updateUserDetails(req, res, next, pool)
  );
  router.get("/profile", cookieJWTAuth, (req, res) =>
    getUserProfile(req, res, pool)
  );
  return router;
};

module.exports = userRoutes;
