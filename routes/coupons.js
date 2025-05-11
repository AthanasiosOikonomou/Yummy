const express = require("express");
const {
  getUserCoupons,
  purchaseCoupon,
  getAvailableCoupons,
} = require("../controllers/couponsController");

module.exports = (pool) => {
  const router = express.Router();

  router.get("/ownedByUser", (req, res) => getUserCoupons(req, res, pool));
  router.post("/purchase", (req, res) => purchaseCoupon(req, res, pool));
  router.get("/available", (req, res) => getAvailableCoupons(req, res, pool));

  return router;
};
