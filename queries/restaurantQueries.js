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

const fetchTrendingRestaurants = `SELECT *
     FROM restaurants
     ORDER BY rating DESC
     LIMIT $1 OFFSET $2`;

const getRestaurantsTotal = `
    SELECT COUNT(*) 
    FROM restaurants
`;
const fetchDiscountedRestaurants = `SELECT r.*
     FROM restaurants r
     JOIN restaurant_happy_hours hh
       ON r.id = hh.restaurant_id
     GROUP BY r.id
     ORDER BY r.rating DESC
     LIMIT $1 OFFSET $2`;

const totalDiscountedRestaurants = `SELECT
  COUNT(DISTINCT restaurant_id) AS restaurants_with_happy_hours
FROM restaurant_happy_hours
`;

const fetchFilteredRestaurantsBase = `
  SELECT *
  FROM restaurants
`;

const countFilteredRestaurantsBase = `
  SELECT COUNT(*) AS count
  FROM restaurants
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
};
