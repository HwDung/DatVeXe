const test = require("node:test");
const assert = require("node:assert/strict");
const ExcelJS = require("exceljs");

const prisma = {
  route: { findMany: async () => [{ id: "route_1" }] },
  bus: { findMany: async () => [{ id: "bus_1", companyId: "company_1" }] },
  busCompany: { findMany: async () => [{ id: "company_1" }] },
  trip: {
    findMany: async () => [],
    create: async ({ data }) => ({ id: `trip_${data.price}` }),
  },
};
const prismaModulePath = require.resolve("../src/lib/prisma");
require.cache[prismaModulePath] = {
  id: prismaModulePath,
  filename: prismaModulePath,
  loaded: true,
  exports: { prisma },
};
const { importTrips, previewTrips } = require("../src/modules/admin/trip-import.service");

async function makeWorkbook(rows) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Trips");
  worksheet.addRow([
    "routeId",
    "busId",
    "companyId",
    "departureTime",
    "arrivalTime",
    "duration",
    "price",
    "availableDate",
  ]);
  for (const row of rows) worksheet.addRow(row);
  return Buffer.from(await workbook.xlsx.writeBuffer());
}

function validRow(price = 250000) {
  return ["route_1", "bus_1", "company_1", "08:30", "13:00", "4h 30p", price, "2026-10-25"];
}

test("preview counts valid and invalid rows and reports errors by field without writing", async () => {
  let createCalls = 0;
  prisma.trip.create = async () => {
    createCalls += 1;
  };
  const invalid = validRow(-1);
  invalid[3] = "25:00";
  invalid[5] = "0h 75p";
  invalid[7] = "2026-02-30";
  const report = await previewTrips(await makeWorkbook([validRow(), invalid]));

  assert.equal(report.totalRows, 2);
  assert.equal(report.validRows, 1);
  assert.equal(report.invalidRows, 1);
  assert.deepEqual(
    report.preview[1].errors.map(({ field }) => field),
    ["departureTime", "duration", "price", "availableDate"],
  );
  assert.equal(createCalls, 0);
});

test("preview reports missing references, company mismatch, and duplicate schedules", async () => {
  prisma.route.findMany = async () => [{ id: "route_1" }];
  prisma.bus.findMany = async () => [{ id: "bus_1", companyId: "company_1" }];
  prisma.busCompany.findMany = async () => [{ id: "company_1" }];
  prisma.trip.findMany = async () => [{
    routeId: "route_1",
    busId: "bus_1",
    companyId: "company_1",
    departureTime: "08:30",
    availableDate: new Date("2026-10-25T00:00:00.000Z"),
  }];
  const wrongCompany = validRow();
  wrongCompany[2] = "company_other";
  const report = await previewTrips(await makeWorkbook([validRow(), wrongCompany]));

  assert.equal(report.validRows, 0);
  assert.equal(report.invalidRows, 2);
  assert.match(report.preview[0].errors[0].message, /already exists/i);
  assert.match(report.preview[1].errors[0].message, /does not belong/i);
  assert.match(report.preview[1].errors[1].message, /does not exist/i);
});

test("import revalidates and creates valid rows only, returning row-level failures", async () => {
  prisma.route.findMany = async () => [{ id: "route_1" }];
  prisma.bus.findMany = async () => [{ id: "bus_1", companyId: "company_1" }];
  prisma.busCompany.findMany = async () => [{ id: "company_1" }];
  prisma.trip.findMany = async () => [];
  const created = [];
  prisma.trip.create = async ({ data }) => {
    created.push(data);
    if (data.price === 300000) throw new Error("simulated database error");
    return { id: "created" };
  };

  const databaseFailure = validRow(300000);
  databaseFailure[3] = "09:30";
  const loggedErrors = [];
  const originalConsoleError = console.error;
  console.error = (...args) => loggedErrors.push(args);
  let report;
  try {
    report = await importTrips(await makeWorkbook([validRow(), validRow(-5), databaseFailure]));
  } finally {
    console.error = originalConsoleError;
  }
  assert.deepEqual(created.map(({ price }) => price), [250000, 300000]);
  assert.equal(report.importedRows, 1);
  assert.equal(report.failedRows, 2);
  assert.equal(report.validationFailures.length, 1);
  assert.equal(report.importFailures[0].rowNumber, 4);
  assert.equal(loggedErrors.length, 1);
});
