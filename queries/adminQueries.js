const createRestaurantQuery = `
  INSERT INTO restaurants (
      name,
      location,
      cuisine,
      address,
      coordinates,
      opening_hours,
      contact,
      owner_id
  )
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
  RETURNING *;
`;

const checkIfAdminExists = `SELECT * FROM admins WHERE email = $1`;

const createAdmin = `INSERT INTO admins (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role`;

const getAdminByEmail = `SELECT * FROM admins WHERE email = $1`;

module.exports = {
  createRestaurantQuery,
  checkIfAdminExists,
  createAdmin,
  getAdminByEmail,
};
