// queries/userQueries.js
const getUserByEmail = "SELECT * FROM users WHERE email = $1";

const getUserById = "SELECT id, name, email, phone FROM users WHERE id = $1";

const confirmUser = "UPDATE users SET confirmed_user = true WHERE id = $1";

const insertUser =
  "INSERT INTO users (name, email, password, phone, role, google_id, facebook_id, newsletter_subscribed, profile_image) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *";

const updateUser = (fields) =>
  `UPDATE users SET ${fields} WHERE id = $${
    fields.split(", ").length + 1
  } RETURNING id, name, email, phone, google_id, facebook_id;`;

const fetchUserPoints = "SELECT loyalty_points FROM users WHERE id = $1";

const getUserFavorites = `
    SELECT r.*
    FROM user_favorite_restaurants f
    JOIN restaurants r ON f.restaurant_id = r.id
    WHERE f.user_id = $1
    LIMIT $2 OFFSET $3
  `;

const checkFavorites =
  "SELECT * FROM user_favorite_restaurants WHERE user_id = $1 AND restaurant_id = $2";

const deleteFavorite = `DELETE FROM user_favorite_restaurants WHERE user_id = $1 AND restaurant_id = $2`;

const addFavorite = `INSERT INTO user_favorite_restaurants (user_id, restaurant_id) VALUES ($1, $2)`;

const getUserFavoritesCount = `
  SELECT COUNT(*) 
  FROM user_favorite_restaurants 
  WHERE user_id = $1
`;

const getConfirmedUserStatus = "SELECT confirmed_user FROM users WHERE id = $1";

module.exports = {
  getUserByEmail,
  getUserById,
  insertUser,
  updateUser,
  confirmUser,
  fetchUserPoints,
  getUserFavorites,
  checkFavorites,
  deleteFavorite,
  addFavorite,
  getUserFavoritesCount,
  getConfirmedUserStatus,
};
