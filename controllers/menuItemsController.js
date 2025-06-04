const jwt = require("jsonwebtoken");
const {
  menuItemSchema,
  updateMenuItemSchema,
} = require("../validators/menuItemsValidator");
const {
  createMenuItemQuery,
  deleteMenuItemQuery,
} = require("../queries/menuItemsQueries");

const { verifyRestaurantOwnership } = require("../queries/restaurantQueries");

const JWT_SECRET = process.env.JWT_SECRET;

const getTokenPayload = (req, res) => {
  const token = req.cookies.token;
  if (!token) {
    console.log("🚨 No token found in cookies");
    res.status(401).json({ message: "Unauthorized - No token found" });
    return null;
  }

  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    console.log("🚨 Invalid token:", err);
    res.clearCookie("token");
    res.status(401).json({ message: "Unauthorized - Invalid token" });
    return null;
  }
};

const createMenuItem = async (req, res, pool) => {
  console.log("🔐 Validating owner identity via token...");
  const decoded = getTokenPayload(req, res);
  if (!decoded) return;

  const { error, value } = menuItemSchema.validate(req.body);
  if (error) {
    return res
      .status(400)
      .json({ message: "Validation failed", details: error.details });
  }

  const { name, price, category, description, discount, restaurant_id } = value;

  try {
    const ownershipResult = await pool.query(verifyRestaurantOwnership, [
      restaurant_id,
      decoded.id,
    ]);
    if (ownershipResult.rowCount === 0) {
      return res
        .status(403)
        .json({ message: "Forbidden - You do not own this restaurant." });
    }

    const { rows } = await pool.query(createMenuItemQuery, [
      name,
      price,
      category,
      description,
      discount,
      restaurant_id,
    ]);

    res.status(201).json({ message: "Menu item created", menu_item: rows[0] });
  } catch (err) {
    console.error("Error creating menu item:", err);
    res.status(500).json({ message: "Failed to create menu item." });
  }
};

const updateMenuItem = async (req, res, pool) => {
  const decoded = getTokenPayload(req, res);
  if (!decoded) return;

  const { id } = req.params;
  const { error, value } = updateMenuItemSchema.validate(req.body);
  if (error) {
    return res
      .status(400)
      .json({ message: "Validation failed", details: error.details });
  }

  const { restaurant_id, ...fieldsToUpdate } = value;

  try {
    const ownership = await pool.query(verifyRestaurantOwnership, [
      restaurant_id,
      decoded.id,
    ]);
    if (ownership.rowCount === 0) {
      return res
        .status(403)
        .json({ message: "Forbidden - You do not own this restaurant." });
    }

    const keys = Object.keys(fieldsToUpdate);
    if (keys.length === 0) {
      return res.status(400).json({ message: "No fields to update." });
    }

    const setClause = keys.map((key, idx) => `${key} = $${idx + 1}`).join(", ");
    const values = Object.values(fieldsToUpdate);
    values.push(id, restaurant_id);

    const query = `
      UPDATE menu_items
      SET ${setClause}
      WHERE id = $${keys.length + 1} AND restaurant_id = $${keys.length + 2}
      RETURNING *;
    `;

    const { rows } = await pool.query(query, values);

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ message: "Menu item not found or not owned" });
    }

    res.status(200).json({ message: "Menu item updated", menu_item: rows[0] });
  } catch (err) {
    console.error("Error updating menu item:", err);
    res.status(500).json({ message: "Failed to update menu item" });
  }
};

const deleteMenuItem = async (req, res, pool) => {
  const decoded = getTokenPayload(req, res);
  if (!decoded) return;

  const { id } = req.params;
  const { restaurant_id } = req.body;

  if (!restaurant_id) {
    return res.status(400).json({ message: "restaurant_id is required" });
  }

  try {
    const ownership = await pool.query(verifyRestaurantOwnership, [
      restaurant_id,
      decoded.id,
    ]);
    if (ownership.rowCount === 0) {
      return res
        .status(403)
        .json({ message: "Forbidden - You do not own this restaurant." });
    }

    const { rowCount } = await pool.query(deleteMenuItemQuery, [
      id,
      restaurant_id,
    ]);
    if (rowCount === 0) {
      return res
        .status(404)
        .json({ message: "Menu item not found or not owned" });
    }

    res.status(200).json({ message: "Menu item deleted successfully" });
  } catch (err) {
    console.error("Error deleting menu item:", err);
    res.status(500).json({ message: "Failed to delete menu item." });
  }
};

module.exports = {
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
};
