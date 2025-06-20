require("dotenv").config();
const jwt = require("jsonwebtoken");

const { JWT_SECRET } = process.env;

const {
  fetchUserCouponsQuery,
  purchaseCouponQuery,
  fetchAvailableCouponsQuery,
  fetchRestaurantsWithPurchasedCoupons,
  getUserCouponsTotal,
  fetchAvailableCouponsQueryTotal,
  createCouponQuery,
  verifyRestaurantOwnership,
  updateCouponQuery,
  getCouponWithRestaurant,
  deleteCouponQuery,
} = require("../queries/couponsQueries");

const { getConfirmedUserStatus } = require("../queries/userQueries");

const {
  createCouponSchema,
  patchCouponSchema,
} = require("../validators/couponValidator");

const getUserCoupons = async (req, res, pool) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const pageSize = parseInt(req.query.pageSize, 10) || 10;
    const offset = (page - 1) * pageSize;

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

    const result = await pool.query(fetchUserCouponsQuery, [
      decoded.id,
      pageSize,
      offset,
    ]);
    const userCoupons = result.rows;

    const countResult = await pool.query(getUserCouponsTotal, [decoded.id]);
    const totalCount = parseInt(countResult.rows[0].count, 10);

    const viewedRecords = offset + userCoupons.length;
    const remainingRecords = totalCount - viewedRecords;

    res.status(200).json({
      userCoupons,
      Pagination: {
        currentPage: page,
        recordsOnCurrentPage: userCoupons.length,
        viewedRecords,
        remainingRecords,
        total: totalCount,
      },
    });
  } catch (error) {
    console.error("Error fetching user coupons:", error);
    res.status(500).json({ message: "Failed to fetch user coupons." });
  }
};

const purchaseCoupon = async (req, res, pool) => {
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

  const { coupon_id } = req.body;
  if (!coupon_id)
    return res.status(400).json({ error: "coupon_id is required." });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Check if already purchased
    const dupCheck = await client.query(
      "SELECT 1 FROM purchased_coupons WHERE user_id = $1 AND coupon_id = $2",
      [decoded.id, coupon_id]
    );
    if (dupCheck.rows.length > 0) {
      await client.query("ROLLBACK");
      return res
        .status(409)
        .json({ message: "Έχετε ήδη αγοράσει αυτό το κουπόνι." });
    }

    // 1. Get coupon points
    const { rows: couponRows } = await client.query(
      "SELECT required_points FROM coupons WHERE id = $1",
      [coupon_id]
    );
    if (couponRows.length === 0) throw new Error("Coupon not found.");
    const requiredPoints = couponRows[0].required_points;

    // 2. Get user points
    const { rows: userRows } = await client.query(
      "SELECT loyalty_points FROM users WHERE id = $1",
      [decoded.id]
    );
    const userPoints = userRows[0].loyalty_points;

    if (userPoints < requiredPoints) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "Δεν έχετε αρκετούς πόντους." });
    }

    // 3. Deduct points
    await client.query(
      "UPDATE users SET loyalty_points = loyalty_points - $1 WHERE id = $2",
      [requiredPoints, decoded.id]
    );

    // 4. Insert purchase
    const { rows } = await client.query(purchaseCouponQuery, [
      decoded.id,
      coupon_id,
    ]);

    await client.query("COMMIT");
    res.status(201).json(rows[0]);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Purchase coupon error:", err);
    res.status(500).json({ message: "Αποτυχία αγοράς κουπονιού." });
  } finally {
    client.release();
  }
};

const getAvailableCoupons = async (req, res, pool) => {
  const page = parseInt(req.query.page, 10) || 1;
  const pageSize = parseInt(req.query.pageSize, 10) || 10;
  const offset = (page - 1) * pageSize;
  const { restaurant_id } = req.query;

  if (!restaurant_id)
    return res.status(400).json({ error: "restaurant_id is required." });

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
    const { rows: availableCoupons } = await pool.query(
      fetchAvailableCouponsQuery,
      [restaurant_id, decoded.id, pageSize, offset]
    );

    const countResult = await pool.query(fetchAvailableCouponsQueryTotal, [
      restaurant_id,
      decoded.id,
    ]);
    const totalCount = parseInt(countResult.rows[0].count, 10);

    const viewedRecords = offset + availableCoupons.length;
    const remainingRecords = totalCount - viewedRecords;

    res.status(200).json({
      availableCoupons,
      Pagination: {
        currentPage: page,
        recordsOnCurrentPage: availableCoupons.length,
        viewedRecords,
        remainingRecords,
        total: totalCount,
      },
    });
  } catch (err) {
    console.error("Error fetching available coupons:", err);
    res.status(500).json({ message: "Failed to load available coupons." });
  }
};

const getRestaurantsWithPurchasedCoupons = async (req, res, pool) => {
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
    const result = await pool.query(fetchRestaurantsWithPurchasedCoupons, [
      decoded.id,
    ]);
    const restaurantsWithPurchasedCoupons = result.rows;

    res.json({ restaurantsWithPurchasedCoupons });
  } catch (error) {
    console.error("Error fetching restaurants with coupons:", error);
    res.status(500).json({ message: "Failed to fetch restaurants." });
  }
};

const createCoupon = async (req, res, pool) => {
  console.log("🔐 Validating owner identity via token...");

  const token = req.cookies.token;
  if (!token) {
    console.log("🚨 No token found in cookies");
    return res.status(401).json({ message: "Unauthorized - No token found" });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    console.log("🚨 Invalid token:", err);
    res.clearCookie("token");
    return res.status(401).json({ message: "Unauthorized - Invalid token" });
  }

  const { error, value } = createCouponSchema.validate(req.body);
  if (error) {
    return res
      .status(400)
      .json({ message: "Validation failed", details: error.details });
  }

  const { description, discount_percentage, required_points, restaurant_id } =
    value;

  try {
    const ownershipResult = await pool.query(verifyRestaurantOwnership, [
      restaurant_id,
      decoded.id,
    ]);

    if (ownershipResult.rowCount === 0) {
      return res.status(403).json({
        message: "Forbidden - You do not own this restaurant.",
      });
    }

    const { rows } = await pool.query(createCouponQuery, [
      description,
      discount_percentage,
      required_points,
      restaurant_id,
    ]);

    res
      .status(201)
      .json({ message: "Coupon created successfully", coupon: rows[0] });
  } catch (err) {
    console.error("Error creating coupon:", err);
    res.status(500).json({ message: "Failed to create coupon." });
  }
};

const editCoupon = async (req, res, pool) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ message: "Unauthorized - No token found" });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    res.clearCookie("token");
    return res.status(401).json({ message: "Unauthorized - Invalid token" });
  }

  const { error, value } = patchCouponSchema.validate(req.body);
  if (error) {
    return res
      .status(400)
      .json({ message: "Validation failed", details: error.details });
  }

  const { couponId, ...fieldsToUpdate } = value;

  try {
    // Ownership check
    const ownershipCheck = await pool.query(getCouponWithRestaurant, [
      couponId,
    ]);
    if (
      ownershipCheck.rowCount === 0 ||
      ownershipCheck.rows[0].owner_id !== decoded.id
    ) {
      return res
        .status(403)
        .json({ message: "Forbidden - You do not own this coupon." });
    }

    // Build dynamic update
    const keys = Object.keys(fieldsToUpdate);
    const setClause = keys.map((key, i) => `${key} = $${i + 1}`).join(", ");
    const values = Object.values(fieldsToUpdate);
    const updateQuery = `UPDATE coupons SET ${setClause} WHERE id = $${
      keys.length + 1
    } RETURNING *;`;

    const { rows } = await pool.query(updateQuery, [...values, couponId]);

    res
      .status(200)
      .json({ message: "Coupon updated successfully", coupon: rows[0] });
  } catch (err) {
    console.error("Error updating coupon:", err);
    res.status(500).json({ message: "Failed to update coupon." });
  }
};

const deleteCoupon = async (req, res, pool) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ message: "Unauthorized - No token found" });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    res.clearCookie("token");
    return res.status(401).json({ message: "Unauthorized - Invalid token" });
  }

  const { couponId } = req.body;
  if (!couponId) {
    return res.status(400).json({ message: "couponId is required." });
  }

  try {
    const ownershipCheck = await pool.query(getCouponWithRestaurant, [
      couponId,
    ]);

    if (
      ownershipCheck.rowCount === 0 ||
      ownershipCheck.rows[0].owner_id !== decoded.id
    ) {
      return res
        .status(403)
        .json({ message: "Forbidden - You do not own this coupon." });
    }

    const { rows } = await pool.query(deleteCouponQuery, [couponId]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "Coupon not found." });
    }

    res
      .status(200)
      .json({ message: "Coupon deleted successfully", coupon: rows[0] });
  } catch (err) {
    console.error("Error deleting coupon:", err);
    res.status(500).json({ message: "Failed to delete coupon." });
  }
};

module.exports = {
  getUserCoupons,
  purchaseCoupon,
  getAvailableCoupons,
  getRestaurantsWithPurchasedCoupons,
  createCoupon,
  editCoupon,
  deleteCoupon,
};
