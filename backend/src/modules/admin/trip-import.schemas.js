const { z } = require("zod");

const tripImportQuerySchema = z.object({
  sheetName: z.string().trim().min(1).max(31).optional(),
}).strict();

module.exports = { tripImportQuerySchema };
