import { Request, Response } from "express";
import { BillingService } from "./billing.service";

interface AuthRequest extends Request {
  user?: { id: string };
}

const billingService = new BillingService();

export class BillingController {
  async createCheckoutSession(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const { priceId, clientUrl } = req.body;
      if (!priceId || !clientUrl) {
        return res
          .status(400)
          .json({ message: "priceId and clientUrl are required." });
      }

      const result = await billingService.createCheckoutSession(
        userId,
        priceId,
        clientUrl
      );
      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }
}
