require("dotenv").config();

const jwt = require("jsonwebtoken");

const { JWT_SECRET } = process.env;

const {
  fetchUserCouponsQuery,
  purchaseCouponQuery,
  fetchAvailableCouponsQuery,
  fetchRestaurantsWithPurchasedCoupons,
} = require("../queries/couponsQueries");

const { getConfirmedUserStatus } = require("../queries/userQueries");
const {
  fetchFilteredRestaurantsBase,
} = require("../queries/restaurantQueries");

const getUserCoupons = async (req, res, pool) => {
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

    const result = await pool.query(fetchUserCouponsQuery, [decoded.id]);
    const userCoupons = result.rows;

    if (userCoupons.length === 0) {
      return res
        .status(404)
        .json({ message: "No coupons found for this user." });
    }

    res.json({ userCoupons });
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
      [restaurantId, decoded.id]
    );

    if (availableCoupons.length === 0) {
      return res
        .status(404)
        .json({ message: "No coupons found for this restaurant." });
    }

    res.json({ availableCoupons });
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

module.exports = {
  getUserCoupons,
  purchaseCoupon,
  getAvailableCoupons,
  getRestaurantsWithPurchasedCoupons,
};
