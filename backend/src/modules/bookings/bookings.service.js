const { prisma } = require("../../lib/prisma");

async function createBookingService(data) {
  const { tripId, tripDate, seatCode, passengerName, passengerPhone, passengerEmail, paymentMethod, userId } = data;

  const date = new Date(tripDate);

  const existingSeat = await prisma.seatStatus.findUnique({
    where: {
      tripId_tripDate_seatCode: {
        tripId,
        tripDate: date,
        seatCode,
      },
    },
  });

  if (existingSeat && existingSeat.status !== "available") {
    throw new Error("Seat is no longer available");
  }

  const trip = await prisma.trip.findUnique({ where: { id: tripId } });
  if (!trip) throw new Error("Trip not found");

  const bookingCode = `RW${Date.now()}${Math.floor(Math.random() * 1000)}`;

  return prisma.$transaction(async (tx) => {
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
      await tx.seatStatus.update({
        where: { id: existingSeat.id },
        data: { status: "booked", bookingId: newBooking.id },
      });
    } else {
      await tx.seatStatus.create({
        data: {
          tripId,
          tripDate: date,
          seatCode,
          status: "booked",
          bookingId: newBooking.id,
        },
      });
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
