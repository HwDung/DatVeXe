const service = require("./trips.service");
const { tripSearchSchema } = require("./trips.schemas");

async function searchTrips(req, res, next) {
  try {
    const query = tripSearchSchema.parse(req.query);
    const trips = await service.searchTripsService(query);
    res.json(trips);
  } catch (error) {
    next(error);
  }
}

async function getTripById(req, res) {
  try {
    const trip = await service.getTripByIdService(req.params.id);
    if (!trip) {
      return res.status(404).json({ message: "Trip not found" });
    }
    res.json(trip);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
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
