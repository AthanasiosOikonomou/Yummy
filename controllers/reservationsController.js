require("dotenv").config();

const jwt = require("jsonwebtoken");

const { JWT_SECRET } = process.env;

const {
  fetchReservationsByUser,
  fetchReservationById,
  createReservationQuery,
  deleteReservationQuery,
  cancelReservationQuery,
  fetchFilteredUserReservations,
  countFilteredUserReservations,
} = require("../queries/reservationsQueries");

const { getconfirmed_userStatus } = require("../queries/userQueries");

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
  } = await pool.query(getconfirmed_userStatus, [decoded.id]);

  if (!isUserConfirmed) {
    console.error("User is not confirmed");
    return res.status(401).json({ message: "User is not confirmed." });
  }

  const {
    restaurant_id,
    date,
    time,
    guest_count,
    status = "pending",
    special_menu_id,
    coupon_id,
  } = req.body;

  try {
    const { rows } = await pool.query(createReservationQuery, [
      decoded.id,
      restaurant_id,
      date,
      time,
      guest_count,
      status,
      special_menu_id,
      coupon_id,
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

const getFilteredReservations = async (req, res, pool) => {
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

  // 1) Parse pagination
  const page = parseInt(req.query.page, 10) || 1;
  const pageSize = parseInt(req.query.pageSize, 10) || 10;
  const offset = (page - 1) * pageSize;
  const limit = pageSize;

  // 2) Build dynamic WHERE clause
  const filters = [];
  const values = [];
  let idx = 1;

  if (req.query.status) {
    filters.push(`status ILIKE $${idx}`);
    values.push(`%${req.query.status}%`);
    idx++;
  }

  if (req.query.date) {
    filters.push(
      `(date AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Athens')::date = $${idx}`
    );
    values.push(req.query.date);
    idx++;
  }

  const whereClause = filters.length ? ` WHERE ${filters.join(" AND ")}` : "";

  try {
    // 3) Fetch the page of data
    const dataQuery = `
      ${fetchFilteredUserReservations}
      ${whereClause}
      LIMIT $${idx} OFFSET $${idx + 1}
    `;
    values.push(limit, offset);

    const { rows: reservations } = await pool.query(dataQuery, values);

    console.log(values);

    if (!reservations.length) {
      return res
        .status(404)
        .json({ error: "No reservations found matching filters." });
    }

    // 4) Fetch the total count
    const countQuery = `
      ${countFilteredUserReservations}
      ${whereClause}
    `;
    // count uses only the filter params (not limit/offset)
    const countValues = values.slice(0, idx - 1);
    const { rows: countRows } = await pool.query(countQuery, countValues);
    const totalCount = parseInt(countRows[0].count, 10);
    console.log(countRows);
    console.log(totalCount);

    // 5) Build pagination metadata
    const currentPage = page;
    const recordsOnCurrentPage = reservations.length;
    const viewedRecords = (currentPage - 1) * pageSize + recordsOnCurrentPage;
    const remainingRecords = totalCount - viewedRecords;

    // 6) Send response
    res.json({
      reservations,
      Pagination: {
        currentPage,
        recordsOnCurrentPage,
        viewedRecords,
        remainingRecords,
        total: totalCount,
      },
    });
  } catch (err) {
    console.error("Error fetching filtered reservations:", err);
    res.status(500).json({ message: "Failed to load reservations." });
  }
};

module.exports = {
  getUserReservations,
  getReservationById,
  createReservation,
  deleteReservation,
  cancelReservation,
  getFilteredReservations,
};
