const { z } = require("zod");

const dateOnlySchema = z.string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must use YYYY-MM-DD format")
  .refine((value) => {
    const date = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
  }, "Date is invalid")
  .transform((value) => new Date(`${value}T00:00:00.000Z`));

const seatCodeSchema = z.string().trim().regex(/^[ABC][1-9]\d?$/);

const createBookingSchema = z.object({
  tripId: z.string().trim().min(1).max(30),
  tripDate: dateOnlySchema,
  seatCodes: z.array(seatCodeSchema).min(1).max(40).optional(),
  seatCode: z.string().trim().max(200).optional(),
  passengerName: z.string().trim().min(1).max(120),
  passengerPhone: z.string().trim().min(1).max(20),
  passengerEmail: z.string().trim().email().max(254),
  paymentMethod: z.enum(["momo", "vnpay", "card", "atm"]).optional(),
}).strict()
  .superRefine((data, context) => {
    if (data.seatCodes?.length && data.seatCode) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["seatCodes"],
        message: "Use either seatCodes or seatCode, not both",
      });
    }

    if (!data.seatCodes?.length && !data.seatCode) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["seatCodes"],
        message: "At least one seat is required",
      });
    }

    if (data.seatCode) {
      const legacySeatCodes = data.seatCode.split(",").map((code) => code.trim());
      if (legacySeatCodes.some((code) => !seatCodeSchema.safeParse(code).success)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["seatCode"],
          message: "Seat codes must be valid and comma-separated",
        });
      }
    }

    const seatCodes = data.seatCodes ?? data.seatCode?.split(",").map((code) => code.trim()) ?? [];
    if (seatCodes.length > 40) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["seatCodes"],
        message: "A booking cannot contain more than 40 seats",
      });
    }
    if (new Set(seatCodes).size !== seatCodes.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["seatCodes"],
        message: "Seat codes must be unique",
      });
    }
  })
  .transform(({ seatCode, seatCodes, ...data }) => ({
    ...data,
    seatCodes: seatCodes ?? seatCode.split(",").map((code) => code.trim()),
  }));

const bookingIdSchema = z.string().trim().min(1).max(30);
const bookingLookupSchema = z.object({
  bookingCode: z.string().trim().min(1).max(20),
  phone: z.string().trim().min(1).max(20),
}).strict();
const bookingAccessSchema = z.object({
  phone: z.string().trim().min(1).max(20).optional(),
}).strict();

module.exports = {
  createBookingSchema,
  bookingIdSchema,
  bookingLookupSchema,
  bookingAccessSchema,
};
