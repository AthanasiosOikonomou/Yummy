// queries/restaurantQueries.js
const insertRestaurant = `INSERT INTO restaurants (name, location, location_cords, cuisine, owner_id) VALUES ($1, $2, ST_SetSRID(ST_MakePoint($3, $4), 4326), $5, $6) RETURNING *`;
const getRestaurantById = "SELECT * FROM restaurants WHERE id = $1";
const getRestaurants = "SELECT * FROM restaurants WHERE 1=1";
const deleteRestaurant =
  "DELETE FROM restaurants WHERE id = $1 AND owner_id = $2";
const checkRestaurantOwnership =
  "SELECT * FROM restaurants WHERE id = $1 AND owner_id = $2";
const updateRestaurant = (fields) =>
  `UPDATE restaurants SET ${fields} WHERE id = $${
    fields.split(", ").length + 1
  } AND owner_id = $${fields.split(", ").length + 2} RETURNING *`;

module.exports = {
  insertRestaurant,
  getRestaurantById,
  getRestaurants,
  deleteRestaurant,
  checkRestaurantOwnership,
  updateRestaurant,
};
