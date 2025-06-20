const createMenuItemQuery = `
  INSERT INTO menu_items (name, price, category, description, discount, restaurant_id)
  VALUES ($1, $2, $3, $4, $5, $6)
  RETURNING *;
`;

const deleteMenuItemQuery = `
  DELETE FROM menu_items
  WHERE id = $1 AND restaurant_id = $2;
`;

module.exports = {
  createMenuItemQuery,
  deleteMenuItemQuery,
};
