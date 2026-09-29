import type { CookieOptions, RequestHandler } from "express";
import { env } from "../../config/env";
import { HttpError } from "../../utils/http-error";
import { loginSchema, registerSchema } from "./auth.schemas";
import * as authService from "./auth.service";

const refreshCookieName = "refreshToken";

function refreshCookieOptions(expires?: Date): CookieOptions {
  return {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: env.COOKIE_SAME_SITE,
    path: "/api/auth",
    ...(expires ? { expires } : {}),
  };
}

function setRefreshCookie(response: Parameters<RequestHandler>[1], token: string, expiresAt: Date): void {
  response.cookie(refreshCookieName, token, refreshCookieOptions(expiresAt));
}

export const register: RequestHandler = async (request, response, next) => {
  try {
    const input = registerSchema.parse(request.body);
    const result = await authService.register(input);
    setRefreshCookie(response, result.refreshToken, result.refreshExpiresAt);
    response.status(201).json({ accessToken: result.accessToken, user: result.user });
  } catch (error) {
    next(error);
  }
};

export const login: RequestHandler = async (request, response, next) => {
  try {
    const input = loginSchema.parse(request.body);
    const result = await authService.login(input);
    setRefreshCookie(response, result.refreshToken, result.refreshExpiresAt);
    response.json({ accessToken: result.accessToken, user: result.user });
  } catch (error) {
    next(error);
  }
};

export const refresh: RequestHandler = async (request, response, next) => {
  try {
    const result = await authService.refreshSession(request.cookies?.[refreshCookieName]);
    setRefreshCookie(response, result.refreshToken, result.refreshExpiresAt);
    response.json({ accessToken: result.accessToken, user: result.user });
  } catch (error) {
    next(error);
  }
};

export const logout: RequestHandler = async (request, response, next) => {
  try {
    await authService.logout(request.cookies?.[refreshCookieName]);
    response.clearCookie(refreshCookieName, refreshCookieOptions());
    response.status(204).end();
  } catch (error) {
    next(error);
  }
};

export const me: RequestHandler = (request, response, next) => {
  if (!request.auth) {
    next(new HttpError(401, "UNAUTHORIZED", "Authentication required"));
    return;
  }
  response.json({
    user: {
      id: request.auth.userId,
      email: request.auth.email,
      roles: request.auth.roles,
      permissions: request.auth.permissions,
    },
  });
};