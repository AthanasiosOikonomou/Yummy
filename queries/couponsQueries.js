const fetchUserCouponsQuery = `
    SELECT c.*
    FROM purchased_coupons pc
    JOIN coupons c ON pc.coupon_id = c.id
    WHERE pc.user_id = $1
    LIMIT $2 OFFSET $3
  `;

const getUserCouponsTotal = `
    SELECT COUNT(*) 
    FROM purchased_coupons pc
    JOIN coupons c ON pc.coupon_id = c.id
    WHERE pc.user_id = $1
`;

const purchaseCouponQuery = `
  INSERT INTO purchased_coupons (user_id, coupon_id, purchased_at)
  VALUES ($1, $2, NOW())
  RETURNING *;
`;

const fetchAvailableCouponsQuery = `
  SELECT *
  FROM coupons c
  WHERE c.restaurant_id = $1
    AND c.id NOT IN (
      SELECT coupon_id
      FROM purchased_coupons
      WHERE user_id = $2
      LIMIT $3 OFFSET $4
    );
 
`;

const fetchAvailableCouponsQueryTotal = `
  SELECT COUNT(*) 
  FROM coupons c
  WHERE c.restaurant_id = $1
    AND c.id NOT IN (
      SELECT coupon_id
      FROM purchased_coupons
      WHERE user_id = $2
    );
`;

const fetchRestaurantsWithPurchasedCoupons = `SELECT
  r.*,
  json_agg(DISTINCT c.*) AS coupons,
  json_agg(DISTINCT sm.*) AS special_menus
FROM restaurants r
JOIN coupons c ON c.restaurant_id = r.id
JOIN purchased_coupons upc ON upc.coupon_id = c.id
LEFT JOIN special_menus sm ON sm.restaurant_id = r.id
WHERE upc.user_id = $1
GROUP BY r.id;

`;

module.exports = {
  fetchUserCouponsQuery,
  purchaseCouponQuery,
  fetchAvailableCouponsQuery,
  fetchRestaurantsWithPurchasedCoupons,
  getUserCouponsTotal,
  fetchAvailableCouponsQueryTotal,
};
