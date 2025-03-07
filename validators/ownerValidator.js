// validators/ownerValidator.js
const Joi = require("joi");

// Joi Schema for owner Validation
const ownerSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  email: Joi.string().email().max(255).required(),
  password: Joi.string().min(8).required(),
  phone: Joi.string().max(50).allow(null, "").optional(),
});

// Joi Schema for owner Login Validation
const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
});

// Joi Schema for owner Update Validation
const ownerUpdateSchema = Joi.object({
  name: Joi.string().min(1).max(100).optional(),
  email: Joi.string().email().max(255).optional(),
  password: Joi.string().min(8).optional(),
  phone: Joi.string().max(50).allow(null, "").optional(),
});

module.exports = { ownerSchema, loginSchema, ownerUpdateSchema };
