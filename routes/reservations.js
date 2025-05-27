const express = require("express");
const {
  getUserReservations,
  getReservationById,
  createReservation,
  deleteReservation,
  cancelReservation,
  getFilteredReservations,
} = require("../controllers/reservationsController");

module.exports = (pool) => {
  const router = express.Router();

  // 🟢 Πρώτα τα πιο συγκεκριμένα routes
  router.get("/user/filtered", (req, res) =>
    getFilteredReservations(req, res, pool)
  );
  router.get("/user", (req, res) => getUserReservations(req, res, pool));
  router.post("/cancel/:id", (req, res) =>
    cancelReservation(req, res, pool)
  );

  // 🟡 Μετά τα γενικά με δυναμικά params
  router.get("/:id", (req, res) => getReservationById(req, res, pool));
  router.post("/", (req, res) => createReservation(req, res, pool));
  router.delete("/:id", (req, res) => deleteReservation(req, res, pool));

  return router;
};