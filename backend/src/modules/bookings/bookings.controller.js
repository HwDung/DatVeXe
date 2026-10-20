const { Prisma } = require("@prisma/client");
const service = require("./bookings.service");
const {
  createBookingSchema,
  bookingIdSchema,
  bookingLookupSchema,
  bookingAccessSchema,
} = require("./bookings.schemas");
const { HttpError } = require("../../utils/http-error");

/**
 * Xử lý lỗi P2034 (write conflict / deadlock) từ SERIALIZABLE transaction.
 * Khi hai request đồng thời tranh nhau ghế, SQL Server chọn một bên làm
 * "deadlock victim" và throw P2034. Ta retry tối đa `maxRetries` lần.
 * Sau khi retry mà vẫn lỗi (ghế thực sự đã bị lấy), sẽ ra 409.
 *
 * @template T
 * @param {() => Promise<T>} fn
 * @param {number} [maxRetries=2]
 * @returns {Promise<T>}
 */
async function withConflictRetry(fn, maxRetries = 2) {
  let lastError;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const isConflict =
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2034";
      if (!isConflict) throw error;
      lastError = error;
      // Chờ ngắn trước khi retry (exponential backoff nhẹ)
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 20 * (attempt + 1)));
      }
    }
  }
  // Hết retry — ghế nhiều khả năng đã bị người khác lấy
  throw new HttpError(
    409,
    "SEAT_UNAVAILABLE",
    "Seat is no longer available due to high demand. Please try again.",
  );
}

async function createBooking(req, res, next) {
  try {
    const input = createBookingSchema.parse(req.body);
    const booking = await withConflictRetry(() =>
      service.createBookingService({
        ...input,
        userId: req.auth?.userId,
      }),
    );
    res.status(201).json(booking);
  } catch (error) {
    next(error);
  }
}

async function lookupBooking(req, res, next) {
  try {
    const { bookingCode, phone } = bookingLookupSchema.parse(req.query);
    const booking = await service.lookupBookingService(bookingCode, phone);
    if (!booking) {
      throw new HttpError(404, "BOOKING_NOT_FOUND", "Booking not found");
    }
    res.json(booking);
  } catch (error) {
    next(error);
  }
}

async function listMyBookings(req, res, next) {
  try {
    const bookings = await service.listUserBookingsService(req.auth.userId);
    res.json(bookings);
  } catch (error) {
    next(error);
  }
}

async function getBooking(req, res, next) {
  try {
    const id = bookingIdSchema.parse(req.params.id);
    const { phone } = bookingAccessSchema.parse(req.query);
    const userId = req.auth?.userId;
    if (!userId && !phone) {
      throw new HttpError(401, "BOOKING_ACCESS_REQUIRED", "Authentication or passenger phone is required");
    }
    const booking = await service.getBookingService(id, { userId, phone });
    res.json(booking);
  } catch (error) {
    next(error);
  }
}

async function cancelBooking(req, res, next) {
  try {
    const id = bookingIdSchema.parse(req.params.id);
    const { phone } = bookingAccessSchema.parse(req.body ?? {});
    const userId = req.auth?.userId;
    if (!userId && !phone) {
      throw new HttpError(401, "BOOKING_ACCESS_REQUIRED", "Authentication or passenger phone is required");
    }
    const booking = await service.cancelBookingService(id, { userId, phone });
    res.json(booking);
  } catch (error) {
    next(error);
  }
}

async function getMyBookings(req, res, next) {
  try {
    const userId = req.auth?.userId;
    const phone = req.query?.phone;
    const email = req.auth?.email || req.query?.email;
    if (!userId && !phone && !email) {
      throw new HttpError(401, "BOOKING_ACCESS_REQUIRED", "Authentication or passenger contact is required");
    }
    const bookings = await service.getMyBookingsService({ userId, phone, email });
    res.json(bookings);
  } catch (error) {
    next(error);
  }
}

module.exports = { createBooking, lookupBooking, listMyBookings, getBooking, cancelBooking, getMyBookings };
