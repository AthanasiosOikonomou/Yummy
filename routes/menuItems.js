const express = require("express");

const {
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
} = require("../controllers/menuItemsController");

module.exports = (pool) => {
  const router = express.Router();
  router.post("/", (req, res) => createMenuItem(req, res, pool));
  router.patch("/:id", (req, res) => updateMenuItem(req, res, pool));
  router.delete("/:id", (req, res) => deleteMenuItem(req, res, pool));

  return router;
};
