const { z } = require("zod");

const dateOnlySchema = z.string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must use YYYY-MM-DD format")
  .refine((value) => {
    const date = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
  }, "Date is invalid")
  .transform((value) => new Date(`${value}T00:00:00.000Z`));

const createBookingSchema = z.object({
  tripId: z.string().trim().min(1).max(30),
  tripDate: dateOnlySchema,
  seatCode: z.string().trim().regex(/^[ABC][1-9]\d?$/),
  passengerName: z.string().trim().min(1).max(120),
  passengerPhone: z.string().trim().min(1).max(20),
  passengerEmail: z.string().trim().email().max(254),
  paymentMethod: z.enum(["momo", "vnpay", "card", "atm"]).optional(),
}).strict();

module.exports = { createBookingSchema };
