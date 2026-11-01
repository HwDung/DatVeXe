const PdfPrinter = require("pdfmake");
const { prisma } = require("../../lib/prisma");
const { HttpError } = require("../../utils/http-error");

const fontFiles = require("pdfmake/build/vfs_fonts");
const fonts = {
  Roboto: {
    normal: Buffer.from(fontFiles["Roboto-Regular.ttf"], "base64"),
    bold: Buffer.from(fontFiles["Roboto-Medium.ttf"], "base64"),
    italics: Buffer.from(fontFiles["Roboto-Italic.ttf"], "base64"),
    bolditalics: Buffer.from(fontFiles["Roboto-MediumItalic.ttf"], "base64"),
  },
};

const printer = new PdfPrinter(fonts);
const bookingInclude = {
  trip: {
    include: {
      route: true,
      company: true,
      bus: true,
    },
  },
};
const reportTitles = {
  bookings: "Báo cáo đặt vé",
  revenue: "Báo cáo doanh thu",
  trips: "Báo cáo chuyến xe",
  overview: "Báo cáo tổng quan",
};

function dateRangeWhere(fromDate, toDate, field = "createdAt") {
  if (!fromDate && !toDate) return {};
  const range = {};
  if (fromDate) range.gte = new Date(`${fromDate}T00:00:00.000Z`);
  if (toDate) range.lte = new Date(`${toDate}T23:59:59.999Z`);
  return { [field]: range };
}

function buildBookingWhere(filters) {
  const where = { ...dateRangeWhere(filters.fromDate, filters.toDate) };
  if (filters.status && filters.status !== "all") where.status = filters.status;
  if (filters.paymentStatus && filters.paymentStatus !== "all") {
    where.paymentStatus = filters.paymentStatus;
  }
  if (filters.companyId && filters.companyId !== "all") {
    where.trip = { ...where.trip, companyId: filters.companyId };
  }
  if (filters.routeId && filters.routeId !== "all") {
    where.trip = { ...where.trip, routeId: filters.routeId };
  }
  if (filters.search?.trim()) {
    const search = filters.search.trim();
    where.OR = [
      { bookingCode: { contains: search } },
      { passengerName: { contains: search } },
      { passengerPhone: { contains: search } },
      { passengerEmail: { contains: search } },
    ];
  }
  return where;
}

function formatDate(value, withTime = false) {
  if (!value) return "";
  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  }).format(new Date(value));
}

function formatCurrency(value) {
  return `${new Intl.NumberFormat("vi-VN").format(Number(value) || 0)} ₫`;
}

function getRouteName(trip) {
  const { origin, destination } = trip?.route ?? {};
  return origin && destination ? `${origin} - ${destination}` : "Không xác định";
}

function createTable(headers, rows, widths) {
  return {
    table: {
      headerRows: 1,
      widths,
      body: [
        headers.map((text) => ({ text, style: "tableHeader" })),
        ...rows.map((row) => row.map((text) => String(text ?? ""))),
      ],
    },
    layout: {
      fillColor: (rowIndex) => (rowIndex === 0 ? "#1D4ED8" : rowIndex % 2 === 0 ? "#F3F4F6" : null),
      hLineColor: () => "#D1D5DB",
      vLineColor: () => "#E5E7EB",
      paddingLeft: () => 6,
      paddingRight: () => 6,
      paddingTop: () => 5,
      paddingBottom: () => 5,
    },
  };
}

function createDocument({ title, generatedAt, filters, summary, table, landscape = false }) {
  const period = filters.fromDate || filters.toDate
    ? `${filters.fromDate ? formatDate(filters.fromDate) : "Từ trước"} - ${filters.toDate ? formatDate(filters.toDate) : "Hiện tại"}`
    : "Toàn bộ thời gian";
  return {
    info: { title, author: "DatVeXe" },
    pageSize: "A4",
    pageOrientation: landscape ? "landscape" : "portrait",
    pageMargins: [32, 42, 32, 42],
    defaultStyle: { font: "Roboto", fontSize: 8, color: "#1F2937" },
    styles: {
      title: { fontSize: 18, bold: true, color: "#1D4ED8", margin: [0, 0, 0, 8] },
      metadata: { fontSize: 9, color: "#4B5563", margin: [0, 0, 0, 4] },
      section: { fontSize: 11, bold: true, margin: [0, 14, 0, 6] },
      tableHeader: { bold: true, color: "#FFFFFF", fontSize: 8 },
      summary: { bold: true, fontSize: 9, margin: [0, 3, 0, 3] },
    },
    header: (currentPage, pageCount) => ({
      text: `DatVeXe  •  ${currentPage}/${pageCount}`,
      alignment: "right",
      margin: [32, 18, 32, 0],
      fontSize: 8,
      color: "#6B7280",
    }),
    footer: () => ({
      text: "Báo cáo được tạo tự động từ dữ liệu quản lý DatVeXe",
      alignment: "center",
      margin: [0, 0, 0, 16],
      fontSize: 8,
      color: "#6B7280",
    }),
    content: [
      { text: title, style: "title" },
      { text: `Thời gian lập báo cáo: ${formatDate(generatedAt, true)}`, style: "metadata" },
      { text: `Khoảng thời gian: ${period}`, style: "metadata" },
      { text: "TỔNG HỢP", style: "section" },
      ...summary.map((text) => ({ text, style: "summary" })),
      { text: "CHI TIẾT DỮ LIỆU", style: "section" },
      table,
    ],
  };
}

function renderPdf(documentDefinition) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    const pdf = printer.createPdfKitDocument(documentDefinition);
    pdf.on("data", (chunk) => chunks.push(chunk));
    pdf.on("end", () => resolve(Buffer.concat(chunks)));
    pdf.on("error", reject);
    pdf.end();
  });
}

function statusLabel(status) {
  return ({
    pending: "Chờ xử lý",
    confirmed: "Đã xác nhận",
    completed: "Hoàn thành",
    cancelled: "Đã hủy",
  })[status] ?? status ?? "Không xác định";
}

function paymentLabel(status) {
  return ({
    unpaid: "Chưa thanh toán",
    paid: "Đã thanh toán",
    refunded: "Đã hoàn tiền",
  })[status] ?? status ?? "Không xác định";
}

async function getBookingReport(filters, type, generatedAt) {
  const where = buildBookingWhere(filters);
  if (type === "revenue") where.paymentStatus = "paid";
  const bookings = await prisma.booking.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: bookingInclude,
  });
  if (bookings.length === 0) {
    throw new HttpError(404, "NO_REPORT_DATA", "Không có dữ liệu phù hợp để lập báo cáo");
  }

  const paidBookings = bookings.filter((booking) => booking.paymentStatus === "paid");
  const revenue = paidBookings.reduce((sum, booking) => sum + (Number(booking.totalPrice) || 0), 0);
  const summary = [
    `Tổng số đơn đặt vé: ${bookings.length}`,
    `Số đơn đã thanh toán: ${paidBookings.length}`,
    `Doanh thu thực thu: ${formatCurrency(revenue)}`,
    `Giá trị đơn trung bình đã thanh toán: ${formatCurrency(paidBookings.length ? Math.round(revenue / paidBookings.length) : 0)}`,
  ];

  let table;
  if (type === "revenue") {
    const byDate = new Map();
    for (const booking of bookings) {
      const key = formatDate(booking.createdAt);
      const entry = byDate.get(key) ?? { count: 0, revenue: 0 };
      entry.count += 1;
      entry.revenue += Number(booking.totalPrice) || 0;
      byDate.set(key, entry);
    }
    const rows = [...byDate.entries()].map(([date, totals]) => [date, totals.count, formatCurrency(totals.revenue)]);
    rows.push(["TỔNG CỘNG", bookings.length, formatCurrency(revenue)]);
    table = createTable(["Ngày đặt", "Số đơn đã thanh toán", "Doanh thu"], rows, ["*", 110, 150]);
  } else {
    const rows = bookings.map((booking) => [
      booking.bookingCode || booking.id,
      booking.passengerName,
      getRouteName(booking.trip),
      booking.trip?.company?.name,
      booking.seatCode,
      formatDate(booking.tripDate),
      formatCurrency(booking.totalPrice),
      statusLabel(booking.status),
      paymentLabel(booking.paymentStatus),
    ]);
    rows.push(["TỔNG CỘNG", `${bookings.length} đơn`, "", "", "", "", formatCurrency(revenue), "", ""]);
    table = createTable(
      ["Mã vé", "Hành khách", "Tuyến đường", "Nhà xe", "Ghế", "Ngày đi", "Giá vé", "Trạng thái", "Thanh toán"],
      rows,
      [62, 78, 90, 62, 36, 48, 62, 63, 62],
    );
  }

  return renderPdf(createDocument({
    title: reportTitles[type],
    generatedAt,
    filters,
    summary,
    table,
    landscape: true,
  }));
}

async function getTripReport(filters, generatedAt) {
  const where = {
    ...dateRangeWhere(filters.fromDate, filters.toDate, "availableDate"),
  };
  if (filters.companyId && filters.companyId !== "all") where.companyId = filters.companyId;
  if (filters.routeId && filters.routeId !== "all") where.routeId = filters.routeId;
  const trips = await prisma.trip.findMany({
    where,
    orderBy: [{ availableDate: "asc" }, { departureTime: "asc" }],
    include: { route: true, bus: true, company: true },
  });
  if (trips.length === 0) {
    throw new HttpError(404, "NO_REPORT_DATA", "Không có chuyến xe phù hợp để lập báo cáo");
  }

  const activeTrips = trips.filter((trip) => trip.isActive).length;
  const totalFare = trips.reduce((sum, trip) => sum + (Number(trip.price) || 0), 0);
  const rows = trips.map((trip) => [
    trip.id,
    getRouteName(trip),
    trip.bus?.name,
    trip.company?.name,
    formatDate(trip.availableDate),
    `${trip.departureTime} - ${trip.arrivalTime}`,
    formatCurrency(trip.price),
    trip.isActive ? "Đang hoạt động" : "Tạm dừng",
  ]);
  const table = createTable(
    ["Mã chuyến", "Tuyến đường", "Xe", "Nhà xe", "Ngày chạy", "Giờ chạy", "Giá vé", "Trạng thái"],
    rows,
    [90, 120, 90, 90, 65, 75, 70, 75],
  );
  return renderPdf(createDocument({
    title: reportTitles.trips,
    generatedAt,
    filters,
    summary: [
      `Tổng số chuyến xe: ${trips.length}`,
      `Chuyến đang hoạt động: ${activeTrips}`,
      `Chuyến tạm dừng: ${trips.length - activeTrips}`,
      `Giá vé trung bình: ${formatCurrency(Math.round(totalFare / trips.length))}`,
    ],
    table,
    landscape: true,
  }));
}

async function getOverviewReport(filters, generatedAt) {
  const bookingWhere = buildBookingWhere(filters);
  const [bookings, totalUsers, totalTrips, totalCompanies] = await Promise.all([
    prisma.booking.findMany({ where: bookingWhere, select: { totalPrice: true, paymentStatus: true } }),
    prisma.user.count(),
    prisma.trip.count(),
    prisma.busCompany.count(),
  ]);
  const paidBookings = bookings.filter((booking) => booking.paymentStatus === "paid");
  const revenue = paidBookings.reduce((sum, booking) => sum + (Number(booking.totalPrice) || 0), 0);
  const table = createTable(
    ["Chỉ số", "Giá trị"],
    [
      ["Người dùng", totalUsers],
      ["Chuyến xe", totalTrips],
      ["Nhà xe", totalCompanies],
      ["Đơn đặt vé trong kỳ", bookings.length],
      ["Đơn đã thanh toán", paidBookings.length],
      ["Doanh thu thực thu trong kỳ", formatCurrency(revenue)],
    ],
    ["*", 160],
  );
  return renderPdf(createDocument({
    title: reportTitles.overview,
    generatedAt,
    filters,
    summary: [
      `Người dùng: ${totalUsers}`,
      `Chuyến xe: ${totalTrips}`,
      `Nhà xe: ${totalCompanies}`,
      `Đơn đặt vé trong kỳ: ${bookings.length}`,
      `Doanh thu thực thu trong kỳ: ${formatCurrency(revenue)}`,
    ],
    table,
  }));
}

async function generatePdfReport({ type, filters, generatedAt = new Date() }) {
  if (!Object.hasOwn(reportTitles, type)) {
    throw new HttpError(400, "INVALID_REPORT_TYPE", "Loại báo cáo không hợp lệ");
  }
  if (type === "trips") return getTripReport(filters, generatedAt);
  if (type === "overview") return getOverviewReport(filters, generatedAt);
  return getBookingReport(filters, type, generatedAt);
}

module.exports = { generatePdfReport };
