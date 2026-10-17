const { randomBytes } = require("node:crypto");
const { prisma } = require("../../lib/prisma");
const { HttpError } = require("../../utils/http-error");

const bookingInclude = {
  trip: {
    include: {
      route: true,
      company: true,
      bus: true,
    },
  },
};

async function createBookingService(data) {
  const {
    tripId,
    tripDate,
    seatCode,
    seatCodes,
    passengerName,
    passengerPhone,
    passengerEmail,
    paymentMethod,
    userId,
    totalPrice,
  } = data;

  if (!tripId) throw new HttpError(400, "TRIP_REQUIRED", "Mã chuyến đi (tripId) là bắt buộc");
  if (!tripDate) throw new HttpError(400, "DATE_REQUIRED", "Ngày đi (tripDate) là bắt buộc");
  if (!passengerName || !passengerPhone) {
    throw new HttpError(400, "PASSENGER_INFO_REQUIRED", "Họ tên và số điện thoại là bắt buộc");
  }

  const date = tripDate instanceof Date ? tripDate : new Date(tripDate);

  // Parse seat codes list
  let seatList = [];
  if (Array.isArray(seatCodes) && seatCodes.length > 0) {
    seatList = seatCodes.map((s) => String(s).trim()).filter(Boolean);
  } else if (seatCode) {
    seatList = String(seatCode)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  if (seatList.length === 0) {
    throw new HttpError(400, "SEAT_REQUIRED", "Vui lòng chọn ít nhất 1 chỗ ngồi");
  }

  return prisma.$transaction(async (tx) => {
    const trip = await tx.trip.findUnique({
      where: { id: tripId },
      include: {
        route: true,
        company: true,
        bus: true,
      },
    });

    if (!trip) {
      throw new HttpError(404, "TRIP_NOT_FOUND", "Chuyến xe không tồn tại");
    }
    if (!trip.isActive) {
      throw new HttpError(409, "TRIP_UNAVAILABLE", "Chuyến xe hiện không hoạt động");
    }

    // Check seat availability
    const existingSeats = await tx.seatStatus.findMany({
      where: {
        tripId,
        tripDate: date,
        seatCode: { in: seatList },
      },
    });

    for (const s of existingSeats) {
      if (s.status !== "available") {
        throw new HttpError(409, "SEAT_UNAVAILABLE", `Ghế ${s.seatCode} đã có người đặt`);
      }
    }

    // Generate unique booking code
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const bookingCode = `RW${Date.now().toString().slice(-6)}${randomSuffix}`;

    const calculatedTotal = totalPrice || trip.price * seatList.length;
    const seatCodeString = seatList.join(", ");

    const newBooking = await tx.booking.create({
      data: {
        bookingCode,
        tripId,
        userId: userId || null,
        tripDate: date,
        passengerName: passengerName.trim(),
        passengerPhone: passengerPhone.trim(),
        passengerEmail: passengerEmail ? passengerEmail.trim() : "",
        seatCode: seatCodeString,
        totalPrice: calculatedTotal,
        paymentMethod: paymentMethod || "Tiền mặt khi lên xe",
        status: "pending",
        paymentStatus:
          paymentMethod === "MoMo" ||
          paymentMethod === "VNPAY" ||
          paymentMethod === "momo" ||
          paymentMethod === "vnpay"
            ? "paid"
            : "unpaid",
      },
      include: bookingInclude,
    });

    for (const code of seatList) {
      const match = existingSeats.find((es) => es.seatCode === code);
      if (match) {
        await tx.seatStatus.update({
          where: { id: match.id },
          data: { status: "booked", bookingId: newBooking.id },
        });
      } else {
        await tx.seatStatus.create({
          data: {
            tripId,
            tripDate: date,
            seatCode: code,
            status: "booked",
            bookingId: newBooking.id,
          },
        });
      }
    }

    return newBooking;
  });
}

async function lookupBookingService(bookingCode, phone) {
  if (!bookingCode) return null;

  const where = {
    bookingCode: bookingCode.trim(),
  };

  if (phone && phone.trim()) {
    where.passengerPhone = phone.trim();
  }

  return prisma.booking.findFirst({
    where,
    include: bookingInclude,
  });
}

function listUserBookingsService(userId) {
  return prisma.booking.findMany({
    where: { userId },
    include: bookingInclude,
    orderBy: { createdAt: "desc" },
  });
}

async function getBookingService(id, identity = {}) {
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: bookingInclude,
  });

  if (!booking) {
    throw new HttpError(404, "BOOKING_NOT_FOUND", "Booking not found");
  }

  if (identity.userId && booking.userId && booking.userId !== identity.userId) {
    if (!identity.phone || booking.passengerPhone !== identity.phone) {
      throw new HttpError(403, "FORBIDDEN", "You do not have access to this booking");
    }
  }

  return booking;
}

async function cancelBookingService(id, identity = {}) {
  return prisma.$transaction(async (tx) => {
    const booking = await tx.booking.findUnique({
      where: { id },
      include: {
        seatStatuses: true,
        trip: { include: { route: true, company: true, bus: true } },
      },
    });

    if (!booking) {
      throw new HttpError(404, "BOOKING_NOT_FOUND", "Booking not found");
    }

    if (identity.userId && booking.userId && booking.userId !== identity.userId) {
      if (!identity.phone || booking.passengerPhone !== identity.phone) {
        throw new HttpError(403, "FORBIDDEN", "You do not have access to cancel this booking");
      }
    }

    if (booking.status === "cancelled") {
      throw new HttpError(409, "ALREADY_CANCELLED", "Vé này đã được hủy trước đó");
    }

    const updated = await tx.booking.update({
      where: { id },
      data: {
        status: "cancelled",
        ...(booking.paymentStatus === "paid" ? { paymentStatus: "refunded" } : {}),
      },
      include: bookingInclude,
    });

    await tx.seatStatus.updateMany({
      where: { bookingId: id },
      data: { status: "available", bookingId: null },
    });

    return updated;
  });
}

async function statusCheckService(codes) {
  if (!Array.isArray(codes) || codes.length === 0) return [];
  const cleanCodes = codes.map((c) => String(c).trim()).filter(Boolean);

  return prisma.booking.findMany({
    where: { bookingCode: { in: cleanCodes } },
    select: {
      id: true,
      bookingCode: true,
      status: true,
      paymentStatus: true,
      passengerName: true,
      totalPrice: true,
      updatedAt: true,
      tripDate: true,
      trip: {
        select: {
          departureTime: true,
          route: {
            select: { origin: true, destination: true },
          },
          company: {
            select: { name: true },
          },
        },
      },
    },
  });
}

async function getMyBookingsService(criteria) {
  let userId, phone, email;
  if (typeof criteria === "object" && criteria !== null) {
    userId = criteria.userId;
    phone = criteria.phone;
    email = criteria.email;
  } else {
    userId = arguments[0];
    phone = arguments[1];
    email = arguments[2];
  }

  const conditions = [];
  if (userId) conditions.push({ userId });
  if (phone) conditions.push({ passengerPhone: phone });
  if (email) conditions.push({ passengerEmail: email });

  return prisma.booking.findMany({
    where: conditions.length > 0 ? { OR: conditions } : {},
    include: bookingInclude,
    orderBy: { createdAt: "desc" },
  });
}

module.exports = {
  createBookingService,
  lookupBookingService,
  listUserBookingsService,
  getBookingService,
  cancelBookingService,
  statusCheckService,
  getMyBookingsService,
};
