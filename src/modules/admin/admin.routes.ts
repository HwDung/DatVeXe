import { Router } from "express";
import { authenticate } from "../../middleware/authenticate";
import { requirePermission, requireRole } from "../../middleware/authorization";
import * as adminController from "./admin.controller";

export const adminRouter = Router();
adminRouter.use(authenticate, requireRole("ADMIN"));

adminRouter.get("/users", requirePermission("users:read"), adminController.listUsers);
adminRouter.put("/users/:userId/roles", requirePermission("users:manage"), adminController.replaceUserRoles);
adminRouter.get("/roles", requirePermission("roles:read"), adminController.listRoles);