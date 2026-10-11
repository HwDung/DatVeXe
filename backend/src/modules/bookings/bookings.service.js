const { randomBytes } = require("node:crypto");
const { prisma } = require("../../lib/prisma");
const { HttpError } = require("../../utils/http-error");

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
    include: {
      trip: {
        include: {
          route: true,
          company: true,
          bus: true,
        },
      },
    },
  });
}

function getBookingService(id) {
  return prisma.booking.findUnique({
    where: { id },
    include: {
      trip: {
        include: {
          route: true,
          company: true,
          bus: true,
        },
      },
    },
  });
}

function cancelBookingService(id) {
  return prisma.$transaction(async (tx) => {
    const booking = await tx.booking.findUnique({ where: { id }, include: { seatStatuses: true } });
    if (!booking) throw new Error("Booking not found");
    if (booking.status === "cancelled") throw new Error("Booking already cancelled");

    const updated = await tx.booking.update({
      where: { id },
      data: { status: "cancelled" },
    });

    for (const seat of booking.seatStatuses) {
      await tx.seatStatus.update({
        where: { id: seat.id },
        data: { status: "available", bookingId: null },
      });
    }

    return updated;
  });
}

module.exports = {
  createBookingService,
  lookupBookingService,
  getBookingService,
  cancelBookingService,
};
