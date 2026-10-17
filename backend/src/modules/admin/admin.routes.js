const { Router } = require("express");
const { prisma } = require("../../lib/prisma");
const { authenticate } = require("../../middleware/authenticate");
const { requireRole } = require("../../middleware/authorization");
const { tripScheduleRouter } = require("./trip-schedule.routes");
const { tripManagementRouter } = require("./trip-management.routes");
const { pickupDropoffPointsRouter } = require("./pickup-dropoff-points.routes");
const { routeManagementRouter } = require("./route-management.routes");
const { busesRouter } = require("./buses.routes");

const adminRouter = Router();

adminRouter.use(authenticate, requireRole("admin"));
adminRouter.use("/trips", tripScheduleRouter);
adminRouter.use("/trips", tripManagementRouter);
adminRouter.use("/pickup-dropoff-points", pickupDropoffPointsRouter);
adminRouter.use("/routes", routeManagementRouter);
adminRouter.use("/buses", busesRouter);

async function getDashboardStats(_req, res) {
  try {
    const totalBookings = await prisma.booking.count();
    const revenueObj = await prisma.booking.aggregate({
      _sum: { totalPrice: true },
      where: { paymentStatus: "paid" },
    });
    const totalUsers = await prisma.user.count();
    const totalTrips = await prisma.trip.count();
    const recentBookings = await prisma.booking.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: { trip: { include: { route: true, company: true } } },
    });

    res.json({
      totalBookings,
      revenue: revenueObj._sum.totalPrice || 0,
      totalUsers,
      totalTrips,
      recentBookings,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
}

adminRouter.get("/dashboard", getDashboardStats);

adminRouter.get("/users", async (_req, res) => {
  try {
    const users = await prisma.user.findMany({
      include: { roles: { include: { role: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

adminRouter.patch("/bookings/:id/status", async (req, res) => {
  try {
    const id = req.params.id;
    const { status } = req.body;
    const booking = await prisma.booking.update({
      where: { id },
      data: { status },
    });
    res.json(booking);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

adminRouter.get("/trips", async (_req, res) => {
  try {
    const trips = await prisma.trip.findMany({
      include: { route: true, bus: true, company: true },
      orderBy: { createdAt: "desc" },
    });
    res.json(trips);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

adminRouter.get("/trips/:id", async (req, res) => {
  try {
    const trip = await prisma.trip.findUnique({
      where: { id: req.params.id },
      include: { route: true, bus: true, company: true },
    });
    res.json(trip);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

adminRouter.post("/trips", async (req, res) => {
  try {
    const trip = await prisma.trip.create({ data: req.body });
    res.json(trip);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

adminRouter.put("/trips/:id", async (req, res) => {
  try {
    const trip = await prisma.trip.update({ where: { id: req.params.id }, data: req.body });
    res.json(trip);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

adminRouter.delete("/trips/:id", async (req, res) => {
  try {
    await prisma.trip.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});
//
const crudHandler = (model, includes) => ({
  list: async (_req, res) => {
    try {
      res.json(await model.findMany({ include: includes, orderBy: { createdAt: "desc" } }));
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  },
  get: async (req, res) => {
    try {
      res.json(await model.findUnique({ where: { id: req.params.id }, include: includes }));
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  },
  create: async (req, res) => {
    try {
      res.json(await model.create({ data: req.body }));
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  },
  update: async (req, res) => {
    try {
      res.json(await model.update({ where: { id: req.params.id }, data: req.body }));
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  },
  delete: async (req, res) => {
    try {
      await model.delete({ where: { id: req.params.id } });
      res.json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  },
});

// Explicit booking management for Admin
adminRouter.get("/bookings", async (req, res) => {
  try {
    const { search, status, date } = req.query;
    const where = {};

    if (status && status.trim()) {
      where.status = status.trim();
    }

    if (date && date.trim()) {
      const tripDate = new Date(date);
      if (!isNaN(tripDate.getTime())) {
        where.tripDate = tripDate;
      }
    }

    if (search && search.trim()) {
      const term = search.trim();
      where.OR = [
        { bookingCode: { contains: term } },
        { passengerName: { contains: term } },
        { passengerPhone: { contains: term } },
        { passengerEmail: { contains: term } },
      ];
    }

    const bookings = await prisma.booking.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        trip: {
          include: {
            route: true,
            company: true,
            bus: true,
          },
        },
      },
    });

    res.json(bookings);
  } catch (error) {
    console.error("Admin getBookings error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

adminRouter.get("/bookings/:id", async (req, res) => {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
      include: {
        trip: {
          include: {
            route: true,
            company: true,
            bus: true,
          },
        },
        user: true,
        seatStatuses: true,
      },
    });
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    res.json(booking);
  } catch (error) {
    console.error("Admin getBooking error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

const handleUpdateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, paymentStatus } = req.body;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { seatStatuses: true },
    });
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    const updateData = {};
    if (status) updateData.status = status;
    if (paymentStatus) updateData.paymentStatus = paymentStatus;

    // Transaction to update booking and handle seat release if cancelled
    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.booking.update({
        where: { id },
        data: updateData,
        include: {
          trip: {
            include: {
              route: true,
              company: true,
              bus: true,
            },
          },
        },
      });

      if (status === "cancelled") {
        // Release seats
        await tx.seatStatus.updateMany({
          where: { bookingId: id },
          data: { status: "available", bookingId: null },
        });
      } else if (status === "confirmed") {
        // Ensure seats are booked
        await tx.seatStatus.updateMany({
          where: { bookingId: id },
          data: { status: "booked" },
        });
      }

      return updated;
    });

    res.json(result);
  } catch (error) {
    console.error("Admin updateBookingStatus error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

adminRouter.patch("/bookings/:id/status", handleUpdateBookingStatus);
adminRouter.put("/bookings/:id", handleUpdateBookingStatus);

adminRouter.delete("/bookings/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.$transaction(async (tx) => {
      await tx.seatStatus.updateMany({
        where: { bookingId: id },
        data: { status: "available", bookingId: null },
      });
      await tx.booking.delete({ where: { id } });
    });
    res.json({ success: true });
  } catch (error) {
    console.error("Admin deleteBooking error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

const genericModels = [
  { name: "companies", model: prisma.busCompany, includes: { buses: true } },
  { name: "promotions", model: prisma.promotion, includes: undefined },
  { name: "news", model: prisma.news, includes: undefined },
];

for (const { name, model, includes } of genericModels) {
  const handler = crudHandler(model, includes);
  adminRouter.get(`/${name}`, handler.list);
  adminRouter.get(`/${name}/:id`, handler.get);
  adminRouter.post(`/${name}`, handler.create);
  adminRouter.put(`/${name}/:id`, handler.update);
  adminRouter.delete(`/${name}/:id`, handler.delete);
}

module.exports = { adminRouter, getDashboardStats };
