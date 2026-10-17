const { prisma } = require("../../lib/prisma");

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

  if (!tripId) throw new Error("Mã chuyến đi (tripId) là bắt buộc");
  if (!tripDate) throw new Error("Ngày đi (tripDate) là bắt buộc");
  if (!passengerName || !passengerPhone) throw new Error("Họ tên và số điện thoại là bắt buộc");

  const date = new Date(tripDate);

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
    throw new Error("Vui lòng chọn ít nhất 1 chỗ ngồi");
  }

  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    include: { route: true, company: true, bus: true },
  });
  if (!trip) throw new Error("Không tìm thấy chuyến đi tương ứng");

  // Check seat availability
  const existingSeats = await prisma.seatStatus.findMany({
    where: {
      tripId,
      tripDate: date,
      seatCode: { in: seatList },
    },
  });

  for (const s of existingSeats) {
    if (s.status !== "available") {
      throw new Error(`Ghế ${s.seatCode} đã có người đặt, vui lòng chọn ghế khác`);
    }
  }

  // Generate unique booking code
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const bookingCode = `RW${Date.now().toString().slice(-6)}${randomSuffix}`;

  const calculatedTotal = totalPrice || trip.price * seatList.length;
  const seatCodeString = seatList.join(", ");

  return prisma.$transaction(async (tx) => {
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
        status: "pending", // Mới đặt -> Đang chờ duyệt
        paymentStatus: paymentMethod === "MoMo" || paymentMethod === "VNPAY" ? "paid" : "unpaid",
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

async function cancelBookingService(id) {
  return prisma.$transaction(async (tx) => {
    const booking = await tx.booking.findUnique({
      where: { id },
      include: { seatStatuses: true, trip: { include: { route: true } } },
    });
    if (!booking) throw new Error("Không tìm thấy đơn đặt vé");
    if (booking.status === "cancelled") throw new Error("Vé này đã được hủy trước đó");

    const updated = await tx.booking.update({
      where: { id },
      data: { status: "cancelled" },
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

    for (const seat of booking.seatStatuses) {
      await tx.seatStatus.update({
        where: { id: seat.id },
        data: { status: "available", bookingId: null },
      });
    }

    return updated;
  });
}

async function statusCheckService(codes) {
  if (!Array.isArray(codes) || codes.length === 0) return [];
  const cleanCodes = codes.map((c) => String(c).trim()).filter(Boolean);

  const bookings = await prisma.booking.findMany({
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

  return bookings;
}

async function getMyBookingsService(userId, phone, email) {
  const orConditions = [];
  if (userId) orConditions.push({ userId });
  if (phone) orConditions.push({ passengerPhone: phone });
  if (email) orConditions.push({ passengerEmail: email });

  if (orConditions.length === 0) return [];

  return prisma.booking.findMany({
    where: { OR: orConditions },
    orderBy: { createdAt: "desc" },
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

module.exports = {
  createBookingService,
  lookupBookingService,
  getBookingService,
  cancelBookingService,
  statusCheckService,
  getMyBookingsService,
};
