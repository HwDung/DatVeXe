const { Router } = require("express");
const ctrl = require("./bookings.controller");

const bookingsRouter = Router();
bookingsRouter.post("/", ctrl.createBooking);
bookingsRouter.get("/lookup", ctrl.lookupBooking);
bookingsRouter.get("/:id", ctrl.getBooking);
bookingsRouter.patch("/:id/cancel", ctrl.cancelBooking);

module.exports = { bookingsRouter };
