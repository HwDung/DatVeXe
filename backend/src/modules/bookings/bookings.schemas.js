const { z } = require("zod");

const dateOnlySchema = z.union([
  z.date(),
  z.string()
    .regex(/^\d{4}-\d{2}-\d{2}/, "Date must use YYYY-MM-DD format")
    .transform((value) => new Date(`${value.slice(0, 10)}T00:00:00.000Z`)),
]);

const createBookingSchema = z.object({
  tripId: z.string().trim().min(1).max(30),
  tripDate: dateOnlySchema,
  seatCode: z.string().trim().optional(),
  seatCodes: z.array(z.string().trim()).optional(),
  passengerName: z.string().trim().min(1).max(120),
  passengerPhone: z.string().trim().min(1).max(20),
  passengerEmail: z.string().trim().email().max(254).or(z.literal("")),
  paymentMethod: z.string().optional(),
  totalPrice: z.number().int().positive().optional(),
}).passthrough();

const bookingIdSchema = z.string().trim().min(1).max(30);

const bookingLookupSchema = z.object({
  bookingCode: z.string().trim().min(1).max(20),
  phone: z.string().trim().min(1).max(20).optional(),
}).passthrough();

const bookingAccessSchema = z.object({
  phone: z.string().trim().min(1).max(20).optional(),
}).passthrough();

module.exports = {
  createBookingSchema,
  bookingIdSchema,
  bookingLookupSchema,
  bookingAccessSchema,
};
