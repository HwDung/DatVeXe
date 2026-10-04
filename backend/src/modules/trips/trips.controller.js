const service = require("./trips.service");
const { tripSearchSchema } = require("./trips.schemas");
const { tripIdSchema } = require("./trip-detail.schemas");

async function searchTrips(req, res, next) {
  try {
    const query = tripSearchSchema.parse(req.query);
    const trips = await service.searchTripsService(query);
    res.json(trips);
  } catch (error) {
    next(error);
  }
}

async function getTripById(req, res, next) {
  try {
    const id = tripIdSchema.parse(req.params.id);
    const trip = await service.getTripByIdService(id);
    res.json(trip);
  } catch (error) {
    next(error);
  }
}

async function getTripSeats(req, res) {
  try {
    const date = req.query.date;
    if (!date) {
      return res.status(400).json({ message: "Date is required" });
    }
    const seats = await service.getTripSeatsService(req.params.id, date);
    res.json(seats);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
}

module.exports = { searchTrips, getTripById, getTripSeats };
