// validators/userValidator.js
const Joi = require("joi");

const userSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  email: Joi.string().email().max(255).required(),
  password: Joi.string().min(8).required(),
  phone: Joi.string().max(50).allow(null, "").optional(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
});

const userUpdateSchema = Joi.object({
  name: Joi.string().min(1).max(100).optional(),
  email: Joi.string().email().max(255).optional(),
  password: Joi.string().min(8).optional(),
  phone: Joi.string().max(50).allow(null, "").optional(),
});

module.exports = { userSchema, loginSchema, userUpdateSchema };
