// server.js
require("dotenv").config();

// import dependencies
const express = require("express");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");

const { rateLimiter } = require("./middleware/rateLimiter");
const pool = require("./config/db.config");

// import routes
const userRoutes = require("./routes/user");
const ownerRoutes = require("./routes/owner");
const restaurantRoutes = require("./routes/restaurant");

const app = express();

// Morgan is for log/ debugging
app.use(morgan("dev"));
app.use(express.json());

// Helmet is for secure headers
app.use(helmet());
app.use(cookieParser());
app.use(rateLimiter);

// routes
app.use("/user", userRoutes(pool));
app.use("/owner", ownerRoutes(pool));
app.use("/restaurant", restaurantRoutes(pool));

// Global Error Handling Middleware
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal Server Error" });
});

// Start Express Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
