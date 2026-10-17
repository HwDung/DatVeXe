const { Router } = require("express");
const ctrl = require("./bookings.controller");

const bookingsRouter = Router();

bookingsRouter.post("/", ctrl.createBooking);
bookingsRouter.get("/lookup", ctrl.lookupBooking);
bookingsRouter.get("/status-check", ctrl.statusCheck);
bookingsRouter.get("/my-bookings", ctrl.getMyBookings);
bookingsRouter.get("/:id", ctrl.getBooking);
bookingsRouter.patch("/:id/cancel", ctrl.cancelBooking);

module.exports = { bookingsRouter };
