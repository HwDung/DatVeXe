const { prisma } = require("../../lib/prisma");
const { HttpError } = require("../../utils/http-error");

const SCAN_LIMIT = 2000;
const MINIMUM_SCORE = 15;
const activeBookingStatuses = new Set(["pending", "confirmed", "completed"]);
const bookingStatuses = new Set(["pending", "confirmed", "cancelled", "completed"]);
const paymentStatuses = new Set(["unpaid", "paid", "refunded"]);

function normalizeText(value) {
  return String(value ?? "")
    .replace(/[Đđ]/g, "d")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function normalizePhone(value) {
  return String(value ?? "").replace(/\D/g, "");
}

function normalizeEmail(value) {
  return String(value ?? "").trim().toLowerCase();
}

function hasDifferentContact(left, right) {
  const leftPhone = normalizePhone(left.passengerPhone);
  const rightPhone = normalizePhone(right.passengerPhone);
  const leftEmail = normalizeEmail(left.passengerEmail);
  const rightEmail = normalizeEmail(right.passengerEmail);
  return (leftPhone && rightPhone && leftPhone !== rightPhone)
    || (leftEmail && rightEmail && leftEmail !== rightEmail);
}

function getSeatCodes(booking) {
  const source = booking.tickets?.length
    ? booking.tickets.map(({ seatCode }) => seatCode)
    : String(booking.seatCode ?? "").split(",");
  return [...new Set(source.map((seat) => String(seat).trim().toUpperCase()).filter(Boolean))];
}

function nameSimilarity(left, right) {
  const first = normalizeText(left);
  const second = normalizeText(right);
  if (first.length < 2 || second.length < 2) return 0;
  const bigrams = (text) => {
    const result = new Map();
    for (let index = 0; index < text.length - 1; index += 1) {
      const pair = text.slice(index, index + 2);
      result.set(pair, (result.get(pair) ?? 0) + 1);
    }
    return result;
  };
  const firstPairs = bigrams(first);
  const secondPairs = bigrams(second);
  let intersection = 0;
  for (const [pair, count] of firstPairs) {
    intersection += Math.min(count, secondPairs.get(pair) ?? 0);
  }
  return (2 * intersection) / (first.length + second.length - 2);
}

function getRiskLevel(score) {
  if (score >= 70) return "high";
  if (score >= 40) return "medium";
  return "low";
}

function maskName(name) {
  const parts = String(name ?? "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "Không xác định";
  return `${parts.map((part) => `${[...part][0]}${"*".repeat(Math.min(Math.max([...part].length - 1, 2), 5))}`).join(" ")}`;
}

function addReason(record, code, points, description) {
  if (record.reasons.some((reason) => reason.code === code)) return;
  record.score += points;
  record.reasons.push({ code, points, description });
}

function seatKey(booking, seatCode) {
  return `${booking.tripId}|${new Date(booking.tripDate).toISOString().slice(0, 10)}|${seatCode}`;
}

function journeyKey(booking) {
  return `${booking.tripId}|${new Date(booking.tripDate).toISOString().slice(0, 10)}`;
}

function createRecord(booking) {
  return { booking, score: 0, reasons: [] };
}

function scoreBookings(bookings) {
  const records = bookings.map(createRecord);
  const activeRecords = records.filter(({ booking }) => activeBookingStatuses.has(booking.status));
  const seats = new Map();
  const journeys = new Map();
  const passengers = new Map();

  for (const record of records) {
    const { booking } = record;
    const seatCodes = getSeatCodes(booking);
    const summarySeats = [...new Set(String(booking.seatCode ?? "").split(",")
      .map((seat) => seat.trim().toUpperCase()).filter(Boolean))];
    if (booking.tickets?.length && (
      seatCodes.length !== summarySeats.length
      || seatCodes.some((seat) => !summarySeats.includes(seat))
    )) {
      addReason(record, "seat_data_mismatch", 35, "Danh sách ghế trong booking không khớp với danh sách vé");
    }
    if (booking.tickets?.length) {
      const ticketTotal = booking.tickets.reduce((sum, ticket) => sum + (Number(ticket.price) || 0), 0);
      if (ticketTotal !== Number(booking.totalPrice)) {
        addReason(record, "price_mismatch", 30, "Tổng tiền booking không khớp với tổng giá vé chi tiết");
      }
      const contactMismatch = booking.tickets.some((ticket) => (
        normalizePhone(ticket.passengerPhone) !== normalizePhone(booking.passengerPhone)
        || normalizeEmail(ticket.passengerEmail) !== normalizeEmail(booking.passengerEmail)
        || normalizeText(ticket.passengerName) !== normalizeText(booking.passengerName)
      ));
      if (contactMismatch) {
        addReason(record, "passenger_data_mismatch", 25, "Thông tin hành khách trong vé không khớp booking");
      }
      const expectedTicketStatus = {
        pending: "pending",
        confirmed: "confirmed",
        completed: "completed",
        cancelled: "cancelled",
      }[booking.status];
      if (booking.tickets.some((ticket) => ticket.status !== expectedTicketStatus)) {
        addReason(record, "ticket_status_mismatch", 25, "Trạng thái vé chi tiết không khớp trạng thái booking");
      }
    }
    if (!bookingStatuses.has(booking.status) || !paymentStatuses.has(booking.paymentStatus)) {
      addReason(record, "invalid_status", 25, "Trạng thái booking hoặc thanh toán không hợp lệ");
    }

    if (activeBookingStatuses.has(booking.status)) {
      const seatStatusByCode = new Map((booking.seatStatuses ?? []).map((seatStatus) => [seatStatus.seatCode, seatStatus]));
      const hasInvalidSeatStatus = seatCodes.some((seatCode) => {
        const seatStatus = seatStatusByCode.get(seatCode);
        return !seatStatus
          || seatStatus.bookingId !== booking.id
          || seatStatus.status !== "booked"
          || (seatStatus.ticketId && !booking.tickets?.some((ticket) => ticket.id === seatStatus.ticketId));
      });
      if (hasInvalidSeatStatus) {
        addReason(record, "seat_status_mismatch", 25, "Trạng thái ghế không khớp booking hoặc vé đang lưu");
      }
    }

    for (const seatCode of seatCodes) {
      const key = seatKey(booking, seatCode);
      const group = seats.get(key) ?? [];
      group.push(record);
      seats.set(key, group);
    }

    const key = journeyKey(booking);
    const journey = journeys.get(key) ?? [];
    journey.push(record);
    journeys.set(key, journey);

    const identities = [
      normalizePhone(booking.passengerPhone) && `phone:${normalizePhone(booking.passengerPhone)}`,
      normalizeEmail(booking.passengerEmail) && `email:${normalizeEmail(booking.passengerEmail)}`,
      booking.userId && `user:${booking.userId}`,
    ].filter(Boolean);
    for (const identity of identities) {
      const passengerKey = `${key}|${identity}`;
      const passengerGroup = passengers.get(passengerKey) ?? [];
      passengerGroup.push(record);
      passengers.set(passengerKey, passengerGroup);
    }
  }

  for (const group of seats.values()) {
    const occupied = group.filter(({ booking }) => activeBookingStatuses.has(booking.status));
    if (occupied.length > 1) {
      const codes = occupied.map(({ booking }) => booking.bookingCode).join(", ");
      for (const record of occupied) {
        addReason(
          record,
          "duplicate_seat",
          70,
          `Ghế ${getSeatCodes(record.booking).filter((seat) => seatKey(record.booking, seat) === seatKey(group[0].booking, seat))[0]} đang xuất hiện ở nhiều booking (${codes})`,
        );
      }
    }
  }

  for (const group of passengers.values()) {
    const active = group.filter(({ booking }) => activeBookingStatuses.has(booking.status));
    if (active.length > 1) {
      for (const record of active) {
        addReason(
          record,
          "repeated_passenger",
          25,
          `Thông tin liên hệ được dùng cho ${active.length} booking cùng chuyến và ngày`,
        );
      }
    }
  }

  for (const group of journeys.values()) {
    const active = group.filter(({ booking }) => activeBookingStatuses.has(booking.status));
    const uniqueNames = new Map();
    for (const record of active) {
      const normalizedName = normalizeText(record.booking.passengerName);
      const nameGroup = uniqueNames.get(normalizedName) ?? [];
      nameGroup.push(record);
      uniqueNames.set(normalizedName, nameGroup);
    }
    const names = [...uniqueNames.entries()];
    let comparisons = 0;
    for (const [, sameNameGroup] of names) {
      for (let leftIndex = 0; leftIndex < sameNameGroup.length; leftIndex += 1) {
        for (
          let rightIndex = leftIndex + 1;
          rightIndex < sameNameGroup.length && comparisons < 20000;
          rightIndex += 1
        ) {
          comparisons += 1;
          const left = sameNameGroup[leftIndex];
          const right = sameNameGroup[rightIndex];
          if (hasDifferentContact(left.booking, right.booking)) {
            for (const record of [left, right]) {
              addReason(record, "similar_passenger", 15, "Tên hành khách trùng với booking khác nhưng thông tin liên hệ khác nhau");
            }
          }
        }
      }
    }
    for (let leftIndex = 0; leftIndex < names.length; leftIndex += 1) {
      for (let rightIndex = leftIndex + 1; rightIndex < names.length && comparisons < 20000; rightIndex += 1) {
        comparisons += 1;
        const leftName = names[leftIndex][0];
        const rightName = names[rightIndex][0];
        if (Math.abs(leftName.length - rightName.length) > 3) continue;
        if (nameSimilarity(leftName, rightName) >= 0.84) {
          for (const left of names[leftIndex][1]) {
            for (const right of names[rightIndex][1]) {
              if (hasDifferentContact(left.booking, right.booking)) {
                for (const record of [left, right]) {
                  addReason(record, "similar_passenger", 15, "Tên hành khách tương tự một booking khác; thông tin liên hệ khác nhau");
                }
              }
            }
          }
        }
      }
    }
  }

  const burstGroups = new Map();
  for (const record of activeRecords) {
    const { booking } = record;
    const phone = normalizePhone(booking.passengerPhone);
    const email = normalizeEmail(booking.passengerEmail);
    const identities = [
      phone && `phone:${phone}`,
      email && `email:${email}`,
      booking.userId && `user:${booking.userId}`,
    ].filter(Boolean);
    for (const identity of identities) {
      const group = burstGroups.get(identity) ?? [];
      group.push(record);
      burstGroups.set(identity, group);
    }
  }
  for (const group of burstGroups.values()) {
    group.sort((left, right) => new Date(left.booking.createdAt) - new Date(right.booking.createdAt));
    let end = 0;
    for (let start = 0; start < group.length; start += 1) {
      if (end < start) end = start;
      while (
        end < group.length
        && new Date(group[end].booking.createdAt) - new Date(group[start].booking.createdAt) <= 10 * 60 * 1000
      ) {
        end += 1;
      }
      if (end - start >= 4) {
        const windowSize = end - start;
        for (const record of group.slice(start, start + 4)) {
          addReason(record, "rapid_bookings", 35, `${windowSize} booking được tạo trong khoảng 10 phút bằng cùng thông tin liên hệ`);
        }
      }
    }
  }

  return records
    .filter((record) => record.score >= MINIMUM_SCORE)
    .map(({ booking, score, reasons }) => ({
      bookingId: booking.id,
      bookingCode: booking.bookingCode,
      passengerName: maskName(booking.passengerName),
      tripId: booking.tripId,
      tripDate: booking.tripDate,
      route: booking.trip?.route
        ? `${booking.trip.route.origin} - ${booking.trip.route.destination}`
        : "Không xác định",
      departureTime: booking.trip?.departureTime ?? "",
      seats: getSeatCodes(booking),
      bookingStatus: booking.status,
      paymentStatus: booking.paymentStatus,
      createdAt: booking.createdAt,
      score: Math.min(score, 100),
      severity: getRiskLevel(score),
      reasons,
      review: { status: "open", note: null, updatedAt: null },
    }));
}

function buildWhere(filters) {
  const where = {};
  if (filters.fromDate || filters.toDate) {
    where.tripDate = {};
    if (filters.fromDate) where.tripDate.gte = new Date(`${filters.fromDate}T00:00:00.000Z`);
    if (filters.toDate) where.tripDate.lte = new Date(`${filters.toDate}T00:00:00.000Z`);
  }
  return where;
}

function matchesSearch(booking, search) {
  if (!search) return true;
  const needle = search.toLocaleLowerCase();
  return [
    booking.bookingCode,
    booking.passengerName,
    booking.passengerPhone,
    booking.passengerEmail,
  ].some((value) => String(value ?? "").toLocaleLowerCase().includes(needle));
}

async function listAnomalies(filters) {
  const bookings = await prisma.booking.findMany({
    where: buildWhere(filters),
    take: SCAN_LIMIT + 1,
    orderBy: [{ createdAt: "desc" }, { id: "asc" }],
    select: {
      id: true,
      bookingCode: true,
      tripId: true,
      userId: true,
      tripDate: true,
      passengerName: true,
      passengerPhone: true,
      passengerEmail: true,
      seatCode: true,
      totalPrice: true,
      status: true,
      paymentStatus: true,
      createdAt: true,
      tickets: {
        select: {
          id: true,
          seatCode: true,
          passengerName: true,
          passengerPhone: true,
          passengerEmail: true,
          price: true,
          status: true,
        },
      },
      seatStatuses: {
        select: { seatCode: true, status: true, bookingId: true, ticketId: true },
      },
      trip: {
        select: {
          departureTime: true,
          route: { select: { origin: true, destination: true } },
        },
      },
    },
  });

  const scanLimitReached = bookings.length > SCAN_LIMIT;
  const scannedBookings = bookings.slice(0, SCAN_LIMIT);
  const matchingBookingIds = new Set(
    scannedBookings
      .filter((booking) => matchesSearch(booking, filters.search))
      .map(({ id }) => id),
  );
  const anomalies = scoreBookings(scannedBookings)
    .filter(({ bookingId }) => matchingBookingIds.has(bookingId));
  const bookingIds = anomalies.map(({ bookingId }) => bookingId);
  const reviews = bookingIds.length
    ? await prisma.bookingAnomalyReview.findMany({ where: { bookingId: { in: bookingIds } } })
    : [];
  const reviewByBooking = new Map(reviews.map((review) => [review.bookingId, review]));

  let results = anomalies.map((anomaly) => {
    const review = reviewByBooking.get(anomaly.bookingId);
    return {
      ...anomaly,
      review: review
        ? { status: review.status, note: review.note, updatedAt: review.updatedAt }
        : anomaly.review,
    };
  });
  if (filters.severity) results = results.filter((item) => item.severity === filters.severity);
  if (filters.reviewStatus) results = results.filter((item) => item.review.status === filters.reviewStatus);

  const total = results.length;
  const start = (filters.page - 1) * filters.pageSize;
  return {
    items: results.slice(start, start + filters.pageSize),
    pagination: { page: filters.page, pageSize: filters.pageSize, total },
    scannedCount: scannedBookings.length,
    scanLimit: SCAN_LIMIT,
    scanLimitReached,
  };
}

async function updateAnomalyReview(bookingId, input, reviewedById) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { id: true },
  });
  if (!booking) throw new HttpError(404, "BOOKING_NOT_FOUND", "Booking not found");

  const review = await prisma.bookingAnomalyReview.upsert({
    where: { bookingId },
    create: { bookingId, status: input.status, note: input.note ?? null, reviewedById },
    update: { status: input.status, note: input.note ?? null, reviewedById },
  });
  return {
    bookingId: review.bookingId,
    status: review.status,
    note: review.note,
    updatedAt: review.updatedAt,
  };
}

module.exports = {
  listAnomalies,
  updateAnomalyReview,
  scoreBookings,
  nameSimilarity,
  getRiskLevel,
  SCAN_LIMIT,
};
