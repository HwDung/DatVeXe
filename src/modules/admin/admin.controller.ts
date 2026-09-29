import type { RequestHandler } from "express";
import { z } from "zod";
import * as adminService from "./admin.service";

export const listUsers: RequestHandler = async (_request, response, next) => {
  try {
    response.json({ users: await adminService.listUsers() });
  } catch (error) {
    next(error);
  }
};

export const replaceUserRoles: RequestHandler = async (request, response, next) => {
  try {
    const { roles } = z.object({
      roles: z.array(z.string().min(1)).min(1).max(10),
    }).parse(request.body);
    const userId = z.string().min(1).parse(request.params.userId);
    await adminService.replaceUserRoles(userId, roles);
    response.status(204).end();
  } catch (error) {
    next(error);
  }
};

export const listRoles: RequestHandler = async (_request, response, next) => {
  try {
    response.json({ roles: await adminService.listRoles() });
  } catch (error) {
    next(error);
  }
};