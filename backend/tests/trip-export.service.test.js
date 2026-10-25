const test = require("node:test");
const assert = require("node:assert/strict");
const ExcelJS = require("exceljs");

const tripRecord = {
  id: "trip_1",
  departureTime: "08:30",
  arrivalTime: "13:00",
  duration: "4h 30p",
  price: 250000,
  availableDate: new Date("2026-10-25T00:00:00.000Z"),
  isActive: true,
  route: { origin: "Hà Nội", destination: "Đà Nẵng" },
  bus: { name: "Xe giường nằm 40 chỗ" },
  company: { name: "Rightway" },
};
let trips = [tripRecord];
const prismaModulePath = require.resolve("../src/lib/prisma");
require.cache[prismaModulePath] = {
  id: prismaModulePath,
  filename: prismaModulePath,
  loaded: true,
  exports: { prisma: { trip: { findMany: async () => trips } } },
};
const { exportTrips } = require("../src/modules/admin/trip-management.service");

test("exports trip data with readable headers and Excel formats", async () => {
  trips = [tripRecord];
  const buffer = await exportTrips();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const worksheet = workbook.getWorksheet("Chuyến xe");

  assert.equal(worksheet.getRow(1).getCell(1).value, "Mã chuyến");
  assert.equal(worksheet.getRow(1).getCell(8).value, "Giá vé (VNĐ)");
  assert.equal(worksheet.getRow(2).getCell(2).value, "Hà Nội - Đà Nẵng");
  assert.equal(worksheet.getRow(2).getCell(3).value, "Xe giường nằm 40 chỗ");
  assert.equal(worksheet.getRow(2).getCell(4).value, "Rightway");
  assert.equal(worksheet.getRow(2).getCell(5).value, "08:30");
  assert.equal(worksheet.getRow(2).getCell(8).value, 250000);
  assert.equal(worksheet.getRow(2).getCell(8).numFmt, '#,##0 "₫"');
  assert.equal(worksheet.getRow(2).getCell(9).value.toISOString(), "2026-10-25T00:00:00.000Z");
  assert.equal(worksheet.getRow(2).getCell(9).numFmt, "dd/mm/yyyy");
  assert.equal(worksheet.getRow(2).getCell(10).value, "Đang hoạt động");
});

test("returns a clear error when there are no trips to export", async () => {
  trips = [];
  await assert.rejects(exportTrips(), (error) => {
    assert.equal(error.code, "NO_TRIPS_TO_EXPORT");
    assert.equal(error.status, 404);
    return true;
  });
});
