import type { RequestHandler } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { env } from "../config/env";
import { findActiveSessionById } from "../models/auth/session.model";
import { HttpError } from "../utils/http-error";

export const authenticate: RequestHandler = async (request, _response, next) => {
  const authorization = request.header("authorization");
  const [scheme, token] = authorization?.split(" ") ?? [];
  if (scheme?.toLowerCase() !== "bearer" || !token) {
    next(new HttpError(401, "UNAUTHORIZED", "Bearer access token required"));
    return;
  }

  let payload: JwtPayload;
  try {
    const verified = jwt.verify(token, env.JWT_ACCESS_SECRET, {
      issuer: "datvexe-api",
      audience: "datvexe-client",
    });
    if (typeof verified === "string") {
      throw new Error("JWT payload must be an object");
    }
    payload = verified;
  } catch {
    next(new HttpError(401, "INVALID_TOKEN", "Access token is invalid or expired"));
    return;
  }

  if (typeof payload.sub !== "string" || typeof payload.sid !== "string") {
    next(new HttpError(401, "INVALID_TOKEN", "Invalid access token"));
    return;
  }

  const session = await findActiveSessionById(payload.sid, payload.sub, new Date());

  if (!session) {
    next(new HttpError(401, "SESSION_REVOKED", "Session is invalid or expired"));
    return;
  }

  const roles = session.user.roles.map(({ role }) => role.name);
  const permissions = [
    ...new Set(
      session.user.roles.flatMap(({ role }) =>
        role.permissions.map(({ permission }) => permission.key),
      ),
    ),
  ];

  request.auth = {
    userId: session.user.id,
    sessionId: session.id,
    email: session.user.email,
    roles,
    permissions,
  };
  next();
};