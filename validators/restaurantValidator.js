// validators/restaurantValidator.js
const Joi = require("joi");

const createRestaurantSchema = Joi.object({
  name: Joi.string().max(255).required(),
  location: Joi.string().max(255).required(),
  lat: Joi.number().required(),
  lng: Joi.number().required(),
  cuisine: Joi.string().max(100).required(),
});

const updateRestaurantSchema = Joi.object({
  name: Joi.string().max(255).optional(),
  location: Joi.string().max(255).optional(),
  lat: Joi.number().optional(),
  lng: Joi.number().optional(),
  cuisine: Joi.string().max(100).optional(),
}).min(1);

module.exports = { createRestaurantSchema, updateRestaurantSchema };
