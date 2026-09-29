import type { RequestHandler } from "express";
import { HttpError } from "../utils/http-error";

export function requireRole(roleName: string): RequestHandler {
  return (request, _response, next) => {
    if (!request.auth) {
      next(new HttpError(401, "UNAUTHORIZED", "Authentication required"));
      return;
    }
    if (!request.auth.roles.includes(roleName)) {
      next(new HttpError(403, "FORBIDDEN", "Insufficient role"));
      return;
    }
    next();
  };
}

export function requirePermission(permissionKey: string): RequestHandler {
  return (request, _response, next) => {
    if (!request.auth) {
      next(new HttpError(401, "UNAUTHORIZED", "Authentication required"));
      return;
    }
    if (!request.auth.permissions.includes(permissionKey)) {
      next(new HttpError(403, "FORBIDDEN", "Insufficient permission"));
      return;
    }
    next();
  };
}