// This is the initial dataset. At runtime, RolePermission in SQL Server is authoritative.
const work = ['operator.access', 'operator.work', 'operator.support'];
const roleGrants = {
  admin: { description: 'Quản trị viên hệ thống', permissions: ['admin.access'] },
  USER: { description: 'Khách hàng', permissions: ['booking.create'] },
  owner: { description: 'Chủ nhà xe', permissions: [...work, 'operator.fleet.manage', 'operator.trips.manage', 'operator.employees.manage', 'operator.employees.managers', 'operator.revenue.read', 'operator.payment-issues.read'] },
  manager: { description: 'Quản lý nhà xe', permissions: [...work, 'operator.employees.manage', 'operator.payment-issues.read'] },
  staff: { description: 'Nhân viên nhà xe', permissions: [...work, 'operator.board'] },
};

async function seedRbac(db) {
  for (const [name, definition] of Object.entries(roleGrants)) {
    const role = await db.role.upsert({ where: { name }, create: { name, description: definition.description }, update: { description: definition.description } });
    for (const key of definition.permissions) {
      const permission = await db.permission.upsert({ where: { key }, create: { key, description: key }, update: {} });
      await db.rolePermission.upsert({ where: { roleId_permissionId: { roleId: role.id, permissionId: permission.id } }, create: { roleId: role.id, permissionId: permission.id }, update: {} });
    }
  }
}

module.exports = { roleGrants, seedRbac };
