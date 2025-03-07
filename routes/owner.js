// routes/ownerRoutes.js
const express = require("express");
const cookieJWTAuth = require("../middleware/cookieJWTAuth");
const {
  registerOwner,
  loginOwner,
  updateOwnerDetails,
  getOwnerProfile,
} = require("../controllers/ownerController");

const ownerRoutes = (pool) => {
  const router = express.Router();
  router.post("/register", (req, res, next) =>
    registerOwner(req, res, next, pool)
  );
  router.post("/login", (req, res) => loginOwner(req, res, pool));
  router.patch("/update", cookieJWTAuth, (req, res, next) =>
    updateOwnerDetails(req, res, next, pool)
  );
  router.get("/profile", cookieJWTAuth, (req, res) =>
    getOwnerProfile(req, res, pool)
  );
  return router;
};

module.exports = ownerRoutes;
