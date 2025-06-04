const Joi = require("joi");

const createSpecialMenuSchema = Joi.object({
  name: Joi.string().max(255).required(),
  description: Joi.string().optional(),
  original_price: Joi.number().precision(2).min(0).required(),
  discounted_price: Joi.number().precision(2).min(0).required(),
  discount_percentage: Joi.number().integer().min(0).max(100).required(),
  photo_url: Joi.string().uri().optional(),
  restaurant_id: Joi.number().integer().required(),
  availability: Joi.object().optional(),
});

const updateSpecialMenuSchema = Joi.object({
  name: Joi.string().max(255),
  description: Joi.string(),
  original_price: Joi.number().precision(2).min(0),
  discounted_price: Joi.number().precision(2).min(0),
  discount_percentage: Joi.number().integer().min(0).max(100),
  photo_url: Joi.string().uri(),
  availability: Joi.object(),
  restaurant_id: Joi.number().integer().required(),
}).min(2); // at least restaurant_id and one other field

const deleteSpecialMenuSchema = Joi.object({
  restaurant_id: Joi.number().integer().required(),
});

module.exports = {
  createSpecialMenuSchema,
  updateSpecialMenuSchema,
  deleteSpecialMenuSchema,
};
