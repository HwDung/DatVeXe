require('dotenv/config');
const assert = require('node:assert/strict');
const { once } = require('node:events');
const fs = require('node:fs');
const path = require('node:path');
const { prisma } = require('../src/lib/prisma');
const { app } = require('../src/app');
const { companies } = require('../prisma/seed-catalog');

async function verify() {
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}/api`;
  const password = process.env.DEMO_SEED_PASSWORD || 'RightwayDemo@2026';
  const accounts = [
    { email: 'admin.seed@rightway.test', role: 'admin' },
    { email: 'customer.demo@rightway.test', role: 'USER' },
    ...companies.flatMap(c => ['owner', 'manager', 'staff'].map(role => ({ email: `${role}.${c.key}@rightway.test`, role, company: c.name }))),
  ];
  const results = [];
  try {
    for (const account of accounts) {
      const login = await fetch(base + '/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: account.email, password }) });
      const session = await login.json();
      assert.equal(login.status, 200, `Login ${account.email}: ${JSON.stringify(session)}`);
      assert.ok(session.user.roles.includes(account.role));
      assert.equal(session.user.companyMembership?.company?.name, account.company);
      const headers = { Authorization: `Bearer ${session.accessToken}`, 'Content-Type': 'application/json' };
      const get = async (url, status) => {
        const response = await fetch(base + url, { headers });
        assert.equal(response.status, status, `${account.email} GET ${url}`);
        return response.json();
      };
      await get('/admin/users', account.role === 'admin' ? 200 : 403);
      await get('/bookings/my-bookings', account.role === 'USER' ? 200 : 403);
      if (account.company) {
        const buses = await get('/operator/buses', account.role === 'owner' ? 200 : 403);
        if (account.role === 'owner') assert.ok(buses.some(b => b.id.startsWith('seed_bus_')));
        const bookings = await get('/operator/bookings', 200);
        const ownedTrips = await prisma.trip.findMany({ where: { companyId: session.user.companyMembership.companyId }, select: { id: true } });
        const ids = new Set(ownedTrips.map(t => t.id));
        assert.ok(bookings.every(b => ids.has(b.tripId)), 'Company isolation');
        const boarding = await fetch(base + '/operator/qr/board', { method: 'POST', headers, body: '{}' });
        assert.equal(boarding.status, account.role === 'staff' ? 400 : 403);
      }
      results.push({ email: account.email, role: account.role, company: account.company || '—', login: 'PASS', authorization: 'PASS' });
    }
    for (const company of companies) {
      assert.ok(fs.existsSync(path.join(__dirname, '../../frontend/public', company.image)));
    }
    const seeded = await prisma.trip.findMany({ where: { id: { startsWith: 'seed_trip_' } }, include: { bus: true, company: true, route: true } });
    assert.equal(seeded.length, 24);
    assert.ok(seeded.every(t => t.isDemo && t.availableDate === null && t.sourceUrl && t.bus.image));
    console.table(results);
    console.log('PASS: 11 logins; database roles/permissions; company isolation; 24 sourced recurring trips; 3 local images.');
  } finally {
    await new Promise(resolve => server.close(resolve));
    await prisma.$disconnect();
  }
}

verify().catch(error => { console.error(error); process.exitCode = 1; });
