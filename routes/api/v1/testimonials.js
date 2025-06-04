const express = require("express");
const {
  fetchTestimonials,
} = require("../../../controllers/testimonialsController");

module.exports = (pool) => {
  const router = express.Router();

  router.get("/all", (req, res) => fetchTestimonials(req, res, pool));

  return router;
};
