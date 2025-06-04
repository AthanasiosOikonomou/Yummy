// Fetch all reservations for one user
const fetchReservationsByUser = `
  SELECT *
  FROM reservations
  WHERE user_id = $1
  ORDER BY date DESC, time DESC
`;

const fetchFilteredUserReservations = `
    SELECT *
    FROM reservations
  `;

const countFilteredUserReservations = `
    SELECT COUNT(*) AS count
    FROM reservations
  `;

const fetchReservationById = `
  SELECT *
  FROM reservations
  WHERE id = $1
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
    user_id, restaurant_id, date, time, guest_count, status, special_menu_id, coupon_id
  )
  SELECT $1, $2, $3, $4, $5, $6, $7, $8
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
  WHERE id = $1
  RETURNING id;
`;

const cancelReservationQuery = `UPDATE reservations
SET status = $1
WHERE id = $2
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
