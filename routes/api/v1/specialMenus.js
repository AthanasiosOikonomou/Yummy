const express = require("express");

const {
  createSpecialMenu,
  updateSpecialMenu,
  deleteSpecialMenu,
} = require("../../../controllers/specialMenusController");

module.exports = (pool) => {
  const router = express.Router();
  // Create special menu
  router.post("/", (req, res) => {
    createSpecialMenu(req, res, pool);
  });

  // Patch special menu by ID
  router.patch("/:id", (req, res) => {
    updateSpecialMenu(req, res, pool);
  });

  // Delete special menu by ID
  router.delete("/:id", (req, res) => {
    deleteSpecialMenu(req, res, pool);
  });

  return router;
};
