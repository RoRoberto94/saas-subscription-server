import { prisma } from "../../lib/prisma";

export class AdminService {
  // Service method to fetch all users with their subscription status.
  async getAllUsers() {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        subscription: {
          select: {
            stripePriceId: true,
            stripeCurrentPeriodEnd: true,
          },
        },
      },
    });
    return users;
  }
}
