const Joi = require("joi");

const menuItemSchema = Joi.object({
  name: Joi.string().min(1).max(255).required(),
  price: Joi.number().precision(2).positive().required(),
  category: Joi.string().min(1).max(50).required(),
  description: Joi.string().allow(null, "").optional(),
  discount: Joi.number().integer().min(0).max(100).default(0),
  restaurant_id: Joi.number().integer().required(),
});

const updateMenuItemSchema = Joi.object({
  name: Joi.string().min(1).max(255),
  price: Joi.number().precision(2).positive(),
  category: Joi.string().min(1).max(50),
  description: Joi.string().allow(null, ""),
  discount: Joi.number().integer().min(0).max(100),
  restaurant_id: Joi.number().integer().required(),
}).min(1);

module.exports = { menuItemSchema, updateMenuItemSchema };
