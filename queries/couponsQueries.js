// 🔁 1. Όλα τα κουπόνια του χρήστη
const fetchUserCouponsQuery = `
  SELECT c.*
  FROM purchased_coupons pc
  JOIN coupons c ON pc.coupon_id = c.id
  WHERE pc.user_id = $1
  ORDER BY pc.purchased_at DESC
  LIMIT $2 OFFSET $3
`;

// 🔢 Συνολικός αριθμός κουπονιών χρήστη
const getUserCouponsTotal = `
  SELECT COUNT(*)
  FROM purchased_coupons pc
  WHERE pc.user_id = $1
`;

// 🛒 2. Αγορά κουπονιού
const purchaseCouponQuery = `
  INSERT INTO purchased_coupons (user_id, coupon_id, purchased_at)
  VALUES ($1, $2, NOW())
  RETURNING *
`;

// 🟦 3. Διαθέσιμα κουπόνια για εστιατόριο που δεν έχει ήδη αγοράσει
const fetchAvailableCouponsQuery = `
  SELECT *
  FROM coupons
  WHERE restaurant_id = $1
    AND id NOT IN (
      SELECT coupon_id
      FROM purchased_coupons
      WHERE user_id = $2
    )
  ORDER BY id DESC
  LIMIT $3 OFFSET $4
`;

// 🔢 Συνολικά διαθέσιμα κουπόνια
const fetchAvailableCouponsQueryTotal = `
  SELECT COUNT(*)
  FROM coupons
  WHERE restaurant_id = $1
    AND id NOT IN (
      SELECT coupon_id
      FROM purchased_coupons
      WHERE user_id = $2
    )
`;

// 🧾 4. Εστιατόρια με κουπόνια που έχει αγοράσει ο χρήστης
const fetchRestaurantsWithPurchasedCoupons = `
  SELECT
    r.*,
    json_agg(DISTINCT c.*) AS coupons,
    json_agg(DISTINCT sm.*) AS special_menus
  FROM restaurants r
  JOIN coupons c ON c.restaurant_id = r.id
  JOIN purchased_coupons pc ON pc.coupon_id = c.id
  LEFT JOIN special_menus sm ON sm.restaurant_id = r.id
  WHERE pc.user_id = $1
  GROUP BY r.id
`;

module.exports = {
  fetchUserCouponsQuery,
  getUserCouponsTotal,
  purchaseCouponQuery,
  fetchAvailableCouponsQuery,
  fetchAvailableCouponsQueryTotal,
  fetchRestaurantsWithPurchasedCoupons,
};
