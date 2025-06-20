require("dotenv").config();

const {
  sendVerificationEmail,
  sendResetPasswordEmail,
} = require("../utils/sendVerificationEmail");

const jwt = require("jsonwebtoken");
const passport = require("passport");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { v4: uuidv4 } = require("uuid");

const { JWT_SECRET, NODE_ENV, FRONT_END_URL, envPORT } = process.env;

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
  confirmUser,
  fetchUserPoints,
  getUserFavorites,
  checkFavorites,
  deleteFavorite,
  addFavorite,
  getUserFavoritesCount,
  updateUserPassword,
  insertPasswordReset,
} = require("../queries/userQueries");

/** Google Authentication Callback */
const googleAuthCallback = async (req, res, pool) => {
  passport.authenticate(
    "google",
    { failureRedirect: "/", session: false },
    async (err, user) => {
      if (!user) return res.redirect("/");

      // Πάρε τα πλήρη δεδομένα χρήστη από DB
      const dbUser = await pool.query(getUserByEmail, [user.email]);
      const fullUser = dbUser.rows[0];

      const payload = {
        id: fullUser.id,
        name: fullUser.name,
        email: fullUser.email,
        role: fullUser.role,
        confirmed_user: fullUser.confirmed_user,
      };

      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "1d" });

      res.cookie("token", token, {
        httpOnly: true,
        secure: NODE_ENV === "production",
        path: "/",
        sameSite: "Lax",
        maxAge: 24 * 60 * 60 * 1000,
      });

      return res.redirect("http://localhost:3000/auth-redirect");
    }
  )(req, res);
};


/** Check Authentication Status */
const checkAuthStatus = (req, res) => {
  const token = req.cookies.token;
  if (!token) {
    return res.json({ loggedIn: false });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({ loggedIn: true, user: decoded });
  } catch (err) {
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

    const {
      name,
      email,
      password,
      phone,
      role,
      newsletterSubscribed,
      profile_image,
    } = value;

    // ✅ Correctly use `pool.query`
    const existingUser = await pool.query(getUserByEmail, [email]);

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: "User already exists" });
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
      role,
      null,
      null,
      newsletterSubscribed,
      profile_image,
    ]);

    // Send verification email
    await sendVerificationEmail(result.rows[0]);

    res
      .status(201)
      .json({ message: "User registered. Check your email for verification." });
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
    const userResult = await pool.query(getUserByEmail, [email]);
    if (userResult.rows.length === 0) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const user = userResult.rows[0];
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const payload = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      confirmed_user: user.confirmed_user,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "30m" });

    res.cookie("token", token, {
      httpOnly: true,
      secure: NODE_ENV === "production",
      path: "/",
      sameSite: "Lax",
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });

    res.json({
      message: "Login successful",
      user: payload,
    });
  } catch (error) {
    console.error("Error during login:", error.message);
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
    const user_id = decoded.id;

    // ✅ Validate input
    const { error, value } = userUpdateSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const { name, email, password, phone, google_id, facebook_id } = value;

    // ✅ Fetch user from database
    const userQuery = await pool.query(getUserById, [user_id]);
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
    if (google_id)
      updateFields.push(`google_id = $${updateFields.length + 1}`),
        updateValues.push(google_id);
    if (facebook_id)
      updateFields.push(`facebook_id = $${updateFields.length + 1}`),
        updateValues.push(facebook_id);

    if (updateFields.length === 0) {
      return res
        .status(400)
        .json({ message: "No valid fields provided for update" });
    }

    updateValues.push(user_id);

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

// Verify users via email
const verifyEmail = async (req, res, pool) => {
  try {
    const { token } = req.query;
    if (!token)
      return res.status(400).json({ error: "Invalid or expired token" });

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Update user as verified
    const setconfirmed_user = await pool.query(confirmUser, [decoded.id]);
    console.log(setconfirmed_user);
    res.json({ message: "Email verified successfully. You can now log in." });
  } catch (error) {
    res.status(500).json({ message: "Invalid or expired token" });
  }
};

const resendVerificationEmail = async (req, res, pool) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email is required." });

  try {
    // Check if user exists
    const existingUser = await pool.query(getUserByEmail, [email]);

    if (existingUser.rows.length === 0) {
      return res.status(404).json({ message: "User not found." });
    }

    const user = existingUser.rows[0];

    // Check if already verified
    if (user.confirmed_user) {
      return res.status(400).json({ error: "User is already verified." });
    }

    await sendVerificationEmail(user);

    res.json({ message: "Verification email resent! Check your inbox." });
  } catch (error) {
    console.error("Error in resendVerificationEmail:", error);
    res.status(500).json({
      message: "Error resending verification email. Please try again later.",
    });
  }
};

/** Facebook Authentication Callback */
const facebookAuthCallback = async (req, res, pool) => {
  passport.authenticate(
    "facebook",
    { failureRedirect: "/", session: false },
    async (err, user) => {
      if (!user) return res.redirect("/");

      // Πάρε τα πλήρη δεδομένα χρήστη από DB
      const dbUser = await pool.query(getUserByEmail, [user.email]);
      const fullUser = dbUser.rows[0];

      const payload = {
        id: fullUser.id,
        name: fullUser.name,
        email: fullUser.email,
        role: fullUser.role,
        confirmed_user: fullUser.confirmed_user,
      };

      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "1d" });

      res.cookie("token", token, {
        httpOnly: true,
        secure: NODE_ENV === "production",
        path: "/",
        sameSite: "Lax",
        maxAge: 24 * 60 * 60 * 1000,
      });

      return res.redirect("http://localhost:3000/auth-redirect");
    }
  )(req, res);
};


const getUserPoints = async (req, res, pool) => {
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

    const user_id = decoded.id;

    // ✅ Fetch user from database using decoded ID
    const points = await pool.query(fetchUserPoints, [user_id]);
    if (points.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    const loyalty_points = points.rows[0].loyalty_points;
    res.json({ user_id, loyalty_points });
  } catch (error) {
    console.error("Error fetching user points:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const getFavorites = async (req, res, pool) => {
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

    const user_id = decoded.id;

    const page = parseInt(req.query.page, 10) || 1; // Default to 1 if not provided
    const pageSize = parseInt(req.query.pageSize, 10) || 10; // Default to 10 if not provided

    const offset = (page - 1) * pageSize;
    const limit = pageSize;

    // ✅ Fetch user from database using decoded ID
    const favorites = await pool.query(getUserFavorites, [
      user_id,
      limit,
      offset,
    ]);
    const favoriteRestaurants = favorites.rows;
    if (favoriteRestaurants.length === 0) {
      return res.status(404).json({ error: "User has no favorites." });
    }

    const countResult = await pool.query(getUserFavoritesCount, [user_id]);
    const totalCount = parseInt(countResult.rows[0].count, 10);

    // Calculate pagination information
    const currentPage = page;
    const recordsOnCurrentPage = favoriteRestaurants.length; // This will be pageSize or less if it's the last page
    const viewedRecords = (currentPage - 1) * pageSize + recordsOnCurrentPage;
    const remainingRecords = totalCount - viewedRecords;

    res.json({
      user_id,
      favoriteRestaurants,
      Pagination: {
        currentPage: currentPage,
        recordsOnCurrentPage: recordsOnCurrentPage,
        viewedRecords: viewedRecords,
        remainingRecords: remainingRecords,
        total: totalCount,
      },
    });
  } catch (error) {
    console.error("Error fetching user favorites:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const toggleFavoriteController = async (req, res, pool) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ message: "Δεν είστε συνδεδεμένος." });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      res.clearCookie("token");
      return res.status(401).json({ message: "Μη έγκυρο token." });
    }

    const user_id = decoded.id;
    const { restaurant_id } = req.body;

    if (!restaurant_id) {
      return res
        .status(400)
        .json({ error: "Λείπει το ID του εστιατορίου." });
    }

    // ✅ Έλεγχος αν ο χρήστης έχει επιβεβαιωθεί (confirmed_user)
    const userResult = await pool.query(
      "SELECT confirmed_user FROM users WHERE id = $1",
      [user_id]
    );
    const isConfirmed = userResult.rows[0]?.confirmed_user;

    if (!isConfirmed) {
      return res
        .status(403)
        .json({ message: "Πρέπει να επιβεβαιώσεις τον λογαριασμό σου." });
    }

    const checkForFavorites = await pool.query(checkFavorites, [
      user_id,
      restaurant_id,
    ]);

    if (checkForFavorites.rows.length > 0) {
      await pool.query(deleteFavorite, [user_id, restaurant_id]);
      return res.status(200).json({ removed: true });
    } else {
      await pool.query(addFavorite, [user_id, restaurant_id]);
      return res.status(201).json({ added: true });
    }
  } catch (error) {
    console.error("Error toggling favorite:", error);
    res.status(500).json({ error: "Κάτι πήγε στραβά." });
  }
};

const requestResetPassword = async (req, res, pool) => {
  try {
    // ✅ Validate email input
    const { error, value } = userUpdateSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const { email } = value;

    // ✅ Check if user exists
    const userResult = await pool.query(getUserByEmail, [email]);
    if (userResult.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "No account found with this email" });
    }

    const user = userResult.rows[0];

    const token = crypto.randomBytes(32).toString("hex"); // secure token
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 min

    const updatePassword = await pool.query(insertPasswordReset, [
      user.id,
      token,
      expiresAt,
    ]);

    // ✅ Construct reset URL
    const resetUrl = `${FRONT_END_URL}:${envPORT}/reset-password.html?token=${token}`;

    // ✅ Send email
    await sendResetPasswordEmail(user, resetUrl);

    res.json({ message: "Reset link sent. Check your email." });
  } catch (err) {
    console.error("❌ Error in requestPasswordReset:", err);
    res.status(500).json({ message: "Server error" });
  }
};

const resetPassword = async (req, res, pool) => {
  try {
    const { token, password } = req.body;

    const result = await pool.query(
      `SELECT * FROM password_resets WHERE token = $1`,
      [token]
    );

    const resetRequest = result.rows[0];
    if (!resetRequest || resetRequest.used) {
      return res
        .status(400)
        .json({ message: "Invalid or expired reset token." });
    }

    if (new Date() > new Date(resetRequest.expires_at)) {
      return res.status(400).json({ message: "Reset token has expired." });
    }

    // ✅ Get the user
    const userResult = await pool.query(`SELECT * FROM users WHERE id = $1`, [
      resetRequest.user_id,
    ]);
    const user = userResult.rows[0];

    // ✅ Hash and update the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    await pool.query(updateUserPassword, [hashedPassword, user.id]);

    // ✅ Mark the token as used
    await pool.query(`UPDATE password_resets SET used = TRUE WHERE id = $1`, [
      resetRequest.id,
    ]);

    res.json({ message: "Password successfully updated." });
  } catch (err) {
    console.error("❌ Error in resetPassword:", err);
    res.status(500).json({ message: "Server error" });
  }
};

const checkResetPasswordToken = async (req, res, pool) => {
  try {
    const { token } = req.body;
    const result = await pool.query(
      `SELECT * FROM password_resets WHERE token = $1`,
      [token]
    );

    const resetRequest = result.rows[0];
    if (!resetRequest || resetRequest.used) {
      return res
        .status(400)
        .json({ message: "Invalid or expired reset token." });
    }

    if (new Date() > new Date(resetRequest.expires_at)) {
      return res.status(400).json({ message: "Reset token has expired." });
    }
  } catch (err) {
    console.error("❌ Error in resetPassword:", err);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  registerUser,
  getUserPoints,
  loginUser,
  updateUserDetails,
  getUserProfile,
  googleAuthCallback,
  checkAuthStatus,
  logoutUser,
  verifyEmail,
  resendVerificationEmail,
  facebookAuthCallback,
  getUserPoints,
  getFavorites,
  toggleFavoriteController,
  requestResetPassword,
  resetPassword,
  checkResetPasswordToken,
};
