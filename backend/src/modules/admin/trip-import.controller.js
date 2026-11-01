const { tripImportQuerySchema } = require("./trip-import.schemas");
const tripImportService = require("./trip-import.service");

async function previewTrips(request, response, next) {
  try {
    const { sheetName } = tripImportQuerySchema.parse(request.query);
    response.json(await tripImportService.previewTrips(request.file.buffer, sheetName));
  } catch (error) {
    next(error);
  }
}

async function importTrips(request, response, next) {
  try {
    const { sheetName } = tripImportQuerySchema.parse(request.query);
    response.json(await tripImportService.importTrips(request.file.buffer, sheetName));
  } catch (error) {
    next(error);
  }
}

module.exports = { previewTrips, importTrips };
