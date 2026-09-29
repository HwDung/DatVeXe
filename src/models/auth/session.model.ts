import { prisma } from "../../lib/prisma";
import { userAuthorizationInclude } from "./user.model";

export function createSessionRecord(input: {
  userId: string;
  refreshTokenHash: string;
  expiresAt: Date;
}) {
  return prisma.session.create({ data: input });
}

export function findActiveSessionByRefreshHash(refreshTokenHash: string, now: Date) {
  return prisma.session.findFirst({
    where: { refreshTokenHash, revokedAt: null, expiresAt: { gt: now } },
    include: { user: { include: userAuthorizationInclude } },
  });
}

export function findActiveSessionById(sessionId: string, userId: string, now: Date) {
  return prisma.session.findFirst({
    where: {
      id: sessionId,
      userId,
      revokedAt: null,
      expiresAt: { gt: now },
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          roles: {
            include: {
              role: {
                include: { permissions: { include: { permission: true } } },
              },
            },
          },
        },
      },
    },
  });
}

export function rotateSessionRefreshToken(input: {
  sessionId: string;
  currentHash: string;
  nextHash: string;
  expiresAt: Date;
  now: Date;
}) {
  return prisma.session.updateMany({
    where: {
      id: input.sessionId,
      refreshTokenHash: input.currentHash,
      revokedAt: null,
      expiresAt: { gt: input.now },
    },
    data: { refreshTokenHash: input.nextHash, expiresAt: input.expiresAt },
  });
}

export function revokeSessionByRefreshHash(refreshTokenHash: string, revokedAt: Date) {
  return prisma.session.updateMany({
    where: { refreshTokenHash, revokedAt: null },
    data: { revokedAt },
  });
}