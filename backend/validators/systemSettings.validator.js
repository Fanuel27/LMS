const { z } = require('zod');

const updateSettingsSchema = z.record(
  z.string(),
  z.union([z.string(), z.number(), z.boolean()])
).refine((data) => Object.keys(data).length > 0, {
  message: "At least one setting is required"
});

module.exports = {
  updateSettingsSchema,
};
