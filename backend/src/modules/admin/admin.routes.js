const { Router } = require("express");
const { prisma } = require("../../lib/prisma");
const { authenticate } = require("../../middleware/authenticate");
const { requireRole } = require("../../middleware/authorization");
const { tripManagementRouter } = require("./trip-management.routes");
const { pickupDropoffPointsRouter } = require("./pickup-dropoff-points.routes");
const { routeManagementRouter } = require("./route-management.routes");
const { busesRouter } = require("./buses.routes");

const adminRouter = Router();

adminRouter.use(authenticate, requireRole("admin"));
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

const genericModels = [
  { name: "companies", model: prisma.busCompany, includes: { buses: true } },
  { name: "bookings", model: prisma.booking, includes: { trip: { include: { route: true, company: true } } } },
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
