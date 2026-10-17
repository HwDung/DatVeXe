const { prisma } = require("../../lib/prisma");
const { HttpError } = require("../../utils/http-error");

async function searchTripsService(query) {
  const { origin, destination, date, minPrice, maxPrice, companies, busTypes, rating, departurePeriods, sort } = query;

  const whereClause = { isActive: true };
  if (origin || destination) {
    whereClause.route = {};
    if (origin) whereClause.route.origin = origin;
    if (destination) whereClause.route.destination = destination;
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    whereClause.price = {};
    if (minPrice !== undefined) whereClause.price.gte = minPrice;
    if (maxPrice !== undefined) whereClause.price.lte = maxPrice;
  }

  const companyFilter = {};
  if (companies?.length) companyFilter.name = { in: companies };
  if (rating !== undefined) companyFilter.rating = { gte: rating };
  if (Object.keys(companyFilter).length) whereClause.company = companyFilter;

  if (busTypes?.length) {
    whereClause.bus = { type: { in: busTypes } };
  }

  const andConditions = [];
  if (date) {
    andConditions.push({
      OR: [
        { availableDate: date },
        { availableDate: null },
      ],
    });
  }

  if (departurePeriods?.length) {
    const departureRanges = {
      early: { lt: "06:00" },
      morning: { gte: "06:00", lt: "12:00" },
      afternoon: { gte: "12:00", lt: "18:00" },
      evening: { gte: "18:00" },
    };
    andConditions.push({
      OR: departurePeriods.map((period) => ({ departureTime: departureRanges[period] })),
    });
  }

  if (andConditions.length) whereClause.AND = andConditions;

  const sortOptions = {
    price_asc: { price: "asc" },
    price_desc: { price: "desc" },
    departure_asc: { departureTime: "asc" },
    departure_desc: { departureTime: "desc" },
    rating_desc: { company: { rating: "desc" } },
  };

  const trips = await prisma.trip.findMany({
    where: whereClause,
    include: {
      route: true,
      bus: true,
      company: true,
      seatStatuses: date ? {
        where: { tripDate: date, status: { in: ["booked", "held"] } },
      } : false,
    },
    orderBy: sortOptions[sort] || { departureTime: "asc" },
  });

  return trips.map((trip) => {
    const bookedCount = trip.seatStatuses ? trip.seatStatuses.length : 0;
    const totalSeats = trip.bus?.totalSeats || 40;
    const seatsAvailable = Math.max(0, totalSeats - bookedCount);
    const { seatStatuses, ...rest } = trip;
    return { ...rest, seatsAvailable };
  });
}

async function getFilterOptionsService() {
  const [companies, buses, routes, priceAgg] = await Promise.all([
    prisma.busCompany.findMany({ select: { id: true, name: true, rating: true } }),
    prisma.bus.findMany({ select: { type: true }, distinct: ["type"] }),
    prisma.route.findMany({ select: { origin: true, destination: true } }),
    prisma.trip.aggregate({
      _min: { price: true },
      _max: { price: true },
      where: { isActive: true },
    }),
  ]);

  const busTypes = buses.map((b) => b.type).filter(Boolean);
  const origins = [...new Set(routes.map((r) => r.origin).filter(Boolean))];
  const destinations = [...new Set(routes.map((r) => r.destination).filter(Boolean))];

  return {
    companies,
    busTypes,
    origins,
    destinations,
    minPrice: priceAgg._min.price || 100000,
    maxPrice: priceAgg._max.price || 1000000,
  };
}

async function getTripByIdService(id) {
  const trip = await prisma.trip.findUnique({
    where: { id },
    include: {
      route: true,
      bus: true,
      company: true,
    },
  });
  if (!trip) {
    throw new HttpError(404, "TRIP_NOT_FOUND", "Trip not found");
  }
  return trip;
}

async function getTripSeatsService(id, date) {
  const trip = await prisma.trip.findUnique({
    where: { id },
    select: { id: true, bus: { select: { totalSeats: true } } },
  });
  if (!trip) {
    throw new HttpError(404, "TRIP_NOT_FOUND", "Trip not found");
  }

  const statuses = await prisma.seatStatus.findMany({
    where: {
      tripId: id,
      tripDate: date,
    },
    select: { seatCode: true, status: true },
  });

  const statusBySeatCode = new Map(statuses.map(({ seatCode, status }) => [seatCode, status]));
  const columns = ["A", "B", "C"];

  return Array.from({ length: trip.bus.totalSeats }, (_, index) => {
    const seatCode = `${columns[index % columns.length]}${Math.floor(index / columns.length) + 1}`;
    return {
      seatCode,
      status: statusBySeatCode.get(seatCode) || "available",
    };
  });
}

module.exports = { searchTripsService, getTripByIdService, getTripSeatsService, getFilterOptionsService };
