// routes/restaurantRoutes.js
const express = require("express");
const cookieJWTAuth = require("../middleware/cookieJWTAuth");
const {
  createRestaurant,
  updateRestaurantDetails,
  deleteRestaurantById,
  getRestaurant,
  getAllRestaurants,
} = require("../controllers/restaurantController");

const restaurantRoutes = (pool) => {
  const router = express.Router();
  router.post("/", cookieJWTAuth, (req, res, next) =>
    createRestaurant(req, res, next, pool)
  );
  router.patch("/:id", cookieJWTAuth, (req, res, next) =>
    updateRestaurantDetails(req, res, next, pool)
  );
  router.delete("/:id", cookieJWTAuth, (req, res, next) =>
    deleteRestaurantById(req, res, next, pool)
  );
  router.get("/:id", (req, res) => getRestaurant(req, res, pool));
  router.get("/", (req, res) => getAllRestaurants(req, res, pool));
  return router;
};

module.exports = restaurantRoutes;
