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
  const { tripId, tripDate, seatCode, passengerName, passengerPhone, passengerEmail, paymentMethod, userId } = data;

  const date = tripDate;
  const bookingCode = `RW${randomBytes(8).toString("hex").toUpperCase()}`;

  return prisma.$transaction(async (tx) => {
    const trip = await tx.trip.findUnique({
      where: { id: tripId },
      select: {
        id: true,
        price: true,
        isActive: true,
        availableDate: true,
        bus: { select: { totalSeats: true } },
      },
    });
    if (!trip) {
      throw new HttpError(404, "TRIP_NOT_FOUND", "Trip not found");
    }
    if (!trip.isActive) {
      throw new HttpError(409, "TRIP_UNAVAILABLE", "Trip is not available");
    }
    if (trip.availableDate && trip.availableDate.toISOString().slice(0, 10) !== date.toISOString().slice(0, 10)) {
      throw new HttpError(409, "TRIP_DATE_UNAVAILABLE", "Trip is not scheduled for the selected date");
    }

    const seatColumns = ["A", "B", "C"];
    const seatColumnIndex = seatColumns.indexOf(seatCode[0]);
    const seatNumber = Number(seatCode.slice(1));
    const seatIndex = (seatNumber - 1) * seatColumns.length + seatColumnIndex;
    if (seatIndex >= trip.bus.totalSeats) {
      throw new HttpError(400, "INVALID_SEAT", "Seat does not exist on this bus");
    }

    const seatKey = {
      tripId_tripDate_seatCode: {
        tripId,
        tripDate: date,
        seatCode,
      },
    };
    const existingSeat = await tx.seatStatus.findUnique({ where: seatKey });
    if (existingSeat && existingSeat.status !== "available") {
      throw new HttpError(409, "SEAT_UNAVAILABLE", "Seat is no longer available");
    }

    const newBooking = await tx.booking.create({
      data: {
        bookingCode,
        tripId,
        userId: userId || null,
        tripDate: date,
        passengerName,
        passengerPhone,
        passengerEmail,
        seatCode,
        totalPrice: trip.price,
        paymentMethod,
        status: "pending",
        paymentStatus: "unpaid",
      },
    });

    if (existingSeat) {
      const claimedSeat = await tx.seatStatus.updateMany({
        where: { id: existingSeat.id, status: "available" },
        data: { status: "booked", bookingId: newBooking.id },
      });
      if (claimedSeat.count !== 1) {
        throw new HttpError(409, "SEAT_UNAVAILABLE", "Seat is no longer available");
      }
    } else {
      try {
        await tx.seatStatus.create({
          data: {
            tripId,
            tripDate: date,
            seatCode,
            status: "booked",
            bookingId: newBooking.id,
          },
        });
      } catch (error) {
        if (error.code === "P2002") {
          throw new HttpError(409, "SEAT_UNAVAILABLE", "Seat is no longer available");
        }
        throw error;
      }
    }

    return newBooking;
  });
}

function lookupBookingService(bookingCode, phone) {
  return prisma.booking.findFirst({
    where: {
      bookingCode,
      passengerPhone: phone,
    },
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

async function getBookingService(id, { userId, phone }) {
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: bookingInclude,
  });

  if (!booking || (booking.userId !== userId && booking.passengerPhone !== phone)) {
    throw new HttpError(404, "BOOKING_NOT_FOUND", "Booking not found");
  }

  return booking;
}

function assertBookingAccess(booking, { userId, phone }) {
  if (booking.userId !== userId && booking.passengerPhone !== phone) {
    throw new HttpError(404, "BOOKING_NOT_FOUND", "Booking not found");
  }
}

function getDepartureDateTime(booking) {
  const tripDate = booking.tripDate.toISOString().slice(0, 10);
  const departureTime = booking.trip.departureTime;
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(departureTime)) {
    throw new HttpError(409, "INVALID_TRIP_SCHEDULE", "Trip departure time is invalid");
  }
  return new Date(`${tripDate}T${departureTime}:00+07:00`);
}

function cancelBookingService(id, identity) {
  return prisma.$transaction(async (tx) => {
    const booking = await tx.booking.findUnique({
      where: { id },
      include: { trip: { select: { departureTime: true } } },
    });
    if (!booking) {
      throw new HttpError(404, "BOOKING_NOT_FOUND", "Booking not found");
    }
    assertBookingAccess(booking, identity);
    if (!["pending", "confirmed"].includes(booking.status)) {
      throw new HttpError(409, "BOOKING_NOT_CANCELLABLE", "Booking cannot be cancelled");
    }
    if (getDepartureDateTime(booking) <= new Date()) {
      throw new HttpError(409, "CANCELLATION_DEADLINE_PASSED", "Booking can no longer be cancelled after departure");
    }

    const update = await tx.booking.updateMany({
      where: { id, status: { in: ["pending", "confirmed"] } },
      data: {
        status: "cancelled",
        ...(booking.paymentStatus === "paid" ? { paymentStatus: "refunded" } : {}),
      },
    });
    if (update.count !== 1) {
      throw new HttpError(409, "BOOKING_NOT_CANCELLABLE", "Booking cannot be cancelled");
    }

    await tx.seatStatus.updateMany({
      where: { bookingId: id, status: "booked" },
      data: { status: "available", bookingId: null },
    });

    return tx.booking.findUnique({ where: { id }, include: bookingInclude });
  });
}

function getMyBookingsService({ userId, phone, email }) {
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
  getMyBookingsService,
};
