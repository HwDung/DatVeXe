const { Router } = require("express");
const { authenticate, optionalAuthenticate } = require("../../middleware/authenticate");
const ctrl = require("./bookings.controller");
const { authenticate } = require("../../middleware/authenticate");

const bookingsRouter = Router();

// Lấy danh sách vé đã đặt của người dùng
bookingsRouter.get("/my", (req, res, next) => {
  const authHeader = req.header("authorization");
  if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
    return authenticate(req, res, () => ctrl.getMyBookings(req, res));
  }
  return ctrl.getMyBookings(req, res);
});

bookingsRouter.post("/", ctrl.createBooking);
bookingsRouter.get("/lookup", ctrl.lookupBooking);
bookingsRouter.get("/me", authenticate, ctrl.listMyBookings);
bookingsRouter.get("/:id", ctrl.getBooking);
bookingsRouter.patch("/:id/cancel", ctrl.cancelBooking);

module.exports = { bookingsRouter };
