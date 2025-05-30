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
const userRoutes = require("./routes/user");
const restaurantRoutes = require("./routes/restaurant");
const testimonialRoutes = require("./routes/testimonials");
const reservationRoutes = require("./routes/reservations");
const couponsRoutes = require("./routes/coupons");
const ownerRoutes = require("./routes/owner");

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
app.use("/user", userRoutes(pool));
app.use("/restaurant", restaurantRoutes(pool));
app.use("/testimonials", testimonialRoutes(pool));
app.use("/reservations", reservationRoutes(pool));
app.use("/coupons", couponsRoutes(pool));
app.use("/owner", ownerRoutes(pool));

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
