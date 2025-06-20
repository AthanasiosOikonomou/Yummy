const createSpecialMenuQuery = `
  INSERT INTO special_menus (
    name, description, original_price, discounted_price,
    discount_percentage, photo_url, restaurant_id, availability
  )
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
  RETURNING *;
`;

const deleteSpecialMenuQuery = `
  DELETE FROM special_menus
  WHERE id = $1
  RETURNING *;
`;

const verifyRestaurantOwnership = `
  SELECT 1 FROM restaurants
  WHERE id = $1 AND owner_id = $2;
`;

module.exports = {
  createSpecialMenuQuery,
  deleteSpecialMenuQuery,
  verifyRestaurantOwnership,
};
