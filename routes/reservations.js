const express = require("express");
const {
  getUserReservations,
  getReservationById,
  createReservation,
  deleteReservation,
} = require("../controllers/reservationsController");

// GET /reservations/user/:userId

module.exports = (pool) => {
  const router = express.Router();

  router.get("/user/:userId", (req, res) =>
    getUserReservations(req, res, pool)
  );

  router.get("/:id", (req, res) => getReservationById(req, res, pool));
  router.post("/", (req, res) => createReservation(req, res, pool));
  router.delete("/:id", (req, res) => deleteReservation(req, res, pool));

  return router;
};
