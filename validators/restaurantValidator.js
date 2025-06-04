const Joi = require("joi");

const updateRestaurantSchema = Joi.object({
  name: Joi.string().max(255),
  location: Joi.string().max(255),
  cuisine: Joi.string().max(100),
  rating: Joi.number().min(0).max(10).precision(1),
  address: Joi.object().optional(),
  coordinates: Joi.object().optional(),
  opening_hours: Joi.object().optional(),
  contact: Joi.object().optional(),
}).min(1);

module.exports = {
  updateRestaurantSchema,
};
