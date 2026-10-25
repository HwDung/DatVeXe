const { prisma } = require("../../lib/prisma");
const { HttpError } = require("../../utils/http-error");
const ExcelJS = require("exceljs");

const tripInclude = { route: true, bus: true, company: true };

async function ensureReferencesExist({ routeId, busId, companyId }) {
  const [route, bus, company] = await Promise.all([
    prisma.route.findUnique({ where: { id: routeId }, select: { id: true } }),
    prisma.bus.findUnique({ where: { id: busId }, select: { id: true, companyId: true } }),
    prisma.busCompany.findUnique({ where: { id: companyId }, select: { id: true } }),
  ]);

  if (!route) {
    throw new HttpError(400, "INVALID_ROUTE", "Route not found");
  }
  if (!bus) {
    throw new HttpError(400, "INVALID_BUS", "Bus not found");
  }
  if (!company) {
    throw new HttpError(400, "INVALID_COMPANY", "Bus company not found");
  }
  if (bus.companyId !== companyId) {
    throw new HttpError(400, "BUS_COMPANY_MISMATCH", "Bus does not belong to the selected company");
  }
}

function listTrips() {
  return prisma.trip.findMany({
    include: tripInclude,
    orderBy: { createdAt: "desc" },
  });
}

async function exportTrips() {
  const trips = await prisma.trip.findMany({
    include: tripInclude,
    orderBy: { createdAt: "desc" },
  });
  if (trips.length === 0) {
    throw new HttpError(404, "NO_TRIPS_TO_EXPORT", "No trips are available to export");
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "DatVeXe Admin";
  const worksheet = workbook.addWorksheet("Chuyến xe");
  worksheet.columns = [
    { header: "Mã chuyến", key: "tripId", width: 24 },
    { header: "Tuyến đường", key: "route", width: 32 },
    { header: "Xe", key: "bus", width: 28 },
    { header: "Nhà xe", key: "company", width: 26 },
    { header: "Giờ khởi hành", key: "departureTime", width: 18 },
    { header: "Giờ đến", key: "arrivalTime", width: 18 },
    { header: "Thời lượng", key: "duration", width: 16 },
    { header: "Giá vé (VNĐ)", key: "price", width: 20, style: { numFmt: '#,##0 "₫"' } },
    { header: "Ngày chạy", key: "availableDate", width: 16, style: { numFmt: "dd/mm/yyyy" } },
    { header: "Trạng thái", key: "status", width: 16 },
  ];
  worksheet.addRows(trips.map((trip) => ({
    tripId: trip.id,
    route: trip.route ? `${trip.route.origin} - ${trip.route.destination}` : "",
    bus: trip.bus?.name ?? "",
    company: trip.company?.name ?? "",
    departureTime: trip.departureTime,
    arrivalTime: trip.arrivalTime,
    duration: trip.duration,
    price: trip.price,
    availableDate: trip.availableDate,
    status: trip.isActive ? "Đang hoạt động" : "Tạm dừng",
  })));
  worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  worksheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF1D4ED8" },
  };
  worksheet.views = [{ state: "frozen", ySplit: 1 }];
  worksheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: worksheet.columnCount },
  };
  return Buffer.from(await workbook.xlsx.writeBuffer());
}

async function getTrip(id) {
  const trip = await prisma.trip.findUnique({ where: { id }, include: tripInclude });
  if (!trip) {
    throw new HttpError(404, "TRIP_NOT_FOUND", "Trip not found");
  }
  return trip;
}

async function createTrip(data) {
  await ensureReferencesExist(data);
  return prisma.trip.create({ data, include: tripInclude });
}

async function updateTrip(id, data) {
  const currentTrip = await getTrip(id);
  await ensureReferencesExist({
    routeId: data.routeId ?? currentTrip.routeId,
    busId: data.busId ?? currentTrip.busId,
    companyId: data.companyId ?? currentTrip.companyId,
  });
  return prisma.trip.update({ where: { id }, data, include: tripInclude });
}

async function deleteTrip(id) {
  await prisma.trip.delete({ where: { id } });
  return { success: true };
}

module.exports = { listTrips, exportTrips, getTrip, createTrip, updateTrip, deleteTrip };