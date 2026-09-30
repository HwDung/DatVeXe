const service = require("./bookings.service");

async function createBooking(req, res) {
  try {
    const booking = await service.createBookingService(req.body);
    res.status(201).json(booking);
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: error.message || "Bad request" });
  }
}

async function lookupBooking(req, res) {
  try {
    const { bookingCode, phone } = req.query;
    if (!bookingCode || !phone) {
      return res.status(400).json({ message: "bookingCode and phone are required" });
    }
    const booking = await service.lookupBookingService(bookingCode, phone);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    res.json(booking);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
}

async function getBooking(req, res) {
  try {
    const booking = await service.getBookingService(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    res.json(booking);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
}

async function cancelBooking(req, res) {
  try {
    const booking = await service.cancelBookingService(req.params.id);
    res.json(booking);
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: error.message || "Bad request" });
  }
}

module.exports = { createBooking, lookupBooking, getBooking, cancelBooking };
