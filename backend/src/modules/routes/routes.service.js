const { prisma } = require("../../lib/prisma");

async function getPopularRoutesService() {
  const routes = await prisma.route.findMany({
    where: { trips: { some: { isActive: true } } },
    take: 6,
    orderBy: [{ origin: 'asc' }, { destination: 'asc' }],
    include: {
      trips: {
        where: { isActive: true },
        include: {
          company: true,
        },
      },
    },
  });

  return routes.map((r) => {
    const minPrice = r.trips.length > 0 ? Math.min(...r.trips.map((t) => t.price)) : 0;
    const topCompany = r.trips.length > 0 ? r.trips[0].company : null;
    return {
      id: r.id,
      origin: r.origin,
      destination: r.destination,
      minPrice,
      topCompany: topCompany ? topCompany.name : null,
      rating: topCompany ? topCompany.rating : null,
      departureTimes: r.trips.map(t => t.departureTime).sort(),
      companies: [...new Set(r.trips.map(t => t.company.name))],
      isDemo: r.trips.every(t => t.isDemo),
    };
  });
}

async function getCitiesService() {
  const routes = await prisma.route.findMany({
    where: { trips: { some: { isActive: true } } },
    select: {
      origin: true,
      destination: true,
    },
  });

  const cities = new Set();
  routes.forEach((r) => {
    cities.add(r.origin);
    cities.add(r.destination);
  });

  return Array.from(cities).sort();
}

module.exports = { getPopularRoutesService, getCitiesService };
