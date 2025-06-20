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
  getConfirmedUserStatus,
  updateUserPointsQuery,
  fetchUserPoints,
} = require("../queries/userQueries");
const {
  patchReservationAsOwnerSchema,
  getOwnerFilteredReservationsSchema,
} = require("../validators/reservationsValidator");


const getUserReservations = async (req, res, pool) => {
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

  try {
    const { rows } = await pool.query(fetchReservationsByUser, [decoded.id]);
    if (rows.length === 0)
      return res
        .status(404)
        .json({ error: "No reservations found for this user." });
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: "Failed to load reservations." });
  }
};

const getReservationById = async (req, res, pool) => {
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

  const { id } = req.params;

  try {
    const { rows } = await pool.query(fetchReservationById, [id, decoded.id]);
    if (rows.length === 0 || rows[0].user_id !== decoded.id) {
      return res.status(404).json({ error: "Reservation not found." });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error("Error loading reservation:", err);
    res.status(500).json({ message: "Failed to load reservation." });
  }
};

const createReservation = async (req, res, pool) => {
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

  const {
    rows: [{ confirmed_user: isUserConfirmed }],
  } = await pool.query(getconfirmed_userStatus, [decoded.id]);

  if (!isUserConfirmed)
    return res.status(401).json({ message: "User is not confirmed." });

  const {
    restaurant_id,
    date,
    time,
    guest_count,
    status = "pending",
    special_menu_id,
    coupon_id,
    reservation_notes,
  } = req.body;

  const cleanNotes =
    typeof reservation_notes === "string" && reservation_notes.trim().length > 0
      ? reservation_notes.trim()
      : null;

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // ✅ Αν έχει κουπόνι, κάνε έλεγχο και κλείδωμα
    if (coupon_id) {
      const { rows: couponCheck } = await client.query(
        `
        SELECT * FROM purchased_coupons 
        WHERE user_id = $1 AND coupon_id = $2 
          AND is_used = false AND is_locked = false
        `,
        [decoded.id, coupon_id]
      );

      if (couponCheck.length === 0) {
        await client.query("ROLLBACK");
        return res.status(400).json({
          message: "Το κουπόνι δεν είναι διαθέσιμο ή έχει ήδη χρησιμοποιηθεί.",
        });
      }

      // 🔒 Κλείδωσε το κουπόνι
      await client.query(
        `
        UPDATE purchased_coupons 
        SET is_locked = true 
        WHERE user_id = $1 AND coupon_id = $2
        `,
        [decoded.id, coupon_id]
      );
    }

    // ✅ Δημιουργία κράτησης
    const { rows } = await client.query(createReservationQuery, [
      decoded.id,
      restaurant_id,
      date,
      time,
      guest_count,
      status,
      special_menu_id,
      coupon_id,
      cleanNotes,
    ]);

    if (rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        message:
          "Special menu or coupon does not belong to the selected restaurant.",
      });
    }

    await client.query("COMMIT");

    const reservation = rows[0];
    res.status(201).json(reservation);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error creating reservation:", err);
    res.status(500).json({ message: "Failed to create reservation." });
  } finally {
    client.release();
  }
};


const deleteReservation = async (req, res, pool) => {
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

  const { id } = req.params;

  try {
    const { rows } = await pool.query(deleteReservationQuery, [id, decoded.id]);
    if (rows.length === 0)
      return res.status(404).json({ error: "Reservation not found." });
    res.json({ status: "Deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete reservation." });
  }
};

const cancelReservation = async (req, res, pool) => {
  const { id } = req.params;
  const { reason } = req.body;

  if (!reason || !reason.trim()) {
    return res
      .status(400)
      .json({ message: "Ο λόγος ακύρωσης είναι υποχρεωτικός." });
  }

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

  try {
    // 1. Πάρε την κράτηση
    const { rows: reservationRows } = await pool.query(
      "SELECT date, time FROM reservations WHERE id = $1 AND user_id = $2",
      [id, decoded.id]
    );
    if (reservationRows.length === 0) {
      return res
        .status(404)
        .json({ error: "Reservation not found or not owned by user." });
    }

    const { date, time } = reservationRows[0];

    // 2. Δημιουργία UTC datetime από date + time
    const [year, month, day] = [
      date.getFullYear(),
      date.getMonth() + 1,
      date.getDate(),
    ];
    const datePart = `${year}-${month.toString().padStart(2, "0")}-${day
      .toString()
      .padStart(2, "0")}`;

    const [hours, minutes, seconds] = time.split(":").map(Number);

    const reservationDateTimeUTC = new Date(
      Date.UTC(
        Number(datePart.split("-")[0]), // έτος
        Number(datePart.split("-")[1]) - 1, // μήνας (0-based)
        Number(datePart.split("-")[2]), // ημέρα
        hours,
        minutes,
        seconds || 0
      )
    );

    const nowUTC = new Date();

    const diffInMs = reservationDateTimeUTC - nowUTC;
    const diffInHours = diffInMs / (1000 * 60 * 60);

    console.log("🕒 Reservation UTC:", reservationDateTimeUTC.toISOString());
    console.log("🕒 Now UTC:", nowUTC.toISOString());
    console.log("⏱ Hours until reservation:", diffInHours);

    // 3. Ακύρωση κράτησης
    const { rows } = await pool.query(cancelReservationQuery, [
      reason.trim(),
      id,
      decoded.id,
    ]);

    // 4. Αν απομένουν λιγότερες από 2 ώρες → αφαίρεση πόντων
    if (diffInHours < 2 && diffInHours > 0) {
      const userResult = await pool.query(fetchUserPoints, [decoded.id]);
      const currentPoints = userResult.rows[0].loyalty_points || 0;
      const newPoints = Math.max(currentPoints - 15, 0);

      await pool.query(updateUserPointsQuery, [newPoints, decoded.id]);
      console.log(`➖ Ποινή: Αφαίρεση 15 πόντων. Τελικοί: ${newPoints}`);
    }

    res.json({ status: "Canceled", reservation: rows[0] });
  } catch (err) {
    console.error("Error canceling the reservation:", err);
    res.status(500).json({ message: "Failed to cancel reservation." });
  }
};

const getFilteredReservations = async (req, res, pool) => {
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

  const page = parseInt(req.query.page, 10) || 1;
  const pageSize = parseInt(req.query.pageSize, 10) || 10;
  const offset = (page - 1) * pageSize;
  const limit = pageSize;

  const filters = [];
  const values = [];
  let idx = 1;

  if (req.query.status) {
    filters.push(`r.status ILIKE $${idx}`);
    values.push(`%${req.query.status}%`);
    idx++;
  }

  if (req.query.date) {
    filters.push(`r.date = $${idx}`);
    values.push(req.query.date);
    idx++;
  }

  filters.push(`r.user_id = $${idx}`);
  values.push(decoded.id);
  idx++;

  const whereClause = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

  const dataQuery = `
    SELECT 
      r.*,
      sm.id AS sm_id,
      sm.name AS sm_name,
      sm.description AS sm_description,
      c.id AS c_id,
      c.description AS c_description
    FROM reservations r
    LEFT JOIN special_menus sm ON r.special_menu_id = sm.id
    LEFT JOIN coupons c ON r.coupon_id = c.id
    ${whereClause}
    ORDER BY r.date DESC, r.time DESC
    LIMIT $${idx} OFFSET $${idx + 1}
  `;

  const countQuery = `
    SELECT COUNT(*) FROM reservations r
    ${whereClause}
  `;

  try {
    values.push(limit, offset);

    const { rows } = await pool.query(dataQuery, values);

    // 🔄 Μετασχηματισμός των δεδομένων σε nested μορφή
    const formatted = rows.map((r) => {
      const {
        sm_id,
        sm_name,
        sm_description,
        c_id,
        c_description,
        ...base
      } = r;

      return {
        ...base,
        special_menu: sm_id
          ? { id: sm_id, name: sm_name, description: sm_description }
          : null,
        coupon: c_id
          ? { id: c_id, description: c_description }
          : null,
      };
    });

    const countValues = values.slice(0, values.length - 2);
    const { rows: countRows } = await pool.query(countQuery, countValues);
    const totalCount = parseInt(countRows[0].count, 10);

    const currentPage = page;
    const recordsOnCurrentPage = formatted.length;
    const viewedRecords = (currentPage - 1) * pageSize + recordsOnCurrentPage;
    const remainingRecords = totalCount - viewedRecords;

    res.json({
      reservations: formatted,
      Pagination: {
        currentPage,
        recordsOnCurrentPage,
        viewedRecords,
        remainingRecords,
        total: totalCount,
      },
    });
  } catch (err) {
    console.error("Error filtering reservations:", err);
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
