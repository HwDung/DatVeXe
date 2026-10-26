const test = require("node:test");
const assert = require("node:assert/strict");

const prismaModulePath = require.resolve("../src/lib/prisma");
let bookings = [];
let reviews = [];
let upsertedReview;
let databaseError = null;
let lastBookingQuery;
let lastReviewQuery;
require.cache[prismaModulePath] = {
  id: prismaModulePath,
  filename: prismaModulePath,
  loaded: true,
  exports: {
    prisma: {
      booking: {
        findMany: async (query) => {
          if (databaseError) throw databaseError;
          lastBookingQuery = query;
          return bookings;
        },
        findUnique: async ({ where }) => bookings.find(({ id }) => id === where.id) ?? null,
      },
      bookingAnomalyReview: {
        findMany: async (query) => {
          lastReviewQuery = query;
          return reviews;
        },
        findUnique: async ({ where }) => reviews.find(({ bookingId }) => bookingId === where.bookingId) ?? null,
        upsert: async ({ where, create, update }) => {
          upsertedReview = { bookingId: where.bookingId, ...update, ...create };
          return { ...upsertedReview, updatedAt: new Date("2026-10-26T10:00:00Z") };
        },
      },
    },
  },
};

const { scoreBookings, listAnomalies, getAnomalyDetail, updateAnomalyReview } = require("../src/modules/admin/anomalies.service");
const anomaliesController = require("../src/modules/admin/anomalies.controller");

function createBooking(overrides = {}) {
  const number = overrides.number ?? 1;
  return {
    id: `booking_${number}`,
    bookingCode: `RW${number}`,
    tripId: "trip_1",
    userId: `user_${number}`,
    tripDate: new Date("2026-11-01T00:00:00.000Z"),
    passengerName: `Nguyễn An ${number}`,
    passengerPhone: `090000000${number}`,
    passengerEmail: `an${number}@example.com`,
    seatCode: "A1",
    totalPrice: 200000,
    status: "pending",
    paymentStatus: "unpaid",
    createdAt: new Date(`2026-10-26T10:0${number}:00.000Z`),
    tickets: [{
      id: `ticket_${number}`,
      seatCode: "A1",
      passengerName: `Nguyễn An ${number}`,
      passengerPhone: `090000000${number}`,
      passengerEmail: `an${number}@example.com`,
      price: 200000,
      status: "pending",
    }],
    seatStatuses: [{
      seatCode: "A1",
      status: "booked",
      bookingId: `booking_${number}`,
      ticketId: `ticket_${number}`,
    }],
    trip: {
      departureTime: "08:00",
      route: { origin: "Hà Nội", destination: "Đà Nẵng" },
    },
    ...overrides,
  };
}

test("flags duplicate active trip-date-seat records at high risk", () => {
  const results = scoreBookings([createBooking({ number: 1 }), createBooking({
    number: 2,
    passengerName: "Trần Bình",
    passengerPhone: "0911111111",
    passengerEmail: "binh@example.com",
    tickets: [{
      id: "ticket_2",
      seatCode: "A1",
      passengerName: "Trần Bình",
      passengerPhone: "0911111111",
      passengerEmail: "binh@example.com",
      price: 200000,
      status: "pending",
    }],
    seatStatuses: [{
      seatCode: "A1",
      status: "booked",
      bookingId: "booking_2",
      ticketId: "ticket_2",
    }],
  })]);

  assert.equal(results.length, 2);
  assert.equal(results[0].severity, "high");
  assert.ok(results[0].reasons.some(({ code }) => code === "duplicate_seat"));
  assert.ok(!JSON.stringify(results[0]).includes("0900000001"));
});

test("does not report a released seat as an active duplicate", () => {
  const active = createBooking({ number: 1 });
  const cancelled = createBooking({
    number: 2,
    status: "cancelled",
    seatStatuses: [],
    tickets: [{
      id: "ticket_2",
      seatCode: "A1",
      passengerName: "Trần Bình",
      passengerPhone: "0911111111",
      passengerEmail: "binh@example.com",
      price: 200000,
      status: "cancelled",
    }],
    passengerName: "Trần Bình",
    passengerPhone: "0911111111",
    passengerEmail: "binh@example.com",
  });

  assert.deepEqual(scoreBookings([active, cancelled]), []);
});

test("classifies similar passenger names with distinct contact and seats as low risk", () => {
  const first = createBooking({
    number: 1,
    passengerName: "Nguyễn Văn An",
    seatCode: "A1",
    tickets: [{
      id: "ticket_1",
      seatCode: "A1",
      passengerName: "Nguyễn Văn An",
      passengerPhone: "0900000001",
      passengerEmail: "an1@example.com",
      price: 200000,
      status: "pending",
    }],
  });
  const second = createBooking({
    number: 2,
    passengerName: "Nguyễn Văn Anh",
    passengerPhone: "0911111111",
    passengerEmail: "anh@example.com",
    seatCode: "A2",
    tickets: [{
      id: "ticket_2",
      seatCode: "A2",
      passengerName: "Nguyễn Văn Anh",
      passengerPhone: "0911111111",
      passengerEmail: "anh@example.com",
      price: 200000,
      status: "pending",
    }],
    seatStatuses: [{
      seatCode: "A2",
      status: "booked",
      bookingId: "booking_2",
      ticketId: "ticket_2",
    }],
  });

  const results = scoreBookings([first, second]);
  assert.equal(results.length, 2);
  assert.ok(results.every((item) => item.severity === "low"));
  assert.ok(results.every((item) => item.reasons.some(({ code }) => code === "similar_passenger")));
});

test("detects rapid booking bursts and inconsistent ticket totals", () => {
  const burst = Array.from({ length: 4 }, (_, index) => {
    const number = index + 1;
    const booking = createBooking({
      number,
      tripId: `trip_${number}`,
      seatCode: `A${number}`,
      passengerPhone: "0900000000",
      passengerEmail: "shared@example.com",
      totalPrice: 180000,
      createdAt: new Date(`2026-10-26T10:0${index}:00.000Z`),
      tickets: [{
        id: `ticket_${number}`,
        seatCode: `A${number}`,
        passengerName: `Khách ${number}`,
        passengerPhone: "0900000000",
        passengerEmail: "shared@example.com",
        price: 200000,
        status: "pending",
      }],
      seatStatuses: [{
        seatCode: `A${number}`,
        status: "booked",
        bookingId: `booking_${number}`,
        ticketId: `ticket_${number}`,
      }],
    });
    return booking;
  });

  const results = scoreBookings(burst);
  assert.equal(results.length, 4);
  assert.ok(results.every((item) => item.reasons.some(({ code }) => code === "rapid_bookings")));
  assert.ok(results.every((item) => item.reasons.some(({ code }) => code === "price_mismatch")));
});

test("assigns medium risk to a booking with inconsistent passenger and ticket data", () => {
  const booking = createBooking({
    number: 1,
    totalPrice: 150000,
    tickets: [{
      id: "ticket_1",
      seatCode: "A1",
      passengerName: "Tên khác",
      passengerPhone: "0900000001",
      passengerEmail: "an1@example.com",
      price: 200000,
      status: "pending",
    }],
  });
  const [result] = scoreBookings([booking]);

  assert.equal(result.score, 55);
  assert.equal(result.severity, "medium");
  assert.deepEqual(
    result.reasons.map(({ code }) => code).sort(),
    ["passenger_data_mismatch", "price_mismatch"],
  );
});

test("lists review status and persists manual review without changing booking state", async () => {
  bookings = [createBooking({ number: 1 }), createBooking({ number: 2 })];
  reviews = [{ bookingId: "booking_1", status: "reviewed", note: "Đã xác minh", updatedAt: new Date() }];
  const result = await listAnomalies({ page: 1, pageSize: 20 });

  assert.equal(result.items[0].review.status, "reviewed");
  assert.equal(result.items.length, 2);

  const updated = await updateAnomalyReview("booking_1", { status: "false_positive" }, "admin_1");
  assert.equal(updated.status, "false_positive");
  assert.equal(upsertedReview.reviewedById, "admin_1");

  await updateAnomalyReview("booking_1", { status: "in_review" }, "admin_1");
  assert.equal(upsertedReview.status, "in_review");
});

test("filters anomaly results by trip, date range, severity, review status, and pagination", async () => {
  bookings = [createBooking({ number: 1 }), createBooking({ number: 2 })];
  reviews = [];
  const result = await listAnomalies({
    tripId: "trip_1",
    fromDate: "2026-11-01",
    toDate: "2026-11-01",
    severity: "high",
    reviewStatus: "open",
    page: 2,
    pageSize: 1,
  });

  assert.equal(lastBookingQuery.where.tripId, "trip_1");
  assert.equal(lastBookingQuery.where.tripDate.gte.toISOString(), "2026-11-01T00:00:00.000Z");
  assert.equal(lastBookingQuery.take, 2001);
  assert.deepEqual(lastReviewQuery.where.bookingId.in.sort(), ["booking_1", "booking_2"]);
  assert.equal(result.pagination.page, 2);
  assert.equal(result.items.length, 1);
  assert.equal(result.items[0].bookingId, "booking_2");
});

test("returns a detailed finding with reasons and masked ticket data", async () => {
  const duplicate = createBooking({ number: 1 });
  const peer = createBooking({
    number: 2,
    passengerName: "Trần Bình",
    passengerPhone: "0911111111",
    passengerEmail: "binh@example.com",
    tickets: [{
      id: "ticket_2",
      ticketCode: "TK-2",
      seatCode: "A1",
      passengerName: "Trần Bình",
      passengerPhone: "0911111111",
      passengerEmail: "binh@example.com",
      price: 200000,
      status: "pending",
    }],
    seatStatuses: [{
      seatCode: "A1",
      status: "booked",
      bookingId: "booking_2",
      ticketId: "ticket_2",
    }],
  });
  duplicate.tickets[0].ticketCode = "TK-1";
  bookings = [duplicate, peer];
  reviews = [{ bookingId: "booking_1", status: "in_review", note: "Đang đối chiếu", updatedAt: new Date() }];

  const result = await getAnomalyDetail("booking_1");

  assert.equal(result.bookingCode, "RW1");
  assert.equal(result.severity, "high");
  assert.ok(result.reasons.some(({ code }) => code === "duplicate_seat"));
  assert.equal(result.review.status, "in_review");
  assert.equal(result.booking.tickets[0].ticketCode, "TK-1");
  assert.ok(!JSON.stringify(result).includes("0900000001"));
  assert.equal(result.relatedBookings[0].bookingCode, "RW2");
});

test("returns not found for missing booking and booking without anomaly", async () => {
  bookings = [];
  await assert.rejects(getAnomalyDetail("missing"), (error) => error.status === 404 && error.code === "BOOKING_NOT_FOUND");

  const ordinaryBooking = createBooking({
    number: 3,
    status: "cancelled",
    seatStatuses: [],
    tickets: [],
  });
  bookings = [ordinaryBooking];
  await assert.rejects(getAnomalyDetail(ordinaryBooking.id), (error) => error.status === 404 && error.code === "ANOMALY_NOT_FOUND");
});

test("propagates database failures and reports empty lists without hiding errors", async () => {
  bookings = [];
  const empty = await listAnomalies({ page: 1, pageSize: 20 });
  assert.equal(empty.pagination.total, 0);
  assert.deepEqual(empty.items, []);

  databaseError = new Error("database unavailable");
  await assert.rejects(listAnomalies({ page: 1, pageSize: 20 }), /database unavailable/);
  databaseError = null;

  let receivedError;
  await anomaliesController.listAnomalies(
    { query: { pageSize: "101" } },
    { json: () => assert.fail("invalid request must not return data") },
    (error) => { receivedError = error; },
  );
  assert.equal(receivedError.name, "ZodError");
});

test("converts API validation and database failures through the shared error handler", async () => {
  const { errorHandler } = require("../src/middleware/error-handler");
  let responseStatus;
  let responseBody;
  const response = {
    status(status) {
      responseStatus = status;
      return this;
    },
    json(body) {
      responseBody = body;
    },
  };

  await anomaliesController.updateReview(
    { params: { bookingId: "booking_1" }, body: { status: "cancelled" }, auth: { userId: "admin_1" } },
    { json: () => assert.fail("invalid review status must not return success") },
    (error) => errorHandler(error, {}, response, () => {}),
  );
  assert.equal(responseStatus, 400);
  assert.equal(responseBody.error.code, "VALIDATION_ERROR");

  databaseError = new Error("database unavailable");
  let databaseFailure;
  await anomaliesController.listAnomalies(
    { query: { page: "1", pageSize: "10" } },
    { json: () => assert.fail("database error must not return success") },
    (error) => { databaseFailure = error; },
  );
  databaseError = null;
  const originalConsoleError = console.error;
  console.error = () => {};
  try {
    errorHandler(databaseFailure, {}, response, () => {});
  } finally {
    console.error = originalConsoleError;
  }
  assert.equal(responseStatus, 500);
  assert.equal(responseBody.error.code, "INTERNAL_ERROR");
});
