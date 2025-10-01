import { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { prisma } from "../../lib/prisma";

const authService = new AuthService();

interface AuthRequest extends Request {
  user?: { id: string };
}

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

  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      const result = await authService.loginUser(email, password);

      return res.status(200).json(result);
    } catch (error: any) {
      if (error.message === "Invalid credentials.") {
        return res.status(401).json({ message: error.message });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  async getMe(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ message: "User not authenticated." });
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, createdAt: true, role: true },
      });

      if (!user) {
        return res.status(404).json({ message: "User not found." });
      }

      return res.status(200).json(user);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  }
}
