const { createTripSchema, tripIdSchema, updateTripSchema } = require("./trip-management.schemas");
const tripManagementService = require("./trip-management.service");

async function listTrips(_request, response, next) {
  try {
    response.json(await tripManagementService.listTrips());
  } catch (error) {
    next(error);
  }
}

async function exportTrips(_request, response, next) {
  try {
    const workbook = await tripManagementService.exportTrips();
    const timestamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
    response
      .status(200)
      .set({
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="trips-${timestamp}.xlsx"`,
        "Content-Length": workbook.length,
      })
      .send(workbook);
  } catch (error) {
    next(error);
  }
}

async function getTrip(request, response, next) {
  try {
    const id = tripIdSchema.parse(request.params.id);
    response.json(await tripManagementService.getTrip(id));
  } catch (error) {
    next(error);
  }
}

async function createTrip(request, response, next) {
  try {
    const data = createTripSchema.parse(request.body);
    response.status(201).json(await tripManagementService.createTrip(data));
  } catch (error) {
    next(error);
  }
}

async function updateTrip(request, response, next) {
  try {
    const id = tripIdSchema.parse(request.params.id);
    const data = updateTripSchema.parse(request.body);
    response.json(await tripManagementService.updateTrip(id, data));
  } catch (error) {
    next(error);
  }
}

async function deleteTrip(request, response, next) {
  try {
    const id = tripIdSchema.parse(request.params.id);
    response.json(await tripManagementService.deleteTrip(id));
  } catch (error) {
    next(error);
  }
}

module.exports = { listTrips, exportTrips, getTrip, createTrip, updateTrip, deleteTrip };