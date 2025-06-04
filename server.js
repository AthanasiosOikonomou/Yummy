// server.js
require("dotenv").config();

// import dependencies
const express = require("express");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const path = require("path");
const cors = require("cors");

const { rateLimiter } = require("./middleware/rateLimiter");
const pool = require("./config/db.config");

const { envPORT, FRONT_END_URL } = process.env;

// import routes
const userRoutes = require("./routes/api/v1/user");
const restaurantRoutes = require("./routes/api/v1/restaurant");
const testimonialRoutes = require("./routes/api/v1/testimonials");
const reservationRoutes = require("./routes/api/v1/reservations");
const couponsRoutes = require("./routes/api/v1/coupons");
const ownerRoutes = require("./routes/api/v1/owner");
const adminRoutes = require("./routes/api/v1/admin");
const menuItemsRoutes = require("./routes/api/v1/menuItems");
const specialMenusRoutes = require("./routes/api/v1/specialMenus");
const specialMenuItemsRoutes = require("./routes/api/v1/specialMenuItems");

const app = express();

// Morgan is for log/ debugging
app.use(morgan("dev"));
app.use(express.json());

app.use(express.static("public"));

// Helmet is for secure headers
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      objectSrc: ["'none'"],
    },
  })
);

app.use(cookieParser());
app.use(rateLimiter);
app.use(cors({ origin: FRONT_END_URL, credentials: true }));

// routes
app.use("/api/v1/user", userRoutes(pool));
app.use("/api/v1/restaurant", restaurantRoutes(pool));
app.use("/api/v1/testimonials", testimonialRoutes(pool));
app.use("/api/v1/reservations", reservationRoutes(pool));
app.use("/api/v1/coupons", couponsRoutes(pool));
app.use("/api/v1/owner", ownerRoutes(pool));
app.use("/api/v1/admin", adminRoutes(pool));
app.use("/api/v1/menuItems", menuItemsRoutes(pool));
app.use("/api/v1/specialMenus", specialMenusRoutes(pool));
app.use("/api/v1/special-menu-items", specialMenuItemsRoutes(pool));

// **Serve Google Frontend**
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "loginPage.html"));
});

// Global Error Handling Middleware
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal Server Error" });
});

// Start Express Server
app.listen(envPORT, () => {
  console.log(`🚀 Server running on port ${envPORT}`);
});
