import { Response, NextFunction } from "express";
import { prisma } from "../../lib/prisma";
import { AuthRequest } from "./isAuthenticated";

// Middleware to authorize requests based on ADMIN role.
export const isAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized." });
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user || user.role !== "ADMIN") {
      return res.status(403).json({
        message: "Forbidden: Access is restricted to administrators.",
      });
    }
    next();
  } catch (error) {
    return res.status(500).json({ message: "Internal server error." });
  }
};
