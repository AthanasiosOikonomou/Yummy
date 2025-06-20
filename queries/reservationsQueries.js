// Fetch all reservations for one user
const fetchReservationsByUser = `
  SELECT *
  FROM reservations
  WHERE user_id = $1
  ORDER BY date DESC, time DESC
`;

const fetchFilteredUserReservations = `
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
`;

const countFilteredUserReservations = `
  SELECT COUNT(*) FROM reservations r
`;

const fetchReservationById = `
  SELECT * FROM reservations WHERE id = $1 AND user_id = $2;
`;

const createReservationQuery = `
  WITH 
    special_menu_check AS (
      SELECT restaurant_id AS sm_restaurant_id
      FROM special_menus
      WHERE id = $7
    ),
    coupon_check AS (
      SELECT restaurant_id AS cp_restaurant_id
      FROM coupons
      WHERE id = $8
    )
  INSERT INTO reservations (
  user_id, restaurant_id, date, time, guest_count, status, special_menu_id, coupon_id, reservation_notes
  )
  SELECT $1, $2, $3, $4, $5, $6, $7, $8, $9
  WHERE 
    (
      ($7 IS NULL OR EXISTS (
        SELECT 1 FROM special_menu_check WHERE sm_restaurant_id = $2
      ))
      AND
      ($8 IS NULL OR EXISTS (
        SELECT 1 FROM coupon_check WHERE cp_restaurant_id = $2
      ))
    )
  RETURNING *;
`;

const deleteReservationQuery = `
  DELETE FROM reservations
  WHERE id = $1 AND user_id = $2
  RETURNING id;
`;

const cancelReservationQuery = `
  UPDATE reservations
  SET status = 'cancelled', cancellation_reason = $1
  WHERE id = $2 AND user_id = $3
  RETURNING *;
`;

const patchReservationAsOwnerQuery = `
  UPDATE reservations
  SET
    status = COALESCE($1, status),
    cancellation_reason = COALESCE($2, cancellation_reason)
  WHERE id = $3
  RETURNING *;
`;

const verifyReservationOwnership = `
  SELECT 1
  FROM reservations r
  JOIN restaurants res ON r.restaurant_id = res.id
  WHERE r.id = $1 AND res.owner_id = $2;
`;

const fetchOwnerFilteredReservations = `
  SELECT r.*
  FROM reservations r
  JOIN restaurants res ON r.restaurant_id = res.id
  WHERE res.owner_id = $1
`;

const countOwnerFilteredReservations = `
  SELECT COUNT(*)
  FROM reservations r
  JOIN restaurants res ON r.restaurant_id = res.id
  WHERE res.owner_id = $1
`;

module.exports = {
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
};
