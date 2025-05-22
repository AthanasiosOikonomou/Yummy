// controllers/restaurantController.js

const {
  fetchRestaurantById,
  fetchMenuItemsByRestaurant,
  fetchSpecialMenusByRestaurant,
  fetchCouponsByRestaurant,
  fetchTrendingRestaurants,
  getRestaurantsTotal,
  fetchDiscountedRestaurants,
  totalDiscountedRestaurants,
  fetchFilteredRestaurantsBase,
  countFilteredRestaurantsBase,
} = require("../queries/restaurantQueries");

const getTrendingRestaurants = async (req, res, pool) => {
  const page = parseInt(req.query.page, 10) || 1;
  const pageSize = parseInt(req.query.limit, 10) || 10;

  const offset = (page - 1) * pageSize;
  const limit = pageSize;

  try {
    const trendingRestaurants = await pool.query(fetchTrendingRestaurants, [
      limit,
      offset,
    ]);

    const allTrendingRestaurants = trendingRestaurants.rows;

    if (allTrendingRestaurants.length === 0) {
      return res.status(404).json({ error: "Not trending restaurants found." });
    }

    const countResult = await pool.query(getRestaurantsTotal);
    const totalCount = parseInt(countResult.rows[0].count, 10);

    // Calculate pagination information
    const currentPage = page;
    const recordsOnCurrentPage = allTrendingRestaurants.length; // This will be pageSize or less if it's the last page
    const viewedRecords = (currentPage - 1) * pageSize + recordsOnCurrentPage;
    const remainingRecords = totalCount - viewedRecords;

    res.json({
      allTrendingRestaurants,
      Pagination: {
        currentPage: currentPage,
        recordsOnCurrentPage: recordsOnCurrentPage,
        viewedRecords: viewedRecords,
        remainingRecords: remainingRecords,
        total: totalCount,
      },
    });
  } catch (err) {
    console.error("Error fetching testimonials:", err);
    res.status(500).json({ message: "Failed to load testimonials." });
  }
};

const getDiscountedRestaurants = async (req, res, pool) => {
  const page = parseInt(req.query.page, 10) || 1;
  const pageSize = parseInt(req.query.limit, 10) || 10;

  const offset = (page - 1) * pageSize;
  const limit = pageSize;

  try {
    const discountedRestaurants = await pool.query(fetchDiscountedRestaurants, [
      limit,
      offset,
    ]);

    const allDiscountedRestaurants = discountedRestaurants.rows;

    if (allDiscountedRestaurants.length === 0) {
      return res
        .status(404)
        .json({ error: "No restaurants with discounts found." });
    }

    const countResult = await pool.query(totalDiscountedRestaurants);
    const totalCount = parseInt(countResult.rows[0].count, 10);

    // Calculate pagination information
    const currentPage = page;
    const recordsOnCurrentPage = allDiscountedRestaurants.length; // This will be pageSize or less if it's the last page
    const viewedRecords = (currentPage - 1) * pageSize + recordsOnCurrentPage;
    const remainingRecords = totalCount - viewedRecords;

    res.json({
      allDiscountedRestaurants,
      Pagination: {
        currentPage: currentPage,
        recordsOnCurrentPage: recordsOnCurrentPage,
        viewedRecords: viewedRecords,
        remainingRecords: remainingRecords,
        total: totalCount,
      },
    });
  } catch (err) {
    console.error("Error fetching discounted restaurants:", err);
    res.status(500).json({ message: "Failed to load discounted restaurants." });
  }
};

const getFilteredRestaurants = async (req, res, pool) => {
  // 1) Parse pagination
  const page = parseInt(req.query.page, 10) || 1;
  const pageSize = parseInt(req.query.limit, 10) || 10;
  const offset = (page - 1) * pageSize;
  const limit = pageSize;

  // 2) Build dynamic WHERE clause
  const filters = [];
  const values = [];
  let idx = 1;

  if (req.query.cuisine) {
    filters.push(`cuisine ILIKE $${idx}`);
    values.push(`%${req.query.cuisine}%`);
    idx++;
  }

  if (req.query.rating) {
    const rating = parseFloat(req.query.rating);
    if (!isNaN(rating) && rating >= 1.0 && rating <= 5.0) {
      filters.push(`rating >= $${idx}`);
      values.push(rating);
      idx++;
    }
  }

  if (req.query.location) {
    filters.push(`location ILIKE $${idx}`);
    values.push(`%${req.query.location}%`);
    idx++;
  }
  if (req.query.guests) {
    filters.push(`total_tables >= $${idx}`);
    values.push(parseInt(req.query.guests, 10));
    idx++;
  }

  if (req.query.name) {
    filters.push(`name ILIKE $${idx}`);
    values.push(`%${req.query.name}%`);
    idx++;
  }

  const whereClause = filters.length ? ` WHERE ${filters.join(" AND ")}` : "";

  try {
    // 3) Fetch the page of data
    const dataQuery = `
      ${fetchFilteredRestaurantsBase}
      ${whereClause}
      ORDER BY name
      LIMIT $${idx} OFFSET $${idx + 1}
    `;
    values.push(limit, offset);

    const { rows: restaurants } = await pool.query(dataQuery, values);

    if (!restaurants.length) {
      return res
        .status(404)
        .json({ error: "No restaurants found matching filters." });
    }

    // 4) Fetch the total count
    const countQuery = `
      ${countFilteredRestaurantsBase}
      ${whereClause}
    `;
    // count uses only the filter params (not limit/offset)
    const countValues = values.slice(0, idx - 1);
    const { rows: countRows } = await pool.query(countQuery, countValues);
    const totalCount = parseInt(countRows[0].count, 10);

    // 5) Build pagination metadata
    const currentPage = page;
    const recordsOnCurrentPage = restaurants.length;
    const viewedRecords = (currentPage - 1) * pageSize + recordsOnCurrentPage;
    const remainingRecords = totalCount - viewedRecords;

    // 6) Send response
    res.json({
      restaurants,
      Pagination: {
        currentPage,
        recordsOnCurrentPage,
        viewedRecords,
        remainingRecords,
        total: totalCount,
      },
    });
  } catch (err) {
    console.error("Error fetching filtered restaurants:", err);
    res.status(500).json({ message: "Failed to load restaurants." });
  }
};

const getRestaurantById = async (req, res, pool) => {
  const { id } = req.params;

  try {
    // 1) Core restaurant data
    const restRes = await pool.query(fetchRestaurantById, [id]);
    if (restRes.rows.length === 0) {
      return res.status(404).json({ error: "Restaurant not found." });
    }
    const restaurant = restRes.rows[0];

    // 2) Related data
    const [menuRes, specialRes, couponRes] = await Promise.all([
      pool.query(fetchMenuItemsByRestaurant, [id]),
      pool.query(fetchSpecialMenusByRestaurant, [id]),
      pool.query(fetchCouponsByRestaurant, [id]),
    ]);

    // 3) Assemble and respond
    res.json({
      restaurant,
      menuItems: menuRes.rows,
      specialMenus: specialRes.rows,
      coupons: couponRes.rows,
    });
  } catch (err) {
    console.error("Error fetching restaurant details:", err);
    res.status(500).json({ message: "Failed to load restaurant details." });
  }
};

module.exports = {
  getTrendingRestaurants,
  getDiscountedRestaurants,
  getFilteredRestaurants,
  getRestaurantById,
};
