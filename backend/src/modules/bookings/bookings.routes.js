const { Router } = require("express");
const { authenticate, optionalAuthenticate } = require("../../middleware/authenticate");
const ctrl = require("./bookings.controller");

const bookingsRouter = Router();

// Lấy danh sách vé đã đặt của người dùng
bookingsRouter.get("/my", optionalAuthenticate, ctrl.getMyBookings);

bookingsRouter.post("/", optionalAuthenticate, ctrl.createBooking);
bookingsRouter.get("/lookup", ctrl.lookupBooking);
bookingsRouter.get("/me", authenticate, ctrl.listMyBookings);
bookingsRouter.get("/:id", optionalAuthenticate, ctrl.getBooking);
bookingsRouter.patch("/:id/cancel", optionalAuthenticate, ctrl.cancelBooking);

module.exports = { bookingsRouter };
