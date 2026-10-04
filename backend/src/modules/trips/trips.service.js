const { prisma } = require("../../lib/prisma");

async function searchTripsService(query) {
  const { origin, destination, date, minPrice, maxPrice, companies, rating, departurePeriods, sort } = query;

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

  return prisma.trip.findMany({
    where: whereClause,
    include: {
      route: true,
      bus: true,
      company: true,
    },
    orderBy: sortOptions[sort] || { departureTime: "asc" },
  });
}

function getTripByIdService(id) {
  return prisma.trip.findUnique({
    where: { id },
    include: {
      route: true,
      bus: true,
      company: true,
    },
  });
}

function getTripSeatsService(id, dateStr) {
  const date = new Date(dateStr);
  return prisma.seatStatus.findMany({
    where: {
      tripId: id,
      tripDate: date,
    },
  });
}

module.exports = { searchTripsService, getTripByIdService, getTripSeatsService };
