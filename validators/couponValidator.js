const Joi = require("joi");

const createCouponSchema = Joi.object({
  description: Joi.string().min(3).max(255).required(),
  discount_percentage: Joi.number().min(1).max(100).required(),
  required_points: Joi.number().min(0).required(),
  restaurant_id: Joi.number().integer().required(),
});

const patchCouponSchema = Joi.object({
  couponId: Joi.number().integer().required(),
  description: Joi.string().min(3).max(255),
  discount_percentage: Joi.number().min(1).max(100),
  required_points: Joi.number().min(0),
}).or("description", "discount_percentage", "required_points"); // Must provide at least one field

module.exports = {
  createCouponSchema,
  patchCouponSchema,
};
