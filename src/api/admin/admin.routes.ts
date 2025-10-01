import { Router } from "express";
import { AdminController } from "./admin.controller";
import { isAuthenticated } from "../middlewares/isAuthenticated";
import { isAdmin } from "../middlewares/isAdmin";

const adminRouter = Router();
const adminController = new AdminController();

// Protected admin route, requires both authentication and admin role.
adminRouter.get(
  "/users",
  isAuthenticated,
  isAdmin,
  adminController.getAllUsers
);

export default adminRouter;
