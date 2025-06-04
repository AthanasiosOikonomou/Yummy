const express = require("express");
const {
  getUserCoupons,
  purchaseCoupon,
  getAvailableCoupons,
  getRestaurantsWithPurchasedCoupons,
  createCoupon,
  editCoupon,
  deleteCoupon,
} = require("../../../controllers/couponsController");

module.exports = (pool) => {
  const router = express.Router();

  router.get("/ownedByUser", (req, res) => getUserCoupons(req, res, pool));
  router.post("/purchase", (req, res) => purchaseCoupon(req, res, pool));
  router.get("/available", (req, res) => getAvailableCoupons(req, res, pool));
  router.get("/purchased/restaurants", (req, res) =>
    getRestaurantsWithPurchasedCoupons(req, res, pool)
  );
  router.post("/creation", (req, res) => createCoupon(req, res, pool));
  router.patch("/edit", (req, res) => editCoupon(req, res, pool));
  router.delete("/delete", (req, res) => deleteCoupon(req, res, pool));

  return router;
};
