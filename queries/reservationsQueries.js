// Fetch all reservations for one user
const fetchReservationsByUser = `
  SELECT *
  FROM reservations
  WHERE user_id = $1
  ORDER BY date DESC, time DESC
`;

const fetchReservationById = `
  SELECT *
  FROM reservations
  WHERE id = $1
`;

const createReservationQuery = `
  INSERT INTO reservations
    (user_id, restaurant_id, date, time, guest_count, status, special_menu_id, coupon_id)
  VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
  RETURNING *;
`;

const deleteReservationQuery = `
  DELETE FROM reservations
  WHERE id = $1
  RETURNING id;
`;

module.exports = {
  fetchReservationsByUser,
  fetchReservationById,
  createReservationQuery,
  deleteReservationQuery,
};
