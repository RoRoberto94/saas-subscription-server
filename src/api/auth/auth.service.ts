import bcrypt from "bcryptjs";

import { prisma } from "../../lib/prisma";

export class AuthService {
  async registerUser(email: string, password: string) {
    // Using a transaction to ensure the user existence check and creation are atomic, preventing race conditions.
    const user = await prisma.$transaction(async (tx) => {
      const existingUser = await tx.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        throw new Error("User with this email already exists.");
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
        },
      });

      return newUser;
    });

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}
