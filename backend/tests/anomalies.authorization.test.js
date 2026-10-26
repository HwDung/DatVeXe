const test = require("node:test");
const assert = require("node:assert/strict");
const { authenticate } = require("../src/middleware/authenticate");
const { requireRole } = require("../src/middleware/authorization");
const { adminRouter } = require("../src/modules/admin/admin.routes");

test("admin anomaly routes are registered beneath the authenticated admin router", () => {
  assert.equal(typeof adminRouter, "function");
  const routeLayers = adminRouter.stack.filter((layer) => layer.route);
  assert.ok(routeLayers.some((layer) => layer.route.path === "/anomalies" && layer.route.methods.get));
  assert.ok(routeLayers.some((layer) => layer.route.path === "/anomalies/:bookingId" && layer.route.methods.get));
  assert.ok(routeLayers.some((layer) => layer.route.path === "/anomalies/:bookingId/review" && layer.route.methods.patch));
  assert.ok(adminRouter.stack.some((layer) => layer.name === "authenticate"));
});

test("authentication rejects missing credentials and role middleware rejects non-admins", async () => {
  let authenticationError;
  await authenticate({ header: () => undefined }, {}, (error) => { authenticationError = error; });
  assert.equal(authenticationError.status, 401);

  let authorizationError;
  requireRole("admin")(
    { auth: { roles: ["user"] } },
    {},
    (error) => { authorizationError = error; },
  );
  assert.equal(authorizationError.status, 403);

  let nextCalled = false;
  requireRole("admin")(
    { auth: { roles: ["ADMIN"] } },
    {},
    () => { nextCalled = true; },
  );
  assert.equal(nextCalled, true);
});
