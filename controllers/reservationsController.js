require("dotenv").config();

const jwt = require("jsonwebtoken");

const { JWT_SECRET } = process.env;

const {
  fetchReservationsByUser,
  fetchReservationById,
  createReservationQuery,
  deleteReservationQuery,
  cancelReservationQuery,
} = require("../queries/reservationsQueries");

const { getConfirmedUserStatus } = require("../queries/userQueries");

const getUserReservations = async (req, res, pool) => {
  console.log("🔍 Checking authentication via cookies...");

  // ✅ Extract JWT token from cookies
  const token = req.cookies.token;
  if (!token) {
    console.log("🚨 No token found in cookies");
    return res.status(401).json({ message: "Unauthorized - No token found" });
  }

  // ✅ Verify token and decode user data
  let decoded;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    console.log("🚨 Invalid token:", err);
    res.clearCookie("token"); // Clear corrupted token
    return res.status(401).json({ message: "Unauthorized - Invalid token" });
  }

  console.log("✅ Decoded user:", decoded);

  try {
    const { rows } = await pool.query(fetchReservationsByUser, [decoded.id]);

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
  console.log("🔍 Checking authentication via cookies...");

  // ✅ Extract JWT token from cookies
  const token = req.cookies.token;
  if (!token) {
    console.log("🚨 No token found in cookies");
    return res.status(401).json({ message: "Unauthorized - No token found" });
  }

  // ✅ Verify token and decode user data
  let decoded;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    console.log("🚨 Invalid token:", err);
    res.clearCookie("token"); // Clear corrupted token
    return res.status(401).json({ message: "Unauthorized - Invalid token" });
  }

  console.log("✅ Decoded user:", decoded);

  const {
    rows: [{ confirmed_user: isUserConfirmed }],
  } = await pool.query(getConfirmedUserStatus, [decoded.id]);

  if (!isUserConfirmed) {
    console.error("User is not confirmed");
    return res.status(401).json({ message: "User is not confirmed." });
  }

  const {
    restaurantId,
    date,
    time,
    guestCount,
    status = "pending",
    specialMenuId,
    couponId,
  } = req.body;

  try {
    const { rows } = await pool.query(createReservationQuery, [
      decoded.id,
      restaurantId,
      date,
      time,
      guestCount,
      status,
      specialMenuId,
      couponId,
    ]);

    if (rows.length === 0) {
      console.error(
        "Special menu or coupon does not belong to the selected restaurant."
      );
      res.status(400).json({
        message:
          "Special menu or coupon does not belong to the selected restaurant.",
      });
    }
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error("Error creating reservation:", err);
    res.status(500).json({ message: "Failed to create reservation." });
  }
};

const deleteReservation = async (req, res, pool) => {
  const { id } = req.params;

  console.log("🔍 Checking authentication via cookies...");

  // ✅ Extract JWT token from cookies
  const token = req.cookies.token;
  if (!token) {
    console.log("🚨 No token found in cookies");
    return res.status(401).json({ message: "Unauthorized - No token found" });
  }

  // ✅ Verify token and decode user data
  let decoded;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    console.log("🚨 Invalid token:", err);
    res.clearCookie("token"); // Clear corrupted token
    return res.status(401).json({ message: "Unauthorized - Invalid token" });
  }

  console.log("✅ Decoded user:", decoded);

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

const cancelReservation = async (req, res, pool) => {
  const { id } = req.params;

  console.log("🔍 Checking authentication via cookies...");

  // ✅ Extract JWT token from cookies
  const token = req.cookies.token;
  if (!token) {
    console.log("🚨 No token found in cookies");
    return res.status(401).json({ message: "Unauthorized - No token found" });
  }

  // ✅ Verify token and decode user data
  let decoded;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    console.log("🚨 Invalid token:", err);
    res.clearCookie("token"); // Clear corrupted token
    return res.status(401).json({ message: "Unauthorized - Invalid token" });
  }

  console.log("✅ Decoded user:", decoded);

  try {
    const { rows } = await pool.query(cancelReservationQuery, [
      "cancelled",
      id,
    ]);
    if (rows.length === 0) {
      return res.status(404).json({ error: "Reservation not found." });
    }
    res.json({ status: "Canceled" });
  } catch (err) {
    console.error("Error canceling the reservation:", err);
    res.status(500).json({ message: "Failed to cancel reservation." });
  }
};

module.exports = {
  getUserReservations,
  getReservationById,
  createReservation,
  deleteReservation,
  cancelReservation,
};
