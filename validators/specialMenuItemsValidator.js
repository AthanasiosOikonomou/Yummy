const Joi = require("joi");

const createSpecialMenuItemSchema = Joi.object({
  special_menu_id: Joi.number().integer().required(),
  menu_item_id: Joi.number().integer().required(),
});

const deleteSpecialMenuItemSchema = Joi.object({
  special_menu_id: Joi.number().integer().required(),
  menu_item_id: Joi.number().integer().required(),
});

module.exports = {
  createSpecialMenuItemSchema,
  deleteSpecialMenuItemSchema,
};
