// Both global grants and company-scoped grants are read from persisted RolePermission rows.
function authorizationFor(user) {
  const member = user.companyMembership;
  const activeRoles = (user.roles || []).map(item => item.role);
  if (member?.isActive && member.roleDefinition) activeRoles.push(member.roleDefinition);
  return {
    roles: [...new Set(activeRoles.map(role => role.name))],
    permissions: [...new Set(activeRoles.flatMap(role => (role.permissions || []).map(row => row.permission.key)))],
  };
}

module.exports = { authorizationFor };
