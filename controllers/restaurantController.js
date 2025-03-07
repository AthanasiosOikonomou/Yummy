// controllers/restaurantController.js

// Importing validation schemas and database queries
const {
  createRestaurantSchema,
  updateRestaurantSchema,
} = require("../validators/restaurantValidator");
const {
  insertRestaurant,
  getRestaurantById,
  getRestaurants,
  deleteRestaurant,
  checkRestaurantOwnership,
  updateRestaurant,
} = require("../queries/restaurantQueries");

// This function handles restaurant creation, including validation and ownership assignment.
const createRestaurant = async (req, res, next, pool) => {
  try {
    const { error, value } = createRestaurantSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const { name, location, lat, lng, cuisine } = value;
    const ownerId = req.user.id;

    // Insert new restaurant into the database
    const result = await pool.query(insertRestaurant, [
      name,
      location,
      lng,
      lat,
      cuisine,
      ownerId,
    ]);
    res
      .status(201)
      .json({
        message: "Restaurant created successfully",
        restaurant: result.rows[0],
      });
  } catch (err) {
    next(err);
  }
};

// This function allows an owner to update restaurant details, ensuring only authorized changes.
const updateRestaurantDetails = async (req, res, next, pool) => {
  try {
    const { error, value } = updateRestaurantSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const restaurantId = req.params.id;
    const checkResult = await pool.query(checkRestaurantOwnership, [
      restaurantId,
      req.user.id,
    ]);
    if (checkResult.rows.length === 0)
      return res
        .status(404)
        .json({ message: "Restaurant not found or not authorized" });

    let updateFields = [];
    let updateValues = [];
    let idx = 1;

    if (value.name) {
      updateFields.push(`name = $${idx++}`);
      updateValues.push(value.name);
    }
    if (value.location) {
      updateFields.push(`location = $${idx++}`);
      updateValues.push(value.location);
    }

    // Update latitude and longitude as a geospatial point
    if (value.lat !== undefined && value.lng !== undefined) {
      updateFields.push(
        `location_cords = ST_SetSRID(ST_MakePoint($${idx++}, $${idx++}), 4326)`
      );
      updateValues.push(value.lng, value.lat);
    }

    if (value.cuisine) {
      updateFields.push(`cuisine = $${idx++}`);
      updateValues.push(value.cuisine);
    }

    updateValues.push(restaurantId, req.user.id);

    // Execute update query
    const result = await pool.query(
      updateRestaurant(updateFields.join(", ")),
      updateValues
    );
    res.json({
      message: "Restaurant updated successfully",
      restaurant: result.rows[0],
    });
  } catch (err) {
    next(err);
  }
};

// This function handles restaurant deletion, ensuring only the owner can delete it.
const deleteRestaurantById = async (req, res, next, pool) => {
  try {
    const restaurantId = req.params.id;
    const checkResult = await pool.query(checkRestaurantOwnership, [
      restaurantId,
      req.user.id,
    ]);
    if (checkResult.rows.length === 0)
      return res
        .status(404)
        .json({ message: "Restaurant not found or not authorized" });

    await pool.query(deleteRestaurant, [restaurantId, req.user.id]);
    res.json({ message: "Restaurant deleted successfully" });
  } catch (err) {
    next(err);
  }
};

// Fetches a specific restaurant by ID.
const getRestaurant = async (req, res, pool) => {
  try {
    const { id } = req.params;
    const restaurant = await pool.query(getRestaurantById, [id]);
    if (restaurant.rows.length === 0)
      return res.status(404).json({ message: "Restaurant not found" });

    res.json(restaurant.rows[0]);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Retrieves all restaurants from the database.
const getAllRestaurants = async (req, res, pool) => {
  try {
    const result = await pool.query(getRestaurants);
    res.json({ restaurants: result.rows });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  createRestaurant,
  updateRestaurantDetails,
  deleteRestaurantById,
  getRestaurant,
  getAllRestaurants,
};
