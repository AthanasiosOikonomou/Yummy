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
} = require("../queries/couponsQueries");

const { getconfirmed_userStatus } = require("../queries/userQueries");

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

module.exports = {
  getUserCoupons,
  purchaseCoupon,
  getAvailableCoupons,
  getRestaurantsWithPurchasedCoupons,
};
