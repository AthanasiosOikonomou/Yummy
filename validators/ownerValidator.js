// validators/userValidator.js
const Joi = require("joi");

const ownerSchema = Joi.object({
  name: Joi.string().min(3).max(100).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().max(50).allow(null, "").optional(),
  role: Joi.string().required(),
  password: Joi.when("google_id", {
    is: Joi.exist(),
    then: Joi.optional(),
    otherwise: Joi.string().min(8).required(), // Required if no Google ID
  }),
  google_id: Joi.string().optional(),
  facebook_id: Joi.string().optional(),
  newsletter_subscribed: Joi.boolean(),
  profile_image: Joi.string().max(255).optional(),
});

const loginSchemaOwner = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
});

const ownerUpdateSchema = Joi.object({
  name: Joi.string().min(1).max(100).optional(),
  email: Joi.string().email().max(255).optional(),
  password: Joi.string().min(8).optional(),
  phone: Joi.string().max(50).allow(null, "").optional(),
});

module.exports = { ownerSchema, loginSchemaOwner, ownerUpdateSchema };
