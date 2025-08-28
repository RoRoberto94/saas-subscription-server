import { Request, Response } from "express";

import { AuthService } from "./auth.service";

const authService = new AuthService();

export class AuthController {
  async register(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      const user = await authService.registerUser(email, password);

      return res.status(201).json(user);
    } catch (error: any) {
      if (error.message === "User with this email already exists.") {
        return res.status(409).json({ message: error.message });
      }

      return res.status(500).json({ message: "Internal server error" });
    }
  }
}
