const { prisma } = require("../../lib/prisma");

async function searchTripsService(query) {
  const { origin, destination, date, minPrice, maxPrice, companies, rating, sort } = query;

  const whereClause = { isActive: true };
  if (origin) whereClause.route = { ...whereClause.route, origin };
  if (destination) whereClause.route = { ...whereClause.route, destination };
  if (date) {
    const queryDate = new Date(date);
    whereClause.OR = [
      { availableDate: queryDate },
      { availableDate: null },
    ];
  }

  if (minPrice || maxPrice) {
    whereClause.price = {};
    if (minPrice) whereClause.price.gte = parseInt(minPrice, 10);
    if (maxPrice) whereClause.price.lte = parseInt(maxPrice, 10);
  }

  if (companies) {
    const companyNames = companies.split(",");
    whereClause.company = { name: { in: companyNames } };
  }

  if (rating) {
    whereClause.company = { ...whereClause.company, rating: { gte: parseFloat(rating) } };
  }

  let orderBy = {};
  if (sort === "price_asc") orderBy = { price: "asc" };
  else if (sort === "price_desc") orderBy = { price: "desc" };
  else if (sort === "departure_asc") orderBy = { departureTime: "asc" };
  else if (sort === "rating_desc") orderBy = { company: { rating: "desc" } };

  return prisma.trip.findMany({
    where: whereClause,
    include: {
      route: true,
      bus: true,
      company: true,
    },
    orderBy: Object.keys(orderBy).length ? orderBy : undefined,
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
