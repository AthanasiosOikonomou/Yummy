const jwt = require("jsonwebtoken");
const {
  createSpecialMenuItemSchema,
  deleteSpecialMenuItemSchema,
} = require("../validators/specialMenuItemsValidator");
const {
  createSpecialMenuItemQuery,
  deleteSpecialMenuItemQuery,
  verifySpecialMenuOwnership,
} = require("../queries/specialMenuItemsQueries");

const JWT_SECRET = process.env.JWT_SECRET;

const createSpecialMenuItem = async (req, res, pool) => {
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

  const { error, value } = createSpecialMenuItemSchema.validate(req.body);
  if (error)
    return res
      .status(400)
      .json({ message: "Validation failed", details: error.details });

  const { special_menu_id, menu_item_id } = value;

  try {
    // Verify ownership of special_menu
    const ownerCheck = await pool.query(verifySpecialMenuOwnership, [
      special_menu_id,
      decoded.id,
    ]);
    if (ownerCheck.rowCount === 0)
      return res
        .status(403)
        .json({ message: "Forbidden - You do not own this restaurant" });

    // Insert the new link
    const { rows } = await pool.query(createSpecialMenuItemQuery, [
      special_menu_id,
      menu_item_id,
    ]);

    res
      .status(201)
      .json({ message: "Menu item added to special menu", link: rows[0] });
  } catch (err) {
    console.error("❌ Error creating special_menu_item link:", err);
    res
      .status(500)
      .json({ message: "Failed to add menu item to special menu." });
  }
};

const deleteSpecialMenuItem = async (req, res, pool) => {
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

  const { special_menu_id, menu_item_id } = req.body;
  const { error } = deleteSpecialMenuItemSchema.validate({
    special_menu_id,
    menu_item_id,
  });
  if (error)
    return res
      .status(400)
      .json({ message: "Validation failed", details: error.details });

  try {
    const ownerCheck = await pool.query(verifySpecialMenuOwnership, [
      special_menu_id,
      decoded.id,
    ]);
    console.log(special_menu_id);
    console.log(decoded.id);
    if (ownerCheck.rowCount === 0)
      return res
        .status(403)
        .json({ message: "Forbidden - You do not own this restaurant" });

    const { rows } = await pool.query(deleteSpecialMenuItemQuery, [
      special_menu_id,
      menu_item_id,
    ]);
    if (rows.length === 0)
      return res.status(404).json({ message: "Link not found." });

    res.status(200).json({
      message: "Menu item removed from special menu",
      deleted: rows[0],
    });
  } catch (err) {
    console.error("❌ Error deleting special_menu_item link:", err);
    res
      .status(500)
      .json({ message: "Failed to remove menu item from special menu." });
  }
};

module.exports = {
  createSpecialMenuItem,
  deleteSpecialMenuItem,
};
