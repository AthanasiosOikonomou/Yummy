const Joi = require("joi");

const createRestaurantValidator = Joi.object({
  name: Joi.string().min(3).max(100).required(),

  location: Joi.string().min(3).max(100).required(),

  cuisine: Joi.string().min(2).max(50).required(),

  address: Joi.object({
    street: Joi.string().min(3).max(100).required(),
    number: Joi.string().min(1).max(10).required(),
    postalCode: Joi.string().min(3).max(10).required(),
    area: Joi.string().min(3).max(100).required(),
  }).required(),

  coordinates: Joi.object({
    lat: Joi.number().required(),
    lng: Joi.number().required(),
  }).required(),

  openingHours: Joi.object({
    open: Joi.string()
      .pattern(/^\d{2}:\d{2}$/)
      .required(), // e.g., "11:00"
    close: Joi.string()
      .pattern(/^\d{2}:\d{2}$/)
      .required(), // e.g., "04:00"
  }).required(),

  contact: Joi.object({
    phone: Joi.string().min(7).required(),
    email: Joi.string().email().required(),
    socialMedia: Joi.object({
      facebook: Joi.string().uri().allow(""),
      instagram: Joi.string().uri().allow(""),
    }).required(),
  }).required(),

  owner_id: Joi.number().integer().required(),
});

const adminSchema = Joi.object({
  name: Joi.string().min(3).max(50).required().messages({
    "string.base": "Name must be a string",
    "string.empty": "Name is required",
    "string.min": "Name must be at least 3 characters",
    "any.required": "Name is required",
  }),

  email: Joi.string().email().lowercase().required().messages({
    "string.email": "Email must be valid",
    "any.required": "Email is required",
  }),

  password: Joi.string()
    .min(8)
    .max(100)
    .pattern(new RegExp("^(?=.*[A-Za-z])(?=.*\\d)[A-Za-z\\d_@$!%*?&]{8,}$"))
    .required()
    .messages({
      "string.pattern.base":
        "Password must be at least 8 characters, including a letter and a number",
      "any.required": "Password is required",
    }),
});

const adminLoginSchema = Joi.object({
  email: Joi.string().email().lowercase().required(),
  password: Joi.string().required(),
});

module.exports = {
  createRestaurantValidator,
  adminSchema,
  adminLoginSchema,
};
