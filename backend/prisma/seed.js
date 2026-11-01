require('dotenv/config');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { companies, arrivalTime } = require('./seed-catalog');
const { seedRbac } = require('./seed-rbac');
const prisma = new PrismaClient();

async function seedAccount(db, email, fullName, passwordHash, role, companyId) {
  const account = await db.user.upsert({ where: { email }, create: { email, fullName, passwordHash }, update: {} });
  const definition = await db.role.findUniqueOrThrow({ where: { name: role } });
  // Operational roles are assigned through the company-scoped Role FK, not a client flag.
  if (companyId) {
    await db.companyMembership.upsert({ where: { userId: account.id },
      create: { userId: account.id, companyId, role }, update: { companyId, role, isActive: true } });
  } else {
    await db.userRole.upsert({ where: { userId_roleId: { userId: account.id, roleId: definition.id } },
      create: { userId: account.id, roleId: definition.id }, update: {} });
  }
  return account;
}

async function seedDatabase(db = prisma) {
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_DEMO_SEED !== 'true') throw new Error('Demo seed is disabled in production.');
  const password = process.env.DEMO_SEED_PASSWORD || 'RightwayDemo@2026';
  if (password.length < 12 || Buffer.byteLength(password, 'utf8') > 72) throw new Error('DEMO_SEED_PASSWORD must be 12–72 bytes.');
  const hash = await bcrypt.hash(password, 12);
  return db.$transaction(async tx => {
    await seedRbac(tx);
    const admin = await seedAccount(tx, 'admin.seed@rightway.test', 'Quản trị viên demo', hash, 'admin');
    const customer = await seedAccount(tx, 'customer.demo@rightway.test', 'Khách hàng demo', hash, 'USER');
    const accounts = [{ email: admin.email, role: 'admin' }, { email: customer.email, role: 'USER' }];
    const demoTrips = [];
    const sampleBookings = [];
    for (const c of companies) {
      const company = await tx.busCompany.upsert({ where: { name: c.name },
        create: { name: c.name, website: c.website, description: c.description },
        update: { website: c.website, description: c.description } });
      const operatorAccounts = {};
      for (const role of ['owner', 'manager', 'staff']) {
        const account = await seedAccount(tx, role + '.' + c.key + '@rightway.test', c.name + ' – ' + role + ' demo', hash, role, company.id);
        operatorAccounts[role] = account;
        accounts.push({ email: account.email, role, company: c.name });
      }
      // Stable fixture IDs make repeated runs idempotent without touching user-created records.
      const busId = 'seed_bus_' + c.key;
      const busData = { name: c.name + ' – Xe demo 01', type: c.type, totalSeats: c.seats, companyId: company.id, image: c.image, imageSourceUrl: c.imageSourceUrl };
      await tx.bus.upsert({ where: { id: busId }, create: { id: busId, ...busData }, update: { image: c.image, imageSourceUrl: c.imageSourceUrl } });
      for (const [routeIndex, pair] of c.routes.entries()) {
        const route = await tx.route.upsert({ where: { origin_destination: { origin: pair.origin, destination: pair.destination } },
          create: { origin: pair.origin, destination: pair.destination }, update: {} });
        for (const [timeIndex, departureTime] of ['08:00', '14:00', '22:00'].entries()) {
          const id = 'seed_trip_' + c.key + '_' + routeIndex + '_' + timeIndex;
          const data = { routeId: route.id, companyId: company.id, busId, departureTime,
            arrivalTime: arrivalTime(departureTime, pair.minutes), duration: Math.floor(pair.minutes / 60) + 'h ' + (pair.minutes % 60) + 'p',
            price: pair.price, availableDate: null, isDemo: true, sourceUrl: pair.sourceUrl || c.sourceUrl };
          const trip = await tx.trip.upsert({ where: { id }, create: { id, ...data }, update: { isDemo: true, sourceUrl: data.sourceUrl } });
          demoTrips.push(trip);
          if (routeIndex === 0 && timeIndex < 2) sampleBookings.push({trip,collector:operatorAccounts.staff});
        }
      }
    }
    for (let i = 0; i < sampleBookings.length; i++) {
      const { trip, collector } = sampleBookings[i];
      // Stable unique booking codes span all companies, while each pair has paid/cancelled examples.
      const code = 'DEMO2026' + String(i + 1).padStart(3, '0');
      if (await tx.booking.findUnique({ where: { bookingCode: code } })) continue;
      const today = new Date(Date.now() + 7 * 3600000).toISOString().slice(0, 10);
      const tripDate = new Date(new Date(today + 'T00:00:00Z').getTime() + 2 * 86400000);
      const paid = i % 2 === 0;
      const status = paid ? 'confirmed' : 'cancelled';
      const passenger = { passengerName: 'Khách demo ' + (i + 1), passengerPhone: '0900000001', passengerEmail: customer.email };
      const booking = await tx.booking.create({ data: { bookingCode: code, tripId: trip.id, userId: customer.id, tripDate,
        ...passenger, seatCode: 'A1', totalPrice: trip.price, status, paymentStatus: paid ? 'paid' : 'unpaid', paymentMethod: 'cash',
        tickets: { create: { ticketCode: code + '-A1', seatCode: 'A1', ...passenger, price: trip.price, status } },
        ...(paid ? { receipt: { create: { amount: trip.price, method: 'cash', reference: 'DEMO-NO-REAL-PAYMENT', receivedById: collector.id } } } : {}),
      }, include: { tickets: true } });
      if (paid) await tx.seatStatus.create({ data: { tripId: trip.id, tripDate, seatCode: 'A1', status: 'booked', bookingId: booking.id, ticketId: booking.tickets[0].id } });
    }
    // Retire only obsolete fixtures from the old seed; retain bookings/history and all other records.
    await tx.trip.updateMany({ where: { isDemo: false, bus: { name: { startsWith: 'Bus ' } }, company: { name: { in: ['Phương Trang', 'Thành Bưởi', 'Hạnh Cafe', 'Thaco'] } } }, data: { isActive: false } });
    await tx.trip.updateMany({ where: { company: { OR: [{ name: { startsWith: 'DEMO ' } }, { name: 'Rightway Demo' }, { name: { startsWith: 'uiqa_' } }] } }, data: { isActive: false } });
    const promotions = [{ id: 'seed_promo_welcome', title: 'Ưu đãi demo khách mới', code: 'DEMO10', discount: 10, description: 'Chương trình mô phỏng để demo, không phải ưu đãi của nhà xe.' }];
    for (const promo of promotions) await tx.promotion.upsert({where:{id:promo.id},create:promo,update:{}});
    await tx.news.upsert({ where: { id: 'seed_news_guide' }, create: { id: 'seed_news_guide', title: 'Hướng dẫn dùng dữ liệu demo Rightway', category: 'Hướng dẫn', summary: 'Các chuyến có nhãn DEMO dùng để thử đặt vé và phân quyền.', content: 'Thông tin nhà xe và ảnh có nguồn công khai; giờ, giá, số chỗ và thanh toán trong bộ seed là dữ liệu mô phỏng. Xem SEED_DEMO.md để biết nguồn và tài khoản.' }, update: {} });
    return { accounts, trips: demoTrips.length, bookings: sampleBookings.length };
  }, { timeout: 120000, maxWait: 15000 });
}

if (require.main === module) seedDatabase().then(result => {
  console.log('Seed complete: ' + result.trips + ' recurring demo trips; ' + result.bookings + ' sample bookings.');
  console.table(result.accounts);
  console.log('New demo accounts use DEMO_SEED_PASSWORD, default RightwayDemo@2026. Existing passwords are preserved.');
}).catch(error => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
module.exports = { seedDatabase };
