const express = require("express");
const {
  createRestaurant,
  registerAdmin,
  loginAdmin,
} = require("../../../controllers/adminController");

module.exports = (pool) => {
  const router = express.Router();

  router.post("/createRestaurant", (req, res) =>
    createRestaurant(req, res, pool)
  );

  router.post("/register", (req, res) => registerAdmin(req, res, pool));
  router.post("/login", (req, res) => loginAdmin(req, res, pool));

  return router;
};
