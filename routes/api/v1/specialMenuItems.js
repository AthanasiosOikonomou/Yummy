const express = require("express");

const {
  createSpecialMenuItem,
  deleteSpecialMenuItem,
} = require("../../../controllers/specialMenuItemsController");

module.exports = (pool) => {
  const router = express.Router();
  // Create link between special menu and menu item
  router.post("/", (req, res) => {
    createSpecialMenuItem(req, res, pool);
  });

  // Delete link between special menu and menu item
  router.delete("/", (req, res) => {
    deleteSpecialMenuItem(req, res, pool);
  });

  return router;
};
