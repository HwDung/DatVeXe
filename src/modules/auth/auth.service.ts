import bcrypt from "bcryptjs";
import * as sessionModel from "../../models/auth/session.model";
import * as userModel from "../../models/auth/user.model";
import { HttpError } from "../../utils/http-error";
import {
  createAccessToken,
  createRefreshToken,
  hashToken,
  REFRESH_TOKEN_TTL_MS,
} from "../../utils/tokens";

const passwordCost = 12;

function serializeUser(user: {
  id: string;
  email: string;
  fullName: string | null;
  roles: Array<{
    role: {
      name: string;
      permissions: Array<{ permission: { key: string } }>;
    };
  }>;
}) {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    roles: user.roles.map(({ role }) => role.name),
    permissions: [
      ...new Set(
        user.roles.flatMap(({ role }) =>
          role.permissions.map(({ permission }) => permission.key),
        ),
      ),
    ],
  };
}

async function createSession(userId: string) {
  const refreshToken = createRefreshToken();
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);
  const session = await sessionModel.createSessionRecord({
    userId,
    refreshTokenHash: hashToken(refreshToken),
    expiresAt,
  });

  return {
    accessToken: createAccessToken(userId, session.id),
    refreshToken,
    refreshExpiresAt: expiresAt,
  };
}

export async function register(input: {
  email: string;
  password: string;
  fullName?: string;
}) {
  const passwordHash = await bcrypt.hash(input.password, passwordCost);
  try {
    const user = await userModel.createCustomer({
      email: input.email,
      fullName: input.fullName,
      passwordHash,
    });
    const tokens = await createSession(user.id);
    return { ...tokens, user: { id: user.id, email: user.email, fullName: user.fullName, roles: ["USER"], permissions: [] } };
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
      throw new HttpError(409, "EMAIL_TAKEN", "An account with this email already exists");
    }
    throw error;
  }
}

export async function login(input: { email: string; password: string }) {
  const user = await userModel.findUserByEmail(input.email);
  if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
    throw new HttpError(401, "INVALID_CREDENTIALS", "Email or password is incorrect");
  }

  const tokens = await createSession(user.id);
  return { ...tokens, user: serializeUser(user) };
}

export async function refreshSession(refreshToken: string | undefined) {
  if (!refreshToken) {
    throw new HttpError(401, "INVALID_SESSION", "Refresh session is missing or expired");
  }

  const currentHash = hashToken(refreshToken);
  const session = await sessionModel.findActiveSessionByRefreshHash(currentHash, new Date());
  if (!session) {
    throw new HttpError(401, "INVALID_SESSION", "Refresh session is missing or expired");
  }

  const nextRefreshToken = createRefreshToken();
  const nextExpiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);
  const rotation = await sessionModel.rotateSessionRefreshToken({
    sessionId: session.id,
    currentHash,
    nextHash: hashToken(nextRefreshToken),
    expiresAt: nextExpiresAt,
    now: new Date(),
  });
  if (rotation.count !== 1) {
    throw new HttpError(401, "INVALID_SESSION", "Refresh session was already rotated");
  }

  return {
    accessToken: createAccessToken(session.userId, session.id),
    refreshToken: nextRefreshToken,
    refreshExpiresAt: nextExpiresAt,
    user: serializeUser(session.user),
  };
}

export async function logout(refreshToken: string | undefined): Promise<void> {
  if (!refreshToken) return;
  await sessionModel.revokeSessionByRefreshHash(hashToken(refreshToken), new Date());
}