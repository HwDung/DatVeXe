const { Prisma } = require("@prisma/client");
const ExcelJS = require("exceljs");
const { prisma } = require("../../lib/prisma");
const { HttpError } = require("../../utils/http-error");
const { createTripSchema } = require("./trip-management.schemas");

const MAX_IMPORT_ROWS = 300;
const PREVIEW_LIMIT = 100;
const MAX_WORKBOOK_UNCOMPRESSED_BYTES = 20 * 1024 * 1024;
const MAX_WORKBOOK_ENTRIES = 1000;
const allowedHeaders = new Set([
  "routeid",
  "busid",
  "companyid",
  "departuretime",
  "arrivaltime",
  "duration",
  "price",
  "availabledate",
  "isactive",
]);
const requiredHeaders = [
  "routeid",
  "busid",
  "companyid",
  "departuretime",
  "arrivaltime",
  "duration",
  "price",
];

function invalidWorkbook(message) {
  return new HttpError(400, "INVALID_EXCEL_FILE", message);
}

function validateZipContainer(buffer) {
  const minimumEocdLength = 22;
  if (buffer.length < minimumEocdLength) {
    throw invalidWorkbook("File is damaged or is not a readable Excel workbook");
  }

  const earliestEocdOffset = Math.max(0, buffer.length - 0xffff - minimumEocdLength);
  let eocdOffset = -1;
  for (let offset = buffer.length - minimumEocdLength; offset >= earliestEocdOffset; offset -= 1) {
    if (
      buffer.readUInt32LE(offset) === 0x06054b50 &&
      offset + minimumEocdLength + buffer.readUInt16LE(offset + 20) === buffer.length
    ) {
      eocdOffset = offset;
      break;
    }
  }
  if (eocdOffset < 0) {
    throw invalidWorkbook("File is damaged or is not a readable Excel workbook");
  }

  const diskNumber = buffer.readUInt16LE(eocdOffset + 4);
  const centralDirectoryDisk = buffer.readUInt16LE(eocdOffset + 6);
  const entriesOnDisk = buffer.readUInt16LE(eocdOffset + 8);
  const totalEntries = buffer.readUInt16LE(eocdOffset + 10);
  const centralDirectorySize = buffer.readUInt32LE(eocdOffset + 12);
  const centralDirectoryOffset = buffer.readUInt32LE(eocdOffset + 16);
  const commentLength = buffer.readUInt16LE(eocdOffset + 20);
  if (
    eocdOffset + minimumEocdLength + commentLength !== buffer.length ||
    diskNumber !== 0 ||
    centralDirectoryDisk !== 0 ||
    entriesOnDisk !== totalEntries ||
    totalEntries === 0xffff ||
    centralDirectorySize === 0xffffffff ||
    centralDirectoryOffset === 0xffffffff ||
    centralDirectoryOffset + centralDirectorySize > eocdOffset
  ) {
    throw invalidWorkbook("Excel workbook uses an unsupported or damaged ZIP structure");
  }
  if (totalEntries > MAX_WORKBOOK_ENTRIES) {
    throw invalidWorkbook(`Excel workbook cannot contain more than ${MAX_WORKBOOK_ENTRIES} files`);
  }

  let offset = centralDirectoryOffset;
  let uncompressedBytes = 0;
  for (let entry = 0; entry < totalEntries; entry += 1) {
    if (offset + 46 > eocdOffset || buffer.readUInt32LE(offset) !== 0x02014b50) {
      throw invalidWorkbook("Excel workbook contains a damaged ZIP directory");
    }
    const flags = buffer.readUInt16LE(offset + 8);
    const compressedSize = buffer.readUInt32LE(offset + 20);
    const uncompressedSize = buffer.readUInt32LE(offset + 24);
    const nameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const entryCommentLength = buffer.readUInt16LE(offset + 32);
    const diskStart = buffer.readUInt16LE(offset + 34);
    const entryLength = 46 + nameLength + extraLength + entryCommentLength;
    if (
      offset + entryLength > eocdOffset ||
      (flags & 1) !== 0 ||
      diskStart !== 0 ||
      compressedSize === 0xffffffff ||
      uncompressedSize === 0xffffffff
    ) {
      throw invalidWorkbook("Excel workbook contains an unsupported ZIP entry");
    }
    uncompressedBytes += uncompressedSize;
    if (uncompressedBytes > MAX_WORKBOOK_UNCOMPRESSED_BYTES) {
      throw new HttpError(
        400,
        "WORKBOOK_TOO_LARGE",
        "Uncompressed Excel workbook must be 20 MB or smaller",
      );
    }
    offset += entryLength;
  }
  if (offset !== centralDirectoryOffset + centralDirectorySize) {
    throw invalidWorkbook("Excel workbook contains a damaged ZIP directory");
  }
}

function normalizeHeader(value) {
  return String(value ?? "").trim().toLowerCase();
}

function normalizeCellValue(value) {
  if (value && typeof value === "object" && !(value instanceof Date)) {
    return "[unsupported Excel cell value]";
  }
  return value;
}

function excelDate(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === "string" && value.trim()) return value.trim();
  return undefined;
}

function excelTime(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return `${String(value.getUTCHours()).padStart(2, "0")}:${String(value.getUTCMinutes()).padStart(2, "0")}`;
  }
  if (typeof value === "number" && value >= 0 && value < 1) {
    const totalMinutes = Math.round(value * 24 * 60) % (24 * 60);
    return `${String(Math.floor(totalMinutes / 60)).padStart(2, "0")}:${String(totalMinutes % 60).padStart(2, "0")}`;
  }
  if (typeof value === "string") return value.trim();
  return value;
}

function excelPrice(value) {
  if (typeof value === "string" && value.trim() !== "") {
    const normalized = value.trim();
    if (!/^\d+$/.test(normalized)) return value;
    return Number(normalized);
  }
  return value;
}

function excelBoolean(value) {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value === "boolean") return value;
  if (value === 1 || value === "1" || (typeof value === "string" && value.trim().toLowerCase() === "true")) {
    return true;
  }
  if (value === 0 || value === "0" || (typeof value === "string" && value.trim().toLowerCase() === "false")) {
    return false;
  }
  return value;
}

async function readWorksheet(buffer, sheetName) {
  validateZipContainer(buffer);
  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.load(buffer);
  } catch {
    throw invalidWorkbook("File is damaged or is not a readable Excel workbook");
  }

  if (workbook.worksheets.length === 0) {
    throw invalidWorkbook("Excel workbook does not contain any worksheets");
  }

  const selectedSheet = sheetName ?? workbook.worksheets[0].name;
  const worksheet = workbook.getWorksheet(selectedSheet);
  if (!worksheet) {
    throw new HttpError(400, "SHEET_NOT_FOUND", `Worksheet '${selectedSheet}' was not found`);
  }
  if (worksheet.rowCount < 1 || worksheet.columnCount < 1) {
    throw invalidWorkbook(`Worksheet '${selectedSheet}' is empty`);
  }

  if (worksheet.rowCount - 1 > MAX_IMPORT_ROWS) {
    throw new HttpError(
      400,
      "TOO_MANY_ROWS",
      `Worksheet cannot contain more than ${MAX_IMPORT_ROWS} data rows`,
    );
  }

  if (worksheet.rowCount < 2) {
    throw invalidWorkbook("Worksheet must contain a header row and at least one data row");
  }

  const headerRow = worksheet.getRow(1);
  const headers = Array.from({ length: headerRow.cellCount }, (_, index) =>
    normalizeHeader(headerRow.getCell(index + 1).value),
  );
  if (headers.some((header) => !header)) {
    throw invalidWorkbook("Header row contains an empty column name");
  }
  if (new Set(headers).size !== headers.length) {
    throw invalidWorkbook("Header row contains duplicate column names");
  }
  const unknownHeaders = headers.filter((header) => !allowedHeaders.has(header));
  if (unknownHeaders.length) {
    throw new HttpError(
      400,
      "UNKNOWN_COLUMNS",
      `Worksheet contains unsupported columns: ${unknownHeaders.join(", ")}`,
    );
  }
  const missingHeaders = requiredHeaders.filter((header) => !headers.includes(header));
  if (missingHeaders.length) {
    throw new HttpError(
      400,
      "MISSING_COLUMNS",
      `Worksheet is missing required columns: ${missingHeaders.join(", ")}`,
    );
  }

  const dataRows = [];
  for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber += 1) {
    const row = worksheet.getRow(rowNumber);
    const extraCells = Array.from(
      { length: Math.max(0, worksheet.columnCount - headers.length) },
      (_, index) => normalizeCellValue(row.getCell(headers.length + index + 1).value) ?? "",
    );
    if (extraCells.some((value) => value !== "")) {
      throw invalidWorkbook(`Worksheet row ${rowNumber} contains data without a column header`);
    }
    const values = headers.reduce((record, header, columnIndex) => {
      record[header] = normalizeCellValue(row.getCell(columnIndex + 1).value) ?? "";
      return record;
    }, {});
    if (Object.values(values).some((value) => value !== "")) {
      dataRows.push({ rowNumber, values });
    }
  }

  if (dataRows.length === 0) {
    throw invalidWorkbook("Worksheet does not contain any data rows");
  }
  return { selectedSheet, dataRows };
}

function parseRow(row) {
  const { values } = row;
  const raw = {
    routeId: values.routeid,
    busId: values.busid,
    companyId: values.companyid,
    departureTime: excelTime(values.departuretime),
    arrivalTime: excelTime(values.arrivaltime),
    duration: typeof values.duration === "string" ? values.duration.trim() : String(values.duration ?? ""),
    price: excelPrice(values.price),
    availableDate: excelDate(values.availabledate) ?? null,
    isActive: excelBoolean(values.isactive),
  };
  const result = createTripSchema.safeParse(raw);
  return result.success
    ? { rowNumber: row.rowNumber, data: result.data, errors: [] }
    : {
        rowNumber: row.rowNumber,
        data: null,
        errors: result.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      };
}

function tripKey(trip) {
  const availableDate = trip.availableDate
    ? new Date(trip.availableDate).toISOString().slice(0, 10)
    : "";
  return [trip.routeId, trip.busId, trip.companyId, trip.departureTime, availableDate].join("|");
}

async function validateReferences(rows) {
  const validRows = rows.filter(({ data, errors }) => data && errors.length === 0);
  const routeIds = [...new Set(validRows.map(({ data }) => data.routeId))];
  const busIds = [...new Set(validRows.map(({ data }) => data.busId))];
  const companyIds = [...new Set(validRows.map(({ data }) => data.companyId))];

  const [routes, buses, companies] = await Promise.all([
    routeIds.length
      ? prisma.route.findMany({ where: { id: { in: routeIds } }, select: { id: true } })
      : [],
    busIds.length
      ? prisma.bus.findMany({ where: { id: { in: busIds } }, select: { id: true, companyId: true } })
      : [],
    companyIds.length
      ? prisma.busCompany.findMany({ where: { id: { in: companyIds } }, select: { id: true } })
      : [],
  ]);

  const routeById = new Set(routes.map(({ id }) => id));
  const busById = new Map(buses.map((bus) => [bus.id, bus]));
  const companyById = new Set(companies.map(({ id }) => id));

  for (const row of validRows) {
    const { routeId, busId, companyId } = row.data;
    if (!routeById.has(routeId)) {
      row.errors.push({ field: "routeId", message: `Route '${routeId}' does not exist` });
    }
    const bus = busById.get(busId);
    if (!bus) {
      row.errors.push({ field: "busId", message: `Bus '${busId}' does not exist` });
    } else if (bus.companyId !== companyId) {
      row.errors.push({ field: "companyId", message: `Bus '${busId}' does not belong to company '${companyId}'` });
    }
    if (!companyById.has(companyId)) {
      row.errors.push({ field: "companyId", message: `Company '${companyId}' does not exist` });
    }
  }
}

async function markDuplicates(rows) {
  const seenKeys = new Set();
  const candidates = [];
  for (const row of rows) {
    if (!row.data || row.errors.length) continue;
    const key = tripKey(row.data);
    if (seenKeys.has(key)) {
      row.errors.push({ field: "row", message: "Duplicate trip schedule in this worksheet" });
    } else {
      seenKeys.add(key);
      candidates.push(row);
    }
  }

  if (candidates.length === 0) return;
  const [routeIds, busIds, companyIds, departureTimes] = [
    [...new Set(candidates.map(({ data }) => data.routeId))],
    [...new Set(candidates.map(({ data }) => data.busId))],
    [...new Set(candidates.map(({ data }) => data.companyId))],
    [...new Set(candidates.map(({ data }) => data.departureTime))],
  ];
  const existingTrips = await prisma.trip.findMany({
    where: {
      routeId: { in: routeIds },
      busId: { in: busIds },
      companyId: { in: companyIds },
      departureTime: { in: departureTimes },
    },
    select: { routeId: true, busId: true, companyId: true, departureTime: true, availableDate: true },
  });
  const existingKeys = new Set(existingTrips.map(tripKey));
  for (const row of candidates) {
    if (existingKeys.has(tripKey(row.data))) {
      row.errors.push({ field: "row", message: "Duplicate trip schedule already exists" });
    }
  }
}

async function validateWorkbook(buffer, sheetName) {
  const workbook = await readWorksheet(buffer, sheetName);
  if (workbook.dataRows.length > MAX_IMPORT_ROWS) {
    throw new HttpError(
      400,
      "TOO_MANY_ROWS",
      `Worksheet cannot contain more than ${MAX_IMPORT_ROWS} data rows`,
    );
  }
  const rows = workbook.dataRows.map(parseRow);
  await validateReferences(rows);
  await markDuplicates(rows);
  return { sheetName: workbook.selectedSheet, rows };
}

function buildReport(sheetName, rows, includeAllRows = false) {
  const validRows = rows.filter(({ errors }) => errors.length === 0);
  const invalidRows = rows.filter(({ errors }) => errors.length > 0);
  const report = {
    sheetName,
    totalRows: rows.length,
    validRows: validRows.length,
    invalidRows: invalidRows.length,
    preview: (includeAllRows ? rows : rows.slice(0, PREVIEW_LIMIT)).map((row) => ({
      rowNumber: row.rowNumber,
      status: row.errors.length ? "invalid" : "valid",
      data: row.data,
      errors: row.errors,
    })),
  };
  if (!includeAllRows && rows.length > PREVIEW_LIMIT) {
    report.previewLimit = PREVIEW_LIMIT;
  }
  return report;
}

async function previewTrips(buffer, sheetName) {
  const { sheetName: selectedSheet, rows } = await validateWorkbook(buffer, sheetName);
  return buildReport(selectedSheet, rows);
}

async function importTrips(buffer, sheetName) {
  const { sheetName: selectedSheet, rows } = await validateWorkbook(buffer, sheetName);
  const validRows = rows.filter(({ errors }) => errors.length === 0);
  const failedRows = [];
  let importedRows = 0;

  for (const row of validRows) {
    try {
      await prisma.trip.create({ data: row.data });
      importedRows += 1;
    } catch (error) {
      let message = "Database rejected this row";
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
        message = "A referenced route, bus, or company no longer exists";
      } else if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        message = "This trip schedule already exists";
      } else {
        console.error(`Trip Excel import failed at row ${row.rowNumber}:`, error);
      }
      failedRows.push({ rowNumber: row.rowNumber, code: "IMPORT_FAILED", message });
    }
  }

  const validationFailures = rows
    .filter(({ errors }) => errors.length > 0)
    .map((row) => ({
      rowNumber: row.rowNumber,
      code: "VALIDATION_FAILED",
      errors: row.errors,
    }));
  return {
    sheetName: selectedSheet,
    totalRows: rows.length,
    importedRows,
    failedRows: failedRows.length + validationFailures.length,
    validationFailures,
    importFailures: failedRows,
  };
}

module.exports = { previewTrips, importTrips };
