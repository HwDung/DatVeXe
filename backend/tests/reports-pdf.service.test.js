const test = require("node:test");
const assert = require("node:assert/strict");

const trip = {
  id: "trip_1",
  departureTime: "08:30",
  arrivalTime: "13:00",
  price: 250000,
  availableDate: new Date("2026-10-25T00:00:00.000Z"),
  isActive: true,
  route: { origin: "Hà Nội", destination: "Đà Nẵng" },
  bus: { name: "Xe giường nằm" },
  company: { name: "Nhà xe Việt" },
};
const booking = {
  id: "booking_1",
  bookingCode: "DVX001",
  passengerName: "Nguyễn Văn An",
  passengerPhone: "0900000000",
  passengerEmail: "an@example.com",
  seatCode: "A1",
  totalPrice: 250000,
  status: "confirmed",
  paymentStatus: "paid",
  tripDate: new Date("2026-10-25T00:00:00.000Z"),
  createdAt: new Date("2026-10-20T00:00:00.000Z"),
  trip,
};

let bookings = [booking];
let trips = [trip];
let bookingQuery;
const prismaModulePath = require.resolve("../src/lib/prisma");
require.cache[prismaModulePath] = {
  id: prismaModulePath,
  filename: prismaModulePath,
  loaded: true,
  exports: {
    prisma: {
      booking: {
        findMany: async (query) => {
          bookingQuery = query;
          return bookings;
        },
      },
      trip: { findMany: async () => trips, count: async () => 2 },
      user: { count: async () => 1 },
      busCompany: { count: async () => 1 },
    },
  },
};

const { generatePdfReport } = require("../src/modules/admin/reports-pdf.service");

test("generates a Vietnamese PDF report using filtered booking data", async () => {
  bookings = [booking];
  const pdf = await generatePdfReport({
    type: "bookings",
    filters: { fromDate: "2026-10-01", toDate: "2026-10-31", companyId: "company_1" },
    generatedAt: new Date("2026-10-26T12:00:00.000Z"),
  });

  assert.equal(pdf.subarray(0, 5).toString(), "%PDF-");
  assert.equal(bookingQuery.where.createdAt.gte.toISOString(), "2026-10-01T00:00:00.000Z");
  assert.equal(bookingQuery.where.trip.companyId, "company_1");
  assert.ok(pdf.length > 1000);
});

test("generates trip and overview reports from database queries", async () => {
  trips = [trip];
  const tripPdf = await generatePdfReport({ type: "trips", filters: {} });
  const overviewPdf = await generatePdfReport({ type: "overview", filters: {} });

  assert.equal(tripPdf.subarray(0, 5).toString(), "%PDF-");
  assert.equal(overviewPdf.subarray(0, 5).toString(), "%PDF-");
});

test("returns a clear error when a booking report has no matching data", async () => {
  bookings = [];
  await assert.rejects(
    generatePdfReport({ type: "revenue", filters: {} }),
    (error) => error.code === "NO_REPORT_DATA" && error.status === 404,
  );
});
