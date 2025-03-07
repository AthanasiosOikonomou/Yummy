// controllers/ownerController.js

// Importing bcrypt for password hashing
const bcrypt = require("bcryptjs"); // Used for securely hashing passwords before storing them in the database.

// Importing jwt for authentication
const jwt = require("jsonwebtoken"); // Used for generating JWT tokens to authenticate users.

// Importing validation schemas and database queries
const {
  ownerSchema,
  loginSchema,
  ownerUpdateSchema,
} = require("../validators/ownerValidator");
const {
  getOwnerByEmail,
  getOwnerById,
  insertOwner,
  updateOwner,
} = require("../queries/ownerQueries");

// Handles owner registration, including validation, checking for existing users, and hashing passwords.
const registerOwner = async (req, res, next, pool) => {
  try {
    const { error, value } = ownerSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });
    const { name, email, password, phone } = value;

    // Check if owner already exists
    const existingOwner = await pool.query(getOwnerByEmail, [email]);
    if (existingOwner.rows.length > 0)
      return res.status(400).json({ message: "Owner already exists" });

    // Hash the password before storing
    const hashedPassword = await bcrypt.hash(password, 10); // Hashes the password with a salt round of 10 for security before storing it.
    const result = await pool.query(insertOwner, [
      name,
      email,
      hashedPassword,
      phone,
    ]);

    res
      .status(201)
      .json({
        message: "Owner registered successfully",
        owner: result.rows[0],
      });
  } catch (err) {
    next(err);
  }
};

// Handles owner auth by verifying cred and issuing JWT.
const loginOwner = async (req, res, pool) => {
  try {
    const { email, password } = req.body;
    const { error } = loginSchema.validate({ email, password });

    if (error) return res.status(400).json({ error: error.details[0].message });

    // Retrieve owner details
    const owner = await pool.query(getOwnerByEmail, [email]);

    if (
      owner.rows.length === 0 ||
      !(await bcrypt.compare(password, owner.rows[0].password))
    ) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Generate a JWT token
    const token = jwt.sign(
      { id: owner.rows[0].id, email: owner.rows[0].email },
      process.env.JWT_SECRET,
      { expiresIn: "30m" }
    ); // Creates a JWT token that expires in 30 minutes to limit session duration.

    res
      .cookie("token", token, { httpOnly: true })
      .json({
        message: "Login successful",
        owner: { id: owner.rows[0].id, email: owner.rows[0].email },
      }); // The 'httpOnly' flag prevents JavaScript access to the token, enhancing security.
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Allows an auth owner to update their details.
const updateOwnerDetails = async (req, res, next, pool) => {
  try {
    const { error, value } = ownerUpdateSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const { name, email, password, phone } = value;
    const ownerId = req.user.id;
    const ownerQuery = await pool.query(getOwnerById, [ownerId]);

    if (ownerQuery.rows.length === 0)
      return res.status(404).json({ message: "Owner not found" });

    let updateFields = [];
    let updateValues = [];

    if (name) {
      updateFields.push("name = $" + (updateFields.length + 1));
      updateValues.push(name);
    }
    if (email) {
      updateFields.push("email = $" + (updateFields.length + 1));
      updateValues.push(email);
    }
    if (phone) {
      updateFields.push("phone = $" + (updateFields.length + 1));
      updateValues.push(phone);
    }
    if (password) {
      updateFields.push("password = $" + (updateFields.length + 1));
      updateValues.push(await bcrypt.hash(password, 10));
    }

    if (updateFields.length === 0)
      return res
        .status(400)
        .json({ message: "No valid fields provided for update" });

    updateValues.push(ownerId);
    const result = await pool.query(
      updateOwner(updateFields.join(", ")),
      updateValues
    ); // Ensures that dynamic query construction does not introduce SQL injection vulnerabilities.

    res.json({ message: "Owner updated successfully", owner: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

// Retrieves the profile details of the auth owner.
const getOwnerProfile = async (req, res, pool) => {
  try {
    const ownerId = req.user.id;
    const ownerQuery = await pool.query(getOwnerById, [ownerId]);
    if (ownerQuery.rows.length === 0)
      return res.status(404).json({ message: "Owner not found" });
    res.json(ownerQuery.rows[0]);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  registerOwner,
  loginOwner,
  updateOwnerDetails,
  getOwnerProfile,
};
