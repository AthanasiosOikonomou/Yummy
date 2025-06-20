require("dotenv").config();
const jwt = require("jsonwebtoken");
const passport = require("passport");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const {
  createRestaurantQuery,
  checkIfAdminExists,
  createAdmin,
  getAdminByEmail,
} = require("../queries/adminQueries");
const {
  createRestaurantValidator,
  adminSchema,
  adminLoginSchema,
} = require("../validators/adminValidator");

const { JWT_SECRET } = process.env;

const createRestaurant = async (req, res, pool) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res
        .status(401)
        .json({ message: "Unauthorized - No token provided" });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      res.clearCookie("token");
      return res.status(401).json({ message: "Unauthorized - Invalid token" });
    }

    if (decoded.role !== "admin") {
      return res.status(403).json({ message: "Forbidden - Admins only" });
    }

    // 🟡 Joi validation
    const { error, value } = createRestaurantValidator.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const {
      name,
      location,
      cuisine,
      address,
      coordinates,
      opening_hours,
      contact,
      owner_id,
    } = value;

    const result = await pool.query(createRestaurantQuery, [
      name,
      location,
      cuisine,
      address,
      coordinates,
      opening_hours,
      contact,
      owner_id,
    ]);

    res.status(201).json({
      message: "Restaurant created successfully",
      restaurant: result.rows[0],
    });
  } catch (error) {
    console.error("Error in createRestaurant:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const registerAdmin = async (req, res, pool) => {
  const { error, value } = adminSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  const { name, email, password } = value;

  try {
    const adminExists = await pool.query(checkIfAdminExists, [email]);
    if (adminExists.rows.length > 0) {
      return res.status(409).json({ message: "Email is already in use" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newAdmin = await pool.query(createAdmin, [
      name,
      email,
      hashedPassword,
      "admin",
    ]);

    const token = jwt.sign(
      { id: newAdmin.rows[0].id, role: "admin" },
      JWT_SECRET,
      { expiresIn: "1d" }
    );
    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
    });

    res.status(201).json({
      message: "Admin registered successfully",
      admin: newAdmin.rows[0],
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const loginAdmin = async (req, res, pool) => {
  const { error, value } = adminLoginSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  const { email, password } = value;

  try {
    const result = await pool.query(getAdminByEmail, [email]);
    const admin = result.rows[0];
    if (!admin || admin.role !== "admin") {
      return res
        .status(401)
        .json({ message: "Invalid credentials or not an admin" });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ id: admin.id, role: "admin" }, JWT_SECRET, {
      expiresIn: "1d",
    });
    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
    });

    res.status(200).json({
      message: "Admin logged in successfully",
      admin: { id: admin.id, email: admin.email },
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

module.exports = {
  createRestaurant,
  registerAdmin,
  loginAdmin,
};
