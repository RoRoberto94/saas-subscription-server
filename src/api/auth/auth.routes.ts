import { Router } from "express";
import { AuthController } from "./auth.controller";
import { registerSchema, loginSchema } from "./auth.validation";
import validate from "../middlewares/validate";
import { isAuthenticated } from "../middlewares/isAuthenticated";

const authController = new AuthController();
const authRouter = Router();

authRouter.post("/register", validate(registerSchema), authController.register);

authRouter.post("/login", validate(loginSchema), authController.login);

authRouter.get("/me", isAuthenticated, authController.getMe);

export default authRouter;
