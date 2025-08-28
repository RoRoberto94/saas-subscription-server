import { Router } from "express";
import { AuthController } from "./auth.controller";
import { registerSchema } from "./auth.validation";
import validate from "../middlewares/validate";

const authController = new AuthController();
const authRouter = Router();

authRouter.post("/register", validate(registerSchema), authController.register);

export default authRouter;
