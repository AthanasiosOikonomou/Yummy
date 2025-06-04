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
  patchReservationAsOwnerQuery,
  verifyReservationOwnership,
  fetchOwnerFilteredReservations,
  countOwnerFilteredReservations,
} = require("../queries/reservationsQueries");

const {
  patchReservationAsOwnerSchema,
  getOwnerFilteredReservationsSchema,
} = require("../validators/reservationsValidator");

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

const patchReservationAsOwner = async (req, res, pool) => {
  console.log("🔐 Validating owner via token...");

  const token = req.cookies.token;
  if (!token)
    return res.status(401).json({ message: "Unauthorized - No token" });

  let decoded;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    console.log("❌ Invalid token:", err);
    res.clearCookie("token");
    return res.status(401).json({ message: "Unauthorized - Invalid token" });
  }

  const { error, value } = patchReservationAsOwnerSchema.validate(req.body);
  if (error)
    return res
      .status(400)
      .json({ message: "Validation failed", details: error.details });

  const { status, cancellation_reason, reservation_id } = value;

  try {
    const ownership = await pool.query(verifyReservationOwnership, [
      reservation_id,
      decoded.id,
    ]);

    if (ownership.rowCount === 0) {
      return res
        .status(403)
        .json({ message: "Forbidden - You do not own this restaurant" });
    }

    const { rows } = await pool.query(patchReservationAsOwnerQuery, [
      status,
      cancellation_reason,
      reservation_id,
    ]);

    res.status(200).json({
      message: "Reservation updated successfully",
      reservation: rows[0],
    });
  } catch (err) {
    console.error("Error patching reservation as owner:", err);
    res.status(500).json({ message: "Server error" });
  }
};

const getOwnerFilteredReservations = async (req, res, pool) => {
  const token = req.cookies.token;
  if (!token)
    return res.status(401).json({ message: "Unauthorized - No token found" });

  let decoded;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    res.clearCookie("token");
    return res.status(401).json({ message: "Unauthorized - Invalid token" });
  }

  const { error, value } = getOwnerFilteredReservationsSchema.validate(
    req.query
  );
  if (error)
    return res
      .status(400)
      .json({ message: "Validation failed", details: error.details });

  const page = parseInt(req.query.page, 10) || 1;
  const pageSize = parseInt(req.query.pageSize, 10) || 10;
  const offset = (page - 1) * pageSize;
  const limit = pageSize;

  const filters = [];
  const values = [decoded.id];
  let idx = 2;

  if (req.query.status) {
    filters.push(`r.status ILIKE $${idx}`);
    values.push(`%${req.query.status}%`);
    idx++;
  }

  if (req.query.date) {
    filters.push(
      `(r.date AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Athens')::date = $${idx}`
    );
    values.push(req.query.date);
    idx++;
  }

  const whereClause = filters.length ? ` AND ${filters.join(" AND ")}` : "";

  try {
    const dataQuery = `
      ${fetchOwnerFilteredReservations}
      ${whereClause}
      ORDER BY r.date DESC, r.time ASC
      LIMIT $${idx} OFFSET $${idx + 1}
    `;
    values.push(limit, offset);

    const { rows: reservations } = await pool.query(dataQuery, values);

    const countQuery = `
      ${countOwnerFilteredReservations}
      ${whereClause}
    `;
    const countValues = values.slice(0, idx - 1);
    const { rows: countRows } = await pool.query(countQuery, countValues);
    const totalCount = parseInt(countRows[0].count, 10);

    const currentPage = page;
    const recordsOnCurrentPage = reservations.length;
    const viewedRecords = (currentPage - 1) * pageSize + recordsOnCurrentPage;
    const remainingRecords = totalCount - viewedRecords;

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
    console.error("Error fetching owner reservations:", err);
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
  patchReservationAsOwner,
  getOwnerFilteredReservations,
};
