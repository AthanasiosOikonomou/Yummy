const Joi = require("joi");

const patchReservationAsOwnerSchema = Joi.object({
  status: Joi.string().valid(
    "pending",
    "confirmed",
    "cancelled",
    "seated",
    "completed"
  ),
  cancellation_reason: Joi.string().allow(null, ""),
  reservation_id: Joi.number().integer().required(),
});

const getOwnerFilteredReservationsSchema = Joi.object({
  status: Joi.string()
    .valid("pending", "confirmed", "cancelled", "seated", "completed")
    .optional(),
  date: Joi.date().iso().optional(),
  page: Joi.number().integer().min(1).optional(),
  pageSize: Joi.number().integer().min(1).max(100).optional(),
});

module.exports = {
  patchReservationAsOwnerSchema,
  getOwnerFilteredReservationsSchema,
};
