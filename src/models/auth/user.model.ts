import { prisma } from "../../lib/prisma";

export const userAuthorizationInclude = {
  roles: {
    include: {
      role: { include: { permissions: { include: { permission: true } } } },
    },
  },
} as const;

export function createCustomer(input: {
  email: string;
  fullName?: string;
  passwordHash: string;
}) {
  return prisma.user.create({
    data: {
      email: input.email,
      fullName: input.fullName,
      passwordHash: input.passwordHash,
      roles: { create: { role: { connect: { name: "USER" } } } },
    },
  });
}

export function findUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
    include: userAuthorizationInclude,
  });
}
