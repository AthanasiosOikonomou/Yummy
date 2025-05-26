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
    if (!token) return res.status(401).json({ message: "Unauthorized - No token found" });

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
  if (!token) return res.status(401).json({ message: "Unauthorized - No token found" });

  let decoded;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    res.clearCookie("token");
    return res.status(401).json({ message: "Unauthorized - Invalid token" });
  }

  const { coupon_id } = req.body;
  if (!coupon_id) return res.status(400).json({ error: "coupon_id is required." });

  try {
    const {
      rows: [{ confirmed_user: isUserConfirmed }],
    } = await pool.query(getconfirmed_userStatus, [decoded.id]);

    if (!isUserConfirmed) return res.status(401).json({ message: "User is not confirmed." });

    const { rows } = await pool.query(purchaseCouponQuery, [decoded.id, coupon_id]);
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
  const { restaurant_id } = req.query;

  if (!restaurant_id) return res.status(400).json({ error: "restaurant_id is required." });

  const token = req.cookies.token;
  if (!token) return res.status(401).json({ message: "Unauthorized - No token found" });

  let decoded;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    res.clearCookie("token");
    return res.status(401).json({ message: "Unauthorized - Invalid token" });
  }

  try {
    const { rows: availableCoupons } = await pool.query(fetchAvailableCouponsQuery, [
      restaurant_id,
      decoded.id,
      pageSize,
      offset,
    ]);

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
  if (!token) return res.status(401).json({ message: "Unauthorized - No token found" });

  let decoded;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    res.clearCookie("token");
    return res.status(401).json({ message: "Unauthorized - Invalid token" });
  }

  try {
    const result = await pool.query(fetchRestaurantsWithPurchasedCoupons, [decoded.id]);
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
