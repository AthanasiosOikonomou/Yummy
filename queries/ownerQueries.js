const getOwnerByEmail = "SELECT * FROM owners WHERE email = $1";

const insertOwner =
  "INSERT INTO owners (name, email, password, phone, role, google_id, facebook_id, newsletter_subscribed, profile_image) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *";

const insertPasswordResetOwner =
  "INSERT INTO password_resets_owners (owner_id, token, expires_at) VALUES ($1, $2, $3) RETURNING *";

const updateOwnerPassword = `UPDATE owners SET password = $1 WHERE id = $2
  RETURNING id, name, email`;

const getOwnerById = "SELECT id, name, email, phone FROM owners WHERE id = $1";

const updateOwner = (fields) =>
  `UPDATE owners SET ${fields} WHERE id = $${
    fields.split(", ").length + 1
  } RETURNING id, name, email, phone, google_id, facebook_id;`;

module.exports = {
  getOwnerByEmail,
  insertOwner,
  insertPasswordResetOwner,
  updateOwnerPassword,
  getOwnerById,
  updateOwner,
};
