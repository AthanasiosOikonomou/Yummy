const updateRestaurant = `UPDATE restaurants
SET
  name = $1,
  location = $2,
  cuisine = $3,
  rating = $4,
  address = $5,
  coordinates = $6,
  opening_hours = $7,
  contact = $8,
  owner_id = $9,
  updated_at = NOW()
WHERE id = $10
RETURNING *;
`;
