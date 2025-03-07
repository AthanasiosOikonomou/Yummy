const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const {
  userSchema,
  loginSchema,
  userUpdateSchema,
} = require("../validators/userValidator");
const {
  getUserByEmail,
  getUserById,
  insertUser,
  updateUser,
} = require("../queries/userQueries");

/**
 * Register a new user
 */
const registerUser = async (req, res, next, pool) => {
  try {
    const { error, value } = userSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });
    const { name, email, password, phone } = value;

    // Check if email already exists
    const existingUser = await pool.query(getUserByEmail, [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert user into database
    const result = await pool.query(insertUser, [
      name,
      email,
      hashedPassword,
      phone,
    ]);
    res
      .status(201)
      .json({ message: "User registered successfully", user: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

/**
 * User login
 */
const loginUser = async (req, res, pool) => {
  const { email, password } = req.body;
  const { error } = loginSchema.validate({ email, password });
  if (error) return res.status(400).json({ error: error.details[0].message });

  try {
    const user = await pool.query(getUserByEmail, [email]);
    if (user.rows.length === 0) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Compare password
    const validPassword = await bcrypt.compare(password, user.rows[0].password);
    if (!validPassword) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.rows[0].id, email: user.rows[0].email },
      process.env.JWT_SECRET,
      { expiresIn: "30m" }
    );
    res.cookie("token", token, { httpOnly: true });
    res.json({
      message: "Login successful",
      user: { id: user.rows[0].id, email: user.rows[0].email },
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Update user details
 */
const updateUserDetails = async (req, res, next, pool) => {
  try {
    const { error, value } = userUpdateSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });
    const { name, email, password, phone } = value;
    const userId = req.user.id;

    // Fetch user
    const userQuery = await pool.query(getUserById, [userId]);
    if (userQuery.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    // Hash password if provided
    let hashedPassword;
    if (password) {
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(password, salt);
    }

    // Construct update fields
    const updateFields = [];
    const updateValues = [];

    if (name)
      updateFields.push(`name = $${updateFields.length + 1}`),
        updateValues.push(name);
    if (email)
      updateFields.push(`email = $${updateFields.length + 1}`),
        updateValues.push(email);
    if (phone)
      updateFields.push(`phone = $${updateFields.length + 1}`),
        updateValues.push(phone);
    if (hashedPassword)
      updateFields.push(`password = $${updateFields.length + 1}`),
        updateValues.push(hashedPassword);
    if (updateFields.length === 0)
      return res
        .status(400)
        .json({ message: "No valid fields provided for update" });

    updateValues.push(userId);
    const result = await pool.query(
      updateUser(updateFields.join(", ")),
      updateValues
    );
    res.json({ message: "User updated successfully", user: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

/**
 * Get user profile
 */
const getUserProfile = async (req, res, pool) => {
  try {
    const userId = req.user.id;
    const userQuery = await pool.query(getUserById, [userId]);
    if (userQuery.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(userQuery.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { registerUser, loginUser, updateUserDetails, getUserProfile };
