const {
  fetchReservationsByUser,
  fetchReservationById,
  createReservationQuery,
  deleteReservationQuery,
} = require("../queries/reservationsQueries");

const getUserReservations = async (req, res, pool) => {
  const { userId } = req.params;

  try {
    const { rows } = await pool.query(fetchReservationsByUser, [userId]);

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ error: "No reservations found for this user." });
    }

    res.json(rows);
  } catch (err) {
    console.error("Error fetching user reservations:", err);
    res.status(500).json({ message: "Failed to load reservations." });
  }
};

const getReservationById = async (req, res, pool) => {
  const { id } = req.params;

  try {
    const { rows } = await pool.query(fetchReservationById, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: "Reservation not found." });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error("Error fetching reservation by ID:", err);
    res.status(500).json({ message: "Failed to load reservation." });
  }
};

const createReservation = async (req, res, pool) => {
  const {
    userId,
    restaurantId,
    date,
    time,
    guestCount,
    status = "pending",
    specialMenuId = null,
    couponId = null,
  } = req.body;

  try {
    const { rows } = await pool.query(createReservationQuery, [
      userId,
      restaurantId,
      date,
      time,
      guestCount,
      status,
      specialMenuId,
      couponId,
    ]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error("Error creating reservation:", err);
    res.status(500).json({ message: "Failed to create reservation." });
  }
};

const deleteReservation = async (req, res, pool) => {
  const { id } = req.params;

  try {
    const { rows } = await pool.query(deleteReservationQuery, [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: "Reservation not found." });
    }
    res.json({ status: "Deleted" });
  } catch (err) {
    console.error("Error deleting reservation:", err);
    res.status(500).json({ message: "Failed to delete reservation." });
  }
};

module.exports = {
  getUserReservations,
  getReservationById,
  createReservation,
  deleteReservation,
};
