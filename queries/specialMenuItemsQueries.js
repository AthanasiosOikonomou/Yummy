const createSpecialMenuItemQuery = `
  INSERT INTO special_menu_items (special_menu_id, menu_item_id)
  VALUES ($1, $2)
  RETURNING *;
`;

const deleteSpecialMenuItemQuery = `
  DELETE FROM special_menu_items
  WHERE special_menu_id = $1 AND menu_item_id = $2
  RETURNING *;
`;

const verifySpecialMenuOwnership = `
  SELECT 1 FROM restaurants r
  JOIN special_menus sm ON sm.restaurant_id = r.id
  WHERE sm.id = $1 AND r.owner_id = $2;
`;

module.exports = {
  createSpecialMenuItemQuery,
  deleteSpecialMenuItemQuery,
  verifySpecialMenuOwnership,
};
