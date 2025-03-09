// queries/userQueries.js
const getUserByEmail = "SELECT * FROM users WHERE email = $1";
const getUserById = "SELECT id, name, email, phone FROM users WHERE id = $1";
const insertUser =
  "INSERT INTO users (name, email, password, phone, google_id) VALUES ($1, $2, $3, $4, $5) RETURNING *";
const updateUser = (fields) =>
  `UPDATE users SET ${fields} WHERE id = $${
    fields.split(", ").length + 1
  } RETURNING id, name, email, phone;`;

module.exports = { getUserByEmail, getUserById, insertUser, updateUser };
