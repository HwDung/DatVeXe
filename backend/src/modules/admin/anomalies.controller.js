const { z } = require("zod");
const { bookingIdSchema, dateSchema } = require("./bookings.schemas");
const anomaliesService = require("./anomalies.service");

const listAnomaliesQuerySchema = z.object({
  search: z.string().trim().max(254).optional(),
  fromDate: dateSchema.optional(),
  toDate: dateSchema.optional(),
  severity: z.enum(["low", "medium", "high"]).optional(),
  reviewStatus: z.enum(["open", "reviewed", "false_positive"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
}).strict().refine(
  ({ fromDate, toDate }) => !fromDate || !toDate || fromDate <= toDate,
  { message: "fromDate must be before or equal to toDate", path: ["fromDate"] },
);

const updateReviewSchema = z.object({
  status: z.enum(["open", "reviewed", "false_positive"]),
  note: z.string().trim().max(500).optional(),
}).strict();

async function listAnomalies(request, response, next) {
  try {
    const filters = listAnomaliesQuerySchema.parse(request.query);
    response.json(await anomaliesService.listAnomalies(filters));
  } catch (error) {
    next(error);
  }
}

async function updateReview(request, response, next) {
  try {
    const bookingId = bookingIdSchema.parse(request.params.bookingId);
    const input = updateReviewSchema.parse(request.body);
    response.json(await anomaliesService.updateAnomalyReview(bookingId, input, request.auth.userId));
  } catch (error) {
    next(error);
  }
}

module.exports = { listAnomalies, updateReview };
