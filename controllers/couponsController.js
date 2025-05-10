const {
  fetchUserCouponsQuery,
  purchaseCouponQuery,
  fetchAvailableCouponsQuery,
} = require("../queries/couponsQueries");

const getUserCoupons = async (req, res, pool) => {
  const userId = req.params.userId;

  try {
    const result = await pool.query(fetchUserCouponsQuery, [userId]);
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
  const { userId, couponId } = req.body;
  if (!userId || !couponId) {
    return res.status(400).json({ error: "userId and couponId are required." });
  }
  try {
    const { rows } = await pool.query(purchaseCouponQuery, [userId, couponId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error("Error purchasing coupon:", err);
    res.status(500).json({ message: "Failed to purchase coupon." });
  }
};

const getAvailableCoupons = async (req, res, pool) => {
  const { restaurantId, userId } = req.query;
  if (!restaurantId || !userId) {
    return res
      .status(400)
      .json({ error: "restaurantId and userId are required." });
  }
  try {
    const { rows } = await pool.query(fetchAvailableCouponsQuery, [
      restaurantId,
      userId,
    ]);
    res.json(rows);
  } catch (err) {
    console.error("Error fetching available coupons:", err);
    res.status(500).json({ message: "Failed to load available coupons." });
  }
};

module.exports = {
  getUserCoupons,
  purchaseCoupon,
  getAvailableCoupons,
};
