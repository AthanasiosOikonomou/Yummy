const {
  getOwnerByEmail,
  insertOwner,
  insertPasswordResetOwner,
  updateOwnerPassword,
  getOwnerById,
  updateOwner,
} = require("../queries/ownerQueries");
const {
  ownerSchema,
  loginSchemaOwner,
  ownerUpdateSchema,
} = require("../validators/ownerValidator");

const jwt = require("jsonwebtoken");
const passport = require("passport");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { v4: uuidv4 } = require("uuid");

const {
  sendVerificationEmail,
  sendResetPasswordEmail,
} = require("../utils/sendVerificationEmail");

const { JWT_SECRET, NODE_ENV, FRONT_END_URL, envPORT } = process.env;

const registerOwner = async (req, res, pool) => {
  try {
    const { error, value } = ownerSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const {
      name,
      email,
      password,
      phone,
      role,
      newsletter_subscribed,
      profile_image,
    } = value;

    // ✅ Correctly use `pool.query`
    const existingOwner = await pool.query(getOwnerByEmail, [email]);

    if (existingOwner.rows.length > 0) {
      return res.status(400).json({ message: "Owner already exists" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // ✅ Insert owner correctly
    const result = await pool.query(insertOwner, [
      name,
      email,
      hashedPassword,
      phone,
      role,
      null,
      null,
      newsletter_subscribed,
      profile_image,
    ]);

    // Send verification email
    await sendVerificationEmail(result.rows[0]);

    res.status(201).json({
      message: "Owner registered. Check your email for verification.",
    });
  } catch (err) {
    console.error("Error in registerOwner:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const checkAuthStatus = (req, res) => {
  console.log("Checking authentication status..."); // Debug log

  const token = req.cookies.token;
  if (!token) {
    console.log("No token found, owner is not logged in.");
    return res.json({ loggedIn: false });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log("owner authenticated:", decoded);
    res.json({ loggedIn: true, owner: decoded });
  } catch (err) {
    console.log("Invalid token, clearing cookie...");
    res.clearCookie("token");
    res.json({ loggedIn: false });
  }
};

const logoutOwner = (req, res) => {
  res.clearCookie("token");
  res.redirect("/");
};

const requestResetPasswordOwner = async (req, res, pool) => {
  try {
    // ✅ Validate email input
    const { error, value } = ownerUpdateSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const { email } = value;

    // ✅ Check if owner exists
    const ownerResult = await pool.query(getOwnerByEmail, [email]);
    if (ownerResult.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "No account found with this email" });
    }

    const owner = ownerResult.rows[0];

    const token = crypto.randomBytes(32).toString("hex"); // secure token
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 min

    const updatePassword = await pool.query(insertPasswordResetOwner, [
      owner.id,
      token,
      expiresAt,
    ]);

    // ✅ Construct reset URL
    const resetUrl = `${FRONT_END_URL}:${envPORT}/reset-password-owner.html?token=${token}`;

    // ✅ Send email
    await sendResetPasswordEmail(owner, resetUrl);

    res.json({ message: "Reset link sent. Check your email." });
  } catch (err) {
    console.error("❌ Error in requestPasswordReset:", err);
    res.status(500).json({ message: "Server error" });
  }
};

const resetPasswordOwner = async (req, res, pool) => {
  try {
    const { token, password } = req.body;

    const result = await pool.query(
      `SELECT * FROM password_resets_owners WHERE token = $1`,
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

    // ✅ Get the owner
    const ownerResult = await pool.query(`SELECT * FROM owners WHERE id = $1`, [
      resetRequest.owner_id,
    ]);
    const owner = ownerResult.rows[0];

    // ✅ Hash and update the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    await pool.query(updateOwnerPassword, [hashedPassword, owner.id]);

    // ✅ Mark the token as used
    await pool.query(
      `UPDATE password_resets_owners SET used = TRUE WHERE id = $1`,
      [resetRequest.id]
    );

    res.json({ message: "Password successfully updated." });
  } catch (err) {
    console.error("❌ Error in resetPassword:", err);
    res.status(500).json({ message: "Server error" });
  }
};

const checkResetPasswordTokenOwner = async (req, res, pool) => {
  try {
    const { token } = req.body;
    const result = await pool.query(
      `SELECT * FROM password_resets_owners WHERE token = $1`,
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

const loginOwner = async (req, res, pool) => {
  const { email, password } = req.body;
  const { error } = loginSchemaOwner.validate({ email, password });
  if (error) return res.status(400).json({ error: error.details[0].message });

  try {
    const owner = await pool.query(getOwnerByEmail, [email]);
    if (owner.rows.length === 0) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Compare password
    const validPassword = await bcrypt.compare(
      password,
      owner.rows[0].password
    );
    if (!validPassword) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: owner.rows[0].id, email: owner.rows[0].email },
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
      owner: { id: owner.rows[0].id, email: owner.rows[0].email },
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Server error" });
  }
};

const updateOwnerDetails = async (req, res, pool) => {
  try {
    console.log("🔍 Checking authentication via cookies...");

    // ✅ Extract JWT token from cookies
    const token = req.cookies.token;
    if (!token) {
      console.log("🚨 No token found in cookies");
      return res.status(401).json({ message: "Unauthorized - No token found" });
    }

    // ✅ Verify token and decode owner data
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      console.log("🚨 Invalid token:", err);
      res.clearCookie("token"); // Clear corrupted token
      return res.status(401).json({ message: "Unauthorized - Invalid token" });
    }

    console.log("✅ Decoded owner:", decoded);
    const ownerId = decoded.id;

    // ✅ Validate input
    const { error, value } = ownerUpdateSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const { name, email, password, phone, google_id, facebook_id } = value;

    // ✅ Fetch owner from database
    const ownerQuery = await pool.query(getOwnerById, [ownerId]);
    if (ownerQuery.rows.length === 0) {
      console.log("🚨 Owner not found in database");
      return res.status(404).json({ message: "Owner not found" });
    }

    console.log("✅ Owner found:", ownerQuery.rows[0]);

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

    updateValues.push(ownerId);

    // ✅ Update owner in database
    const result = await pool.query(
      updateOwner(updateFields.join(", ")),
      updateValues
    );

    console.log("✅ Owner updated successfully:", result.rows[0]);
    res.json({ message: "Owner updated successfully", owner: result.rows[0] });
  } catch (err) {
    console.error("❌ Error in updateOwnerDetails:", err);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  registerOwner,
  checkAuthStatus,
  logoutOwner,
  requestResetPasswordOwner,
  resetPasswordOwner,
  checkResetPasswordTokenOwner,
  loginOwner,
  updateOwnerDetails,
};
