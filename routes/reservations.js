const express = require("express");
const {
  getUserReservations,
  getReservationById,
  createReservation,
  deleteReservation,
  cancelReservation,
  getFilteredReservations,
  patchReservationAsOwner,
  getOwnerFilteredReservations,
} = require("../controllers/reservationsController");

module.exports = (pool) => {
  const router = express.Router();

  router.get("/user", (req, res) => getUserReservations(req, res, pool));
  router.get("/user/filtered", (req, res) =>
    getFilteredReservations(req, res, pool)
  );
  router.get("/:id", (req, res) => getReservationById(req, res, pool));
  router.post("/", (req, res) => createReservation(req, res, pool));
  router.delete("/:id", (req, res) => deleteReservation(req, res, pool));
  router.post("/cancel/:id", (req, res) => cancelReservation(req, res, pool));

  router.patch("/owner", (req, res) => patchReservationAsOwner(req, res, pool));
  router.get("/filtered/owner", (req, res) =>
    getOwnerFilteredReservations(req, res, pool)
  );

  return router;
};
