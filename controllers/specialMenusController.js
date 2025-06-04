const jwt = require("jsonwebtoken");
const {
  createSpecialMenuSchema,
  updateSpecialMenuSchema,
  deleteSpecialMenuSchema,
} = require("../validators/specialMenusValidator");
const {
  createSpecialMenuQuery,
  deleteSpecialMenuQuery,
  verifyRestaurantOwnership,
} = require("../queries/specialMenusQueries");

const JWT_SECRET = process.env.JWT_SECRET;

const createSpecialMenu = async (req, res, pool) => {
  const token = req.cookies.token;
  if (!token)
    return res.status(401).json({ message: "Unauthorized - No token" });

  let decoded;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch {
    res.clearCookie("token");
    return res.status(401).json({ message: "Unauthorized - Invalid token" });
  }

  const { error, value } = createSpecialMenuSchema.validate(req.body);
  if (error)
    return res
      .status(400)
      .json({ message: "Validation failed", details: error.details });

  const { restaurant_id } = value;

  try {
    const ownerCheck = await pool.query(verifyRestaurantOwnership, [
      restaurant_id,
      decoded.id,
    ]);
    if (ownerCheck.rowCount === 0)
      return res.status(403).json({ message: "Forbidden - Not owner" });

    const { rows } = await pool.query(createSpecialMenuQuery, [
      value.name,
      value.description,
      value.original_price,
      value.discounted_price,
      value.discount_percentage,
      value.photo_url,
      restaurant_id,
      value.availability,
    ]);

    res
      .status(201)
      .json({ message: "Special menu created", specialMenu: rows[0] });
  } catch (err) {
    console.error("❌ Error creating special menu:", err);
    res.status(500).json({ message: "Failed to create special menu." });
  }
};

const updateSpecialMenu = async (req, res, pool) => {
  const token = req.cookies.token;
  if (!token)
    return res.status(401).json({ message: "Unauthorized - No token" });

  let decoded;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch {
    res.clearCookie("token");
    return res.status(401).json({ message: "Unauthorized - Invalid token" });
  }

  const { id } = req.params;
  const { error, value } = updateSpecialMenuSchema.validate(req.body);
  if (error)
    return res
      .status(400)
      .json({ message: "Validation failed", details: error.details });

  const { restaurant_id } = value;

  try {
    const ownerCheck = await pool.query(verifyRestaurantOwnership, [
      restaurant_id,
      decoded.id,
    ]);
    if (ownerCheck.rowCount === 0)
      return res.status(403).json({ message: "Forbidden - Not owner" });

    const fields = Object.keys(value).filter((f) => f !== "restaurant_id");
    const setClause = fields.map((key, i) => `${key} = $${i + 1}`).join(", ");
    const values = fields.map((key) => value[key]);

    const query = `
      UPDATE special_menus
      SET ${setClause}, updated_at = NOW()
      WHERE id = $${fields.length + 1}
      RETURNING *;
    `;

    const { rows } = await pool.query(query, [...values, id]);

    res
      .status(200)
      .json({ message: "Special menu updated", specialMenu: rows[0] });
  } catch (err) {
    console.error("❌ Error updating special menu:", err);
    res.status(500).json({ message: "Failed to update special menu." });
  }
};

const deleteSpecialMenu = async (req, res, pool) => {
  const token = req.cookies.token;
  if (!token)
    return res.status(401).json({ message: "Unauthorized - No token" });

  let decoded;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch {
    res.clearCookie("token");
    return res.status(401).json({ message: "Unauthorized - Invalid token" });
  }

  const { id } = req.params;
  const { error, value } = deleteSpecialMenuSchema.validate(req.body);
  if (error)
    return res
      .status(400)
      .json({ message: "Validation failed", details: error.details });

  const { restaurant_id } = value;

  try {
    const ownerCheck = await pool.query(verifyRestaurantOwnership, [
      restaurant_id,
      decoded.id,
    ]);
    if (ownerCheck.rowCount === 0)
      return res.status(403).json({ message: "Forbidden - Not owner" });

    const { rows } = await pool.query(deleteSpecialMenuQuery, [id]);
    if (rows.length === 0)
      return res.status(404).json({ message: "Special menu not found." });

    res.status(200).json({ message: "Special menu deleted", deleted: rows[0] });
  } catch (err) {
    console.error("❌ Error deleting special menu:", err);
    res.status(500).json({ message: "Failed to delete special menu." });
  }
};

module.exports = {
  createSpecialMenu,
  updateSpecialMenu,
  deleteSpecialMenu,
};
