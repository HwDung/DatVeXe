const test = require("node:test");
const assert = require("node:assert/strict");

const prismaModulePath = require.resolve("../src/lib/prisma");
let bookings = [];
let reviews = [];
let upsertedReview;
require.cache[prismaModulePath] = {
  id: prismaModulePath,
  filename: prismaModulePath,
  loaded: true,
  exports: {
    prisma: {
      booking: {
        findMany: async () => bookings,
        findUnique: async ({ where }) => ({ id: where.id }),
      },
      bookingAnomalyReview: {
        findMany: async () => reviews,
        upsert: async ({ where, create, update }) => {
          upsertedReview = { bookingId: where.bookingId, ...update, ...create };
          return { ...upsertedReview, updatedAt: new Date("2026-10-26T10:00:00Z") };
        },
      },
    },
  },
};

const { scoreBookings, listAnomalies, updateAnomalyReview } = require("../src/modules/admin/anomalies.service");

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
});
