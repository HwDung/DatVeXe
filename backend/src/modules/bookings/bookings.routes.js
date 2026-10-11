const { Router } = require("express");
const { authenticate } = require("../../middleware/authenticate");
const ctrl = require("./bookings.controller");

const bookingsRouter = Router();
bookingsRouter.post("/", ctrl.createBooking);
bookingsRouter.get("/lookup", ctrl.lookupBooking);
bookingsRouter.get("/me", authenticate, ctrl.listMyBookings);
bookingsRouter.get("/:id", ctrl.getBooking);
bookingsRouter.patch("/:id/cancel", ctrl.cancelBooking);

module.exports = { bookingsRouter };
