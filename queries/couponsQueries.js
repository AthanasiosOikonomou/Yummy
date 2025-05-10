const fetchUserCouponsQuery = `
    SELECT c.*
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
    );
`;

module.exports = {
  fetchUserCouponsQuery,
  purchaseCouponQuery,
  fetchAvailableCouponsQuery,
};
