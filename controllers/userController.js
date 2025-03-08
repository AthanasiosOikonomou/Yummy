const jwt = require("jsonwebtoken");
const passport = require("passport");
const bcrypt = require("bcryptjs");
const { JWT_SECRET, NODE_ENV } = process.env;

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

/** Google Authentication Callback */
const googleAuthCallback = async (req, res, pool) => {
  passport.authenticate(
    "google",
    { failureRedirect: "/", session: false },
    async (err, user) => {
      if (!user) return res.redirect("/");

      const token = jwt.sign(
        { id: user.id, name: user.name, email: user.email },
        JWT_SECRET,
        { expiresIn: "1d" }
      );
      res.cookie("token", token, { httpOnly: true });

      return res.redirect("/");
    }
  )(req, res);
};

/** Check Authentication Status */
const checkAuthStatus = (req, res) => {
  console.log("Checking authentication status..."); // Debug log

  const token = req.cookies.token;
  if (!token) {
    console.log("No token found, user is not logged in.");
    return res.json({ loggedIn: false });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log("User authenticated:", decoded);
    res.json({ loggedIn: true, user: decoded });
  } catch (err) {
    console.log("Invalid token, clearing cookie...");
    res.clearCookie("token");
    res.json({ loggedIn: false });
  }
};

/** Logout */
const logoutUser = (req, res) => {
  res.clearCookie("token");
  res.redirect("/");
};

/**
 * Register a new user
 */
const registerUser = async (req, res, pool) => {
  try {
    const { error, value } = userSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const { name, email, password, phone } = value;

    // ✅ Correctly use `pool.query`
    const existingUser = await pool.query(getUserByEmail, [email]);

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // ✅ Insert user correctly
    const result = await pool.query(insertUser, [
      name,
      email,
      hashedPassword,
      phone,
    ]);

    res.status(201).json({
      message: "User registered successfully",
      user: result.rows[0],
    });
  } catch (err) {
    console.error("Error in registerUser:", err);
    res.status(500).json({ message: "Internal Server Error" });
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
      JWT_SECRET,
      { expiresIn: "30m" }
    );
    res.cookie("token", token, {
      httpOnly: true,
      secure: NODE_ENV === "production",
      path: "/",
      sameSite: "Lax",
      maxAge: 24 * 60 * 60 * 1000, // 1 day in milliseconds
    });

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
const updateUserDetails = async (req, res, pool) => {
  try {
    console.log("🔍 Checking authentication via cookies...");

    // ✅ Extract JWT token from cookies
    const token = req.cookies.token;
    if (!token) {
      console.log("🚨 No token found in cookies");
      return res.status(401).json({ message: "Unauthorized - No token found" });
    }

    // ✅ Verify token and decode user data
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      console.log("🚨 Invalid token:", err);
      res.clearCookie("token"); // Clear corrupted token
      return res.status(401).json({ message: "Unauthorized - Invalid token" });
    }

    console.log("✅ Decoded user:", decoded);
    const userId = decoded.id;

    // ✅ Validate input
    const { error, value } = userUpdateSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const { name, email, password, phone } = value;

    // ✅ Fetch user from database
    const userQuery = await pool.query(getUserById, [userId]);
    if (userQuery.rows.length === 0) {
      console.log("🚨 User not found in database");
      return res.status(404).json({ message: "User not found" });
    }

    console.log("✅ User found:", userQuery.rows[0]);

    // ✅ Hash password if provided
    let hashedPassword;
    if (password) {
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(password, salt);
    }

    // ✅ Construct update fields dynamically
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

    if (updateFields.length === 0) {
      return res
        .status(400)
        .json({ message: "No valid fields provided for update" });
    }

    updateValues.push(userId);

    // ✅ Update user in database
    const result = await pool.query(
      updateUser(updateFields.join(", ")),
      updateValues
    );

    console.log("✅ User updated successfully:", result.rows[0]);
    res.json({ message: "User updated successfully", user: result.rows[0] });
  } catch (err) {
    console.error("❌ Error in updateUserDetails:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Get user profile
 */
const getUserProfile = async (req, res, pool) => {
  try {
    console.log("🔍 Checking authentication via cookies...");

    // ✅ Extract JWT token from cookies
    const token = req.cookies.token;
    if (!token) {
      console.log("🚨 No token found in cookies");
      return res.status(401).json({ message: "Unauthorized - No token found" });
    }

    // ✅ Verify token and decode user data
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      console.log("🚨 Invalid token:", err);
      res.clearCookie("token"); // Clear corrupted token
      return res.status(401).json({ message: "Unauthorized - Invalid token" });
    }

    console.log("✅ Decoded user:", decoded);

    // ✅ Fetch user from database using decoded ID
    const userQuery = await pool.query(getUserById, [decoded.id]);
    if (userQuery.rows.length === 0) {
      console.log("🚨 User not found in database");
      return res.status(404).json({ message: "User not found" });
    }

    console.log("✅ User found:", userQuery.rows[0]);
    res.json(userQuery.rows[0]);
  } catch (error) {
    console.error("❌ Error in getUserProfile:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  registerUser,
  loginUser,
  updateUserDetails,
  getUserProfile,
  googleAuthCallback,
  checkAuthStatus,
  logoutUser,
};
