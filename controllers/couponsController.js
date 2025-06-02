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
    const limit = pageSize;

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

    const result = await pool.query(fetchUserCouponsQuery, [
      decoded.id,
      limit,
      offset,
    ]);
    const userCoupons = result.rows;

    const countResult = await pool.query(getUserCouponsTotal, [decoded.id]);
    const totalCount = parseInt(countResult.rows[0].count, 10);

    // Calculate pagination information
    const currentPage = page;
    const recordsOnCurrentPage = userCoupons.length; // This will be pageSize or less if it's the last page
    const viewedRecords = (currentPage - 1) * pageSize + recordsOnCurrentPage;
    const remainingRecords = totalCount - viewedRecords;

    if (userCoupons.length === 0) {
      return res
        .status(404)
        .json({ message: "No coupons found for this user." });
    }

    res.status(200).json({
      userCoupons,
      Pagination: {
        currentPage: currentPage,
        recordsOnCurrentPage: recordsOnCurrentPage,
        viewedRecords: viewedRecords,
        remainingRecords: remainingRecords,
        total: totalCount,
      },
    });
  } catch (error) {
    console.error("Error fetching user coupons:", error);
    res.status(500).json({ message: "Failed to fetch user coupons." });
  }
};

const purchaseCoupon = async (req, res, pool) => {
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

  const { couponId } = req.body;
  if (!couponId) {
    return res.status(400).json({ error: "CouponId is required." });
  }
  try {
    const {
      rows: [{ confirmed_user: isUserConfirmed }],
    } = await pool.query(getConfirmedUserStatus, [decoded.id]);

    if (!isUserConfirmed) {
      console.error("User is not confirmed");
      return res.status(401).json({ message: "User is not confirmed." });
    }

    const { rows } = await pool.query(purchaseCouponQuery, [
      decoded.id,
      couponId,
    ]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error("Error purchasing coupon:", err);
    res.status(500).json({ message: "Failed to purchase coupon." });
  }
};

const getAvailableCoupons = async (req, res, pool) => {
  const page = parseInt(req.query.page, 10) || 1;
  const pageSize = parseInt(req.query.pageSize, 10) || 10;
  const offset = (page - 1) * pageSize;
  const limit = pageSize;

  const { restaurantId } = req.query;
  if (!restaurantId) {
    return res.status(400).json({ error: "restaurantId is required." });
  }

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
    const { rows: availableCoupons } = await pool.query(
      fetchAvailableCouponsQuery,
      [restaurantId, decoded.id, limit, offset]
    );

    if (availableCoupons.length === 0) {
      return res
        .status(404)
        .json({ message: "No coupons found for this restaurant." });
    }

    const countResult = await pool.query(fetchAvailableCouponsQueryTotal, [
      restaurantId,
      decoded.id,
    ]);
    const totalCount = parseInt(countResult.rows[0].count, 10);

    // Calculate pagination information
    const currentPage = page;
    const recordsOnCurrentPage = availableCoupons.length; // This will be pageSize or less if it's the last page
    const viewedRecords = (currentPage - 1) * pageSize + recordsOnCurrentPage;
    const remainingRecords = totalCount - viewedRecords;

    res.status(200).json({
      availableCoupons,
      Pagination: {
        currentPage: currentPage,
        recordsOnCurrentPage: recordsOnCurrentPage,
        viewedRecords: viewedRecords,
        remainingRecords: remainingRecords,
        total: totalCount,
      },
    });
  } catch (err) {
    console.error("Error fetching available coupons:", err);
    res.status(500).json({ message: "Failed to load available coupons." });
  }
};

const getRestaurantsWithPurchasedCoupons = async (req, res, pool) => {
  try {
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

    const result = await pool.query(fetchRestaurantsWithPurchasedCoupons, [
      decoded.id,
    ]);
    const restaurantsWithPurchasedCoupons = result.rows;

    if (restaurantsWithPurchasedCoupons.length === 0) {
      return res
        .status(404)
        .json({ message: "No coupons found for this user." });
    }

    res.json({ restaurantsWithPurchasedCoupons });
  } catch (error) {
    console.error("Error fetching user coupons:", error);
    res.status(500).json({ message: "Failed to fetch user coupons." });
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
