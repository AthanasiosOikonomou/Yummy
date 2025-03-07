// queries/ownerQueries.js
const getOwnerByEmail = "SELECT * FROM owners WHERE email = $1";
const getOwnerById = "SELECT id, name, email, phone FROM owners WHERE id = $1";
const insertOwner = `INSERT INTO owners (name, email, password, phone) VALUES ($1, $2, $3, $4) RETURNING id, name, email;`;
const updateOwner = (fields) =>
  `UPDATE owners SET ${fields} WHERE id = $${
    fields.split(", ").length + 1
  } RETURNING id, name, email, phone;`;

module.exports = { getOwnerByEmail, getOwnerById, insertOwner, updateOwner };
