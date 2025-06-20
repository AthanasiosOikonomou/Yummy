// queries/restaurantQueries.js
const fetchRestaurantById = `
  SELECT *
  FROM restaurants
  WHERE id = $1
`;

// Fetch menu items for a restaurant
const fetchMenuItemsByRestaurant = `
  SELECT *
  FROM menu_items
  WHERE restaurant_id = $1
`;

// Fetch special menus for a restaurant
const fetchSpecialMenusByRestaurant = `
  SELECT *
  FROM special_menus
  WHERE restaurant_id = $1
`;

// Fetch coupons for a restaurant
const fetchCouponsByRestaurant = `
  SELECT *
  FROM coupons
  WHERE restaurant_id = $1
`;

const fetchTrendingRestaurants = `SELECT 
  r.*,
  (
    SELECT row_to_json(sm)
    FROM special_menus sm
    WHERE sm.restaurant_id = r.id
    ORDER BY sm.id DESC
    LIMIT 1
  ) AS special_menus,
  (
    SELECT row_to_json(c)
    FROM coupons c
    WHERE c.restaurant_id = r.id
    ORDER BY c.id DESC
    LIMIT 1
  ) AS coupons
FROM restaurants r
ORDER BY r.rating DESC
LIMIT $1 OFFSET $2;
`;

const getRestaurantsTotal = `
    SELECT COUNT(*) 
    FROM restaurants
`;
const fetchDiscountedRestaurants = `SELECT 
  sm.*,
  row_to_json(r) AS restaurant
FROM special_menus sm
JOIN restaurants r ON sm.restaurant_id = r.id
ORDER BY sm.created_at DESC
LIMIT $1 OFFSET $2;`;

const totalDiscountedRestaurants = `
  SELECT COUNT(*) AS count
  FROM special_menus
`;

const fetchFilteredRestaurantsBase = `
  SELECT 
    r.*,
    (
      SELECT row_to_json(sm)
      FROM special_menus sm
      WHERE sm.restaurant_id = r.id
      ORDER BY sm.id DESC
      LIMIT 1
    ) AS special_menus,
    (
      SELECT row_to_json(c)
      FROM coupons c
      WHERE c.restaurant_id = r.id
      ORDER BY c.id DESC
      LIMIT 1
    ) AS coupons
  FROM restaurants r
`;


const countFilteredRestaurantsBase = `
  SELECT COUNT(*) AS count
  FROM restaurants
`;

const verifyRestaurantOwnership = `
  SELECT 1 FROM restaurants
  WHERE id = $1 AND owner_id = $2;
`;

module.exports = {
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
  verifyRestaurantOwnership,
};
